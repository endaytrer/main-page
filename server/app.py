import json
import sys
import os
import time
import re
from flask import Flask, request
import MySQLdb
from typing import Optional

app = Flask(__name__)


db: Optional[MySQLdb.Connection] = None

def acquire_db() -> MySQLdb.Connection:
    global db
    active = db is not None and db.ping(True)
    
    if active:
        return db
    
    if db is not None:
        db.close()

    for i in range(10):
        try:
            conn: MySQLdb.Connection = MySQLdb.connect(host=os.environ["MYSQL_HOST"], port=int(os.environ["MYSQL_PORT"]), user=os.environ["MYSQL_USER"], password=os.environ["MYSQL_PASSWORD"], database=os.environ["MYSQL_DATABASE"])
            break
        except:
            if i == 9:
                print("Cannot connect to database. Exit.", file=sys.stderr, flush=True)
                exit(1)
            print("Unable to connect. Retry in 1s...\n", flush=True)
            time.sleep(1)
    return conn
            
        
@app.route("/blogs/stat/<name>")
def blog(name):
    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE `blogs` SET `reads` = `reads` + 1 WHERE `id` = %s", (name,))
    cursor.close()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.`title`, b.`license`, b.`likes`, b.`reads`, b.`created`, b.`last_modified`, b.`password` IS NOT NULL, b.`hint`, t.`id`, t.`name` as tag FROM `blogs` b
        LEFT JOIN `blog_tag` bt ON b.`id` = bt.`blog_id`
        LEFT JOIN `tags` t ON bt.`tag_id` = t.`id`
        WHERE b.`id` = %s
    """, (name,))
    ans = cursor.fetchall()
    cursor.close()
    conn.commit()
    print(ans)
    if len(ans) == 0:
        return json.dumps({"success": False, "error": "Cannot find blog"})
    fetch_result = {
        "title": ans[0][0],
        "license": ans[0][1],
        "likes": ans[0][2],
        "reads": ans[0][3],
        "created": ans[0][4].isoformat(),
        "last_modified": ans[0][5].isoformat(),
        "need_password": bool(ans[0][6]),
        "hint": ans[0][7],
        "tags": []
    }
    if ans[0][8] != None:
        fetch_result["tags"] = [{"id": i[8], "name": i[9]} for i in ans]
    return json.dumps(fetch_result)



@app.route("/blogs/like/<name>")
def like(name):
    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE `blogs` SET `likes` = `likes` + 1 WHERE `id` = %s", (name,))
    cursor.close()
    conn.commit();
    return "OK"

@app.route("/blogs/unlike/<name>")
def unlike(name):
    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE `blogs` SET `likes` = `likes` - 1 WHERE `id` = %s", (name,))
    cursor.close()
    conn.commit();
    return "OK"

BLOG_PROPERTY_LIST = ["id", "title", "license", "likes", "reads", "created", "last_modified"]   

@app.route("/blogs/count")
def blog_count():
    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), SUM(`reads`), SUM(`likes`) FROM `blogs`");
    count, reads, likes = cursor.fetchone()
    cursor.close()
    conn.commit()
    return json.dumps({"count": int(count), "reads": int(reads), "likes": int(likes)})

@app.route("/blogs/list")
def list():
    conn = acquire_db()
    page = int(request.args["page"]) if "page" in request.args and request.args["page"].isdigit() else 0
    limit = int(request.args["limit"]) if "limit" in request.args and request.args["limit"].isdigit() else 10
    order_by = request.args['orderBy'] if "orderBy" in request.args and request.args["orderBy"] in BLOG_PROPERTY_LIST else "created"
    descent = "descent" in request.args

    command = f"SELECT b.`id`, b.`title`, b.`reads`, b.`likes`, b.`created`, b.`last_modified`, b.`password` IS NOT NULL FROM `blogs` b"
    
    cursor_exec_args = ()
    if "tag" in request.args and request.args["tag"].isdigit():
        command += " INNER JOIN `blog_tag` bt ON b.`id` = bt.`blog_id` WHERE bt.`tag_id` = %s"
        cursor_exec_args = (int(request.args["tag"]),)
    
    # filter by password requirement
    if "need_password" in request.args and request.args["need_password"] in ["true", "false"]:
        if request.args["need_password"] == "true":
            command += " WHERE b.`password` IS NOT NULL"
        else:
            command += " WHERE b.`password` IS NULL"

    command += f" ORDER BY `{order_by}` {'DESC' if descent else 'ASC'} LIMIT {limit} OFFSET {page * limit}"

    print(command)
    cursor = conn.cursor()
    cursor.execute(command, cursor_exec_args)
    ans = cursor.fetchall()
    cursor.close()
    conn.commit()
    return json.dumps([{"id": i[0], "title": i[1], "reads": i[2], "likes": i[3], "created": i[4].isoformat(), "lastModified": i[5].isoformat(), "needPassword": bool(i[6])} for i in ans])

@app.route("/tags/list")
def tag_list():
    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("SELECT `id`, `name` FROM `tags`");
    ans = cursor.fetchall()
    cursor.close()
    fetched_results = [{ "id": i[0], "name": i[1] } for i in ans];
    return json.dumps(fetched_results)

SCAN_LINES = 10
PASSWORD_REGEX = re.compile(r"^>\s+Password:\s*(.*?)$")
HINT_REGEX = re.compile(r"^>\s+Hint:\s*(.*?)$")

SECRET_BLOG_DIR = "/var/secret_blogs"
"""
get content of a blog
"""
@app.route("/blogs/content")
def get_content():
    if "id" not in request.args or "password" not in request.args:
        return "illegal parameters", 403

    conn = acquire_db()
    cursor = conn.cursor()
    cursor.execute("SELECT `id` FROM `blogs` WHERE `id` = %s AND `password` = %s", (request.args["id"], request.args["password"]))
    ans = cursor.fetchall()
    cursor.close()
    print(ans)
    if len(ans) != 1 or ans[0][0] != request.args["id"]:
        return "forbidden", 403
    
    path = os.path.join(SECRET_BLOG_DIR, request.args["id"])
    try:
        fd = open(path, "r")
        content = ""
        for _ in range(SCAN_LINES):
            line = fd.readline()
            stripped_line = line.strip()
            if PASSWORD_REGEX.match(stripped_line) is None and HINT_REGEX.match(stripped_line) is None:
                content += line
        
        content += fd.read()
        return content

    except:
        return "cannot read", 403
    finally:
        fd.close()

app.run(host="0.0.0.0", port=80)
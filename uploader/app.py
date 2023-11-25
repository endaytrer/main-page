import re
import os
import sys
import time
import datetime
import MySQLdb
from typing import NamedTuple, Optional


STARTUPS = [
"""CREATE TABLE IF NOT EXISTS `blogs` (
    `id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255),
    `license` VARCHAR(255),
    `likes` INT DEFAULT 0,
    `reads` INT DEFAULT 0,
    `created` DATETIME,
    `last_modified` DATETIME,
    PRIMARY KEY (`id`)
);""",
"""CREATE TABLE IF NOT EXISTS `tags` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`id`)
);""",
"""CREATE TABLE IF NOT EXISTS `blog_tag` (
    `blog_id` VARCHAR(255) NOT NULL,
    `tag_id` INT NOT NULL,
    FOREIGN KEY (`blog_id`) REFERENCES `blogs` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
);"""
]

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
            if db is not None:
                db.close()
            conn: MySQLdb.Connection = MySQLdb.connect(host=os.environ["MYSQL_HOST"], port=int(os.environ["MYSQL_PORT"]), user=os.environ["MYSQL_USER"], password=os.environ["MYSQL_PASSWORD"], database=os.environ["MYSQL_DATABASE"])
            break
        except:
            if i == 9:
                print("Cannot connect to database. Exit.", file=sys.stderr, flush=True)
                exit(1)
            print("Unable to connect. Retry in 1s...\n", flush=True)
            time.sleep(1)
    return conn


BLOG_DIR = "/var/blogs"
# test if tables are created
conn = acquire_db()
cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SHOW TABLES")
ans = cursor.fetchall()
cursor.close()

if len(ans) == 0:
    for command in STARTUPS:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute(command)
        cursor.close()
    conn.commit()

blog_hashes = {}

cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SELECT `id`, `last_modified` FROM `blogs`")
ans = cursor.fetchall()
blog_hashes: dict[str, datetime.datetime] = {i[0]: i[1] for i in ans}

Blog = NamedTuple("Blog", [('id', str), ('title', str), ("license", str), ("likes", int), ("reads", int), ("created", datetime.datetime), ("last_modified", datetime.datetime)])

delta_insert: list[Blog] = []
delta_update: list[Blog] = []



# main loop

SCAN_LINES = 10
TITLE_REGEX = re.compile(r"^#\s(.*?)$")
LICENSE_REGEX = re.compile(r"^>\s+License:\s*(.*?)$")
TAG_REGEX = re.compile(r"^>\s+Tags:\s*([^\s][^,]*(,\s*[^\s][^,]*)*),?$")
def parse_markdown(filename: str, path: str, stat: os.stat_result) -> Blog:
    id = filename
    created: datetime.datetime = datetime.datetime.fromtimestamp(round(stat.st_ctime))
    last_modified: datetime.datetime = datetime.datetime.fromtimestamp(round(stat.st_mtime))
    title = None
    license = None
    # TODO: add tags support
    with open(path, "r") as f:
        for _ in range(SCAN_LINES):
            line = f.readline().strip()
            if title is None:
                match = TITLE_REGEX.fullmatch(line)
                if match is not None:
                    title = match.groups()[0]
            if license is None:
                match = LICENSE_REGEX.fullmatch(line)
                if match is not None:
                    license = match.groups()[0]
    
    return Blog(id, title, license, 0, 0, created, last_modified)

def update_hash():
    posts = os.listdir(BLOG_DIR)
    delta_insert: list[Blog] = []
    delta_update: list[Blog] = []
    delta_delete: set[str] = set(blog_hashes.keys())

    for post in posts:
        if not post.endswith(".md"):
            continue
        if post in delta_delete:
            delta_delete.remove(post)

        path = os.path.join(BLOG_DIR, post)
        if not os.path.isfile(path):
            continue

        stat = os.stat(path)
        blog = parse_markdown(post, path, stat)
        if post not in blog_hashes.keys():
            # new post
            delta_insert.append(blog)
        elif blog_hashes[post] != datetime.datetime.fromtimestamp(round(stat.st_mtime)):
            # modified post
            delta_update.append(blog)

    conn = acquire_db()
    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO `blogs` (`id`, `title`, `license`, `created`, `last_modified`) VALUES
        (%s, %s, %s, %s, %s)
        """, [(row.id, row.title, row.license, row.created, row.last_modified) for row in delta_insert]
    )
    cursor.close()
    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("""
        UPDATE `blogs`
        SET `title` = %s, `license` = %s, `created` = %s, `last_modified` = %s
        WHERE `id` = %s
        """, [(row.title, row.license, row.created, row.last_modified, row.id) for row in delta_update])
    cursor.close()

    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("DELETE FROM `blogs` WHERE `id` = %s", [(i,) for i in delta_delete])
    cursor.close()

    conn.commit()

    for blog in delta_insert:
        blog_hashes[blog.id] = blog.last_modified
    for blog in delta_update:
        blog_hashes[blog.id] = blog.last_modified
    for blog in delta_delete:
        del blog_hashes[blog]

    return len(delta_insert) + len(delta_update) + len(delta_delete)
    
    
    

INTERVAL = 10
print("Process started for watching blog changes.", flush=True)
while True:
    num = update_hash()
    if num != 0:
        print(f"updated {num} blog(s)", flush=True)
    time.sleep(INTERVAL)
        
        

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
    `password` VARCHAR(255),
    `hint` VARCHAR(255),
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
);""",
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

# In uploader, every blog placed in both places can be either secret or public. server and client are responsible to keep blogs in secret_blogs secret.
BLOG_DIRS = ["/var/blogs", "/var/secret_blogs"]

# test if tables are created
conn = acquire_db()
cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SHOW TABLES")
ans = cursor.fetchall()
cursor.close()

if len(ans) < len(STARTUPS):
    for command in STARTUPS:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute(command)
        cursor.close()
    conn.commit()


# rc = reference count, remove tag if == 0
class Tag:
    name: str
    rc: int

    def __init__(self, name: str, rc: int):
        self.name = name
        self.rc = rc

cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SELECT * FROM `tags`")
ans = cursor.fetchall()
cursor.close()

tags: dict[int, Tag] = {int(i[0]): Tag(i[1], 0) for i in ans}
tags_mapping = {tags[t].name: t for t in tags}

cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SELECT `tag_id`, COUNT(*) FROM `blog_tag` GROUP BY `tag_id`")
ans = cursor.fetchall()
cursor.close()

for row in ans:
    tags[row[0]].rc = row[1]


old_tag_names = {tags[i].name for i in tags}
new_tag_names: set[str] = set()


cursor: MySQLdb.cursors.Cursor = conn.cursor()
cursor.execute("SELECT `id`, `last_modified` FROM `blogs`")
ans = cursor.fetchall()
cursor.close()
blog_hashes: dict[str, datetime.datetime] = {i[0]: i[1] for i in ans}


Blog = NamedTuple("Blog", [('id', str), ('title', str), ("license", str), ("likes", int), ("reads", int), ("created", datetime.datetime), ("last_modified", datetime.datetime), ("tag_names", list[str]), ("password", Optional[str]), ("hint", Optional[str])])

delta_insert: list[Blog] = []
delta_update: list[Blog] = []



# main loop

SCAN_LINES = 10
TITLE_REGEX = re.compile(r"^#\s(.*?)$")
LICENSE_REGEX = re.compile(r"^>\s+License:\s*(.*?)$")
PASSWORD_REGEX = re.compile(r"^>\s+Password:\s*(.*?)$")
HINT_REGEX = re.compile(r"^>\s+Hint:\s*(.*?)$")
TAG_REGEX = re.compile(r"^>\s+Tags:\s*([^\s][^,]*(,\s*[^\s][^,]*)*),?$")
def parse_markdown(filename: str, path: str, stat: os.stat_result) -> Blog:
    global old_tag_names
    global new_tag_names

    id = filename
    created: datetime.datetime = datetime.datetime.fromtimestamp(round(stat.st_ctime))
    last_modified: datetime.datetime = datetime.datetime.fromtimestamp(round(stat.st_mtime))
    title = None
    license = None
    post_tag_names: Optional[list[str]] = None
    password: Optional[str] = None
    hint: Optional[str] = None
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
            if post_tag_names is None:
                match = TAG_REGEX.fullmatch(line)
                if match is not None:
                    post_tag_names = [s.strip() for s in match.groups()[0].split(",")]
            if password is None:
                match = PASSWORD_REGEX.fullmatch(line)
                if match is not None:
                    password = match.groups()[0]
            if hint is None:
                match = HINT_REGEX.fullmatch(line)
                if match is not None:
                    hint = match.groups()[0]
    if post_tag_names is None:
        post_tag_names = []
    else:
        for tag in post_tag_names:
            if tag not in old_tag_names and tag not in new_tag_names:
                new_tag_names.add(tag)
            
    return Blog(id, title, license, 0, 0, created, last_modified, post_tag_names, password, hint)

def update_hash():
    global new_tag_names
    global old_tag_names
    # second argument is the prefix.
    posts: list[tuple[str, str]] = [(i, prefix) for prefix in BLOG_DIRS for i in os.listdir(prefix)]

    new_tag_names = set()
    delta_insert: list[Blog] = []
    delta_update: list[Blog] = []
    delta_delete: set[str] = set(blog_hashes.keys())

    for (post, prefix) in posts:
        if not post.endswith(".md"):
            continue
        if post in delta_delete:
            delta_delete.remove(post)

        path = os.path.join(prefix, post)
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
    # insert tags and acquire tag id
    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("INSERT INTO `tags` (`name`) VALUES (%s)", [(t,) for t in new_tag_names])
    cursor.close()

    # acquire tag id
    for t in new_tag_names:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute("SELECT `id` FROM `tags` WHERE `name` = %s", (t,))
        id, = cursor.fetchone()
        cursor.close()

        tags[id] = Tag(t, 0)
        tags_mapping[t] = id
    
        
    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO `blogs` (`id`, `title`, `license`, `created`, `last_modified`, `password`, `hint`) VALUES
        (%s, %s, %s, %s, %s, %s, %s)
        """, [(row.id, row.title, row.license, row.created, row.last_modified, row.password, row.hint) for row in delta_insert]
    )
    cursor.close()
    # Also, insert tags and update reference count
    for row in delta_insert:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.executemany("""
        INSERT INTO `blog_tag` (`blog_id`, `tag_id`) VALUES (%s, %s)
        """, [(row.id, tags_mapping[t]) for t in row.tag_names])
        
        for tag_name in row.tag_names:
            tag_id = tags_mapping[tag_name]
            tags[tag_id].rc += 1

        cursor.close()

    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("""
        UPDATE `blogs`
        SET `title` = %s, `license` = %s, `created` = %s, `last_modified` = %s, `password` = %s, `hint` = %s
        WHERE `id` = %s
        """, [(row.title, row.license, row.created, row.last_modified, row.password, row.hint, row.id) for row in delta_update])
    cursor.close()

    # update tags by removing old tags and creating new tags
    for row in delta_update:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute("SELECT `tag_id`, COUNT(*) FROM `blog_tag` WHERE `blog_id` = %s GROUP BY `tag_id`", (row.id, ))
        ans = cursor.fetchall()
        cursor.close()


        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute("DELETE FROM `blog_tag` WHERE `blog_id` = %s", (row.id, ))
        cursor.close()

        for id, count in ans:
            tags[id].rc -= count

        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.executemany("INSERT INTO `blog_tag` (`blog_id`, `tag_id`) VALUES (%s, %s)", [(row.id, tags_mapping[t]) for t in row.tag_names])
        cursor.close()

        for tag_name in row.tag_names:
            tag_id = tags_mapping[tag_name]
            tags[tag_id].rc += 1

    # since deleting blogs have cascade effect on tags, one should update the rc of tags first
    for id in delta_delete:
        cursor: MySQLdb.cursors.Cursor = conn.cursor()
        cursor.execute("SELECT `tag_id`, COUNT(*) FROM `blog_tag` WHERE `blog_id` = %s GROUP BY `tag_id`", (id, ))
        ans = cursor.fetchall()
        cursor.close()

        for id, count in ans:
            tags[id].rc -= count
        

    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("DELETE FROM `blogs` WHERE `id` = %s", [(i,) for i in delta_delete])
    cursor.close()


    
    # cleaning tags if rf <= 0
    unused_tags = [i for i in tags if tags[i].rc == 0]
    
    cursor: MySQLdb.cursors.Cursor = conn.cursor()
    cursor.executemany("DELETE FROM `tags` WHERE `id` = %s", [(i,) for i in unused_tags])
    cursor.close()

    conn.commit()

    old_tag_names = old_tag_names.union(new_tag_names)
    new_tag_names = set()
    
    # remove unused names
    for tag in unused_tags:
        name = tags[tag].name
        del tags[tag]
        del tags_mapping[name]
        old_tag_names.remove(name)

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
        
        

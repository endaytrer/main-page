import json
import csv
from threading import Lock, Event, Thread
from executer import Executer
from flask import Flask
app = Flask(__name__, static_url_path="/")

cache: dict[str, tuple[str, str, float]] = {}
statistics: dict[str, list[int, int]] = {}
changed: list[bool] = [False]


# initialize statistics
with open('statistic.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        statistics[row[0]] = [int(row[1]), int(row[2])]


def get_post(name: str) -> tuple[str, float]:
    if name not in cache:
        return None
    changed[0] = True
    if name not in statistics:
        statistics[name] = [1, 0]
    else:
        statistics[name][0] += 1
    return cache[name]


@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/sites/<subsite>/")
def other(subsite):
    return app.send_static_file("sites/" + subsite + "/index.html")

@app.route("/api/blogs/content/<name>")
def blog(name):
    post = get_post(name)
    if post == None:
        return "Not found"
    views = 0
    likes = 0
    if name in statistics:
        views, likes = statistics[name]
    return json.dumps({"title": post[0], "content": post[1], "lastModified": post[2], "views": views, "likes": likes})


@app.route("/api/blogs/like/<name>")
def like(name):
    changed[0] = True
    if name not in statistics:
        statistics[name] = [0, 1]
    else:
        statistics[name][1] += 1
    return "OK"

@app.route("/api/blogs/unlike/<name>")
def unlike(name):
    changed[0] = True
    if name not in statistics:
        statistics[name] = [0, -1]
    else:
        statistics[name][1] -= 1
    return "OK"

@app.route("/api/blogs/list")
def list():
    return [{"name": name, "title": cache[name][0], "lastModified": cache[name][2]} for name in cache.keys()]

cache_updater = Executer(10, cache, statistics, changed)
cache_updater.start()

main_thread = Thread(target=lambda: app.run('127.0.0.1', 12897))
main_thread.start()
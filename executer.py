import threading
import os
import csv
import markdown2
import time

class Executer(threading.Thread):
    cache: dict[str, list[str, str, float]]
    statistics: dict[str, tuple[int, int]]
    changed: list[bool]

    def update_cache(self):
        posts = os.listdir('blogs')
        nameSet = set()
        for key in self.cache.keys():
            nameSet.add(key)
        for post in posts:
            mtime = os.stat('blogs/' + post).st_mtime
            if post in self.cache:
                nameSet.remove(post)
                if mtime <= self.cache[post][2]:
                    continue
            with open("blogs/" + post, 'r') as f:
                content = f.read()
                title = content.split('\n')[0].strip('#').strip()
                self.cache[post] = (
                    title,
                    markdown2.markdown(content, extras=["footnotes", "tables", "fenced-code-blocks"]),
                    mtime
                )
        if len(nameSet) == 0:
            return
        self.changed[0] = True
        for name in nameSet:
            del self.cache[name]
            if name in self.statistics.keys():
                del self.statistics[name]

    def dump_statistic(self):
        if not self.changed[0]:
            return
        self.changed[0] = False
        with open('statistic.csv', 'w') as f:
            writer = csv.writer(f)
            for key in self.statistics:
                writer.writerow((key, *self.statistics[key]))

    def update(self):
        self.update_cache()
        self.dump_statistic()
        
        

    def __init__(self, interval, cache: dict[str, tuple[str, str, float]], statistics: dict[str, list[int, int]], changed: list[bool]) -> None:
        self.cache = cache
        self.statistics = statistics
        self.interval = interval
        self.changed = changed
        super(Executer, self).__init__()
    
    def run(self) -> None:
        self.update_cache()
        while True:
            print("updated")
            time.sleep(self.interval)
            self.update()

import threading
import os
import csv
import markdown
from markdown_katex.extension import tex2html
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
                # pass 1, render basic html
                content = markdown.markdown(content, extensions=["markdown.extensions.extra", "markdown.extensions.codehilite"])
                blocks = content.split("$$")
                # pass 1, render block TeX
                content = ""
                isTeXBlock = False
                for block in blocks:
                    if not isTeXBlock:
                        content += block
                        isTeXBlock = True
                        continue
                    try:
                        html = tex2html(block, {'no_inline_svg': True, 'insert_fonts_css': False, 'display-mode': True})
                        content += html
                    finally:
                        isTeXBlock = False
                # pass 3, render inline TeX
                blocks = content.split("$")
                # pass 1, render block TeX
                content = ""
                isTeXInline = False
                for block in blocks:
                    if not isTeXInline:
                        content += block
                        isTeXInline = True
                        continue
                    try:
                        html: str = tex2html(block, {'no_inline_svg': True, 'insert_fonts_css': False})
                        content += html
                    finally:
                        isTeXInline = False

                
                self.cache[post] = (
                    title,
                    content,
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
        print("updated")
        
        

    def __init__(self, interval, cache: dict[str, tuple[str, str, float]], statistics: dict[str, list[int, int]], changed: list[bool]) -> None:
        self.cache = cache
        self.statistics = statistics
        self.interval = interval
        self.changed = changed
        super(Executer, self).__init__()
    
    def run(self) -> None:
        self.update_cache()
        while True:
            time.sleep(self.interval)
            self.update()

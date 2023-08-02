import threading
import os
import sys
import csv
import markdown
import time
import re

from markdown.core import Markdown
from markdown.inlinepatterns import SimpleTagPattern
from markdown.preprocessors import Preprocessor
 
class TexBlockPreprocessor(Preprocessor):
    TEX_RE = re.compile(r"(\$\$)[ ]*\n(.*?)(?<=\n)(\$\$)[ ]*", re.MULTILINE | re.DOTALL | re.VERBOSE)

    def __init__(self, md: Markdown | None = None) -> None:
        super().__init__(md)
    def run(self, lines: list[str]) -> list[str]:
        text = "\n".join(lines)
        while True:
            m = self.TEX_RE.search(text)
            if m:
                code = "<tex-block>" + self._escape(m.group(2)) + "</tex-block>"
                placeholder = self.md.htmlStash.store(code)
                text = f'{text[:m.start()]}\n{placeholder}\n{text[m.end():]}'
            else:
                break
        return text.split('\n')

    def _escape(self, txt):
        """ basic html escaping """
        txt = txt.replace('&', '&amp;')
        txt = txt.replace('<', '&lt;')
        txt = txt.replace('>', '&gt;')
        txt = txt.replace('"', '&quot;')
        return txt

class TexExtension(markdown.Extension):
    def extendMarkdown(self, md: Markdown) -> None:
        md.preprocessors.register(TexBlockPreprocessor(md), 'tex-block', 25)
        inline_math_re = r'(\$)(.*?)\$'
        inline_math_tag = SimpleTagPattern(inline_math_re, 'inline-math')
        md.inlinePatterns.register(inline_math_tag, 'inline-math', 200)

        

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
                try:
                    content = markdown.markdown(content, extensions=["markdown.extensions.extra", "markdown.extensions.codehilite", TexExtension()])
                except:
                    print("cannot parse markdown of {}".format(post), file=sys.stderr)

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

"""Compare structural text between the live Jekyll site and the local V2 build."""
import html
import re
import subprocess
import sys
import urllib.request

LIVE = "https://wadbrant.com"
LOCAL = "http://localhost:4000"

PAGES = [
    ("/", "home"),
    ("/posts/why-indie-games-fail/", "post"),
    ("/posts/deep-into-mystery-games/", "post2"),
    ("/tags/", "tags"),
    ("/categories/", "categories"),
    ("/archives/", "archives"),
    ("/about/", "about"),
    ("/cv/", "cv"),
    ("/tags/product-management/", "tag-pm"),
    ("/categories/indie/", "cat-indie"),
]

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36"}


def fetch(url):
    request = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(request) as response:
        return response.read().decode("utf-8", "replace")


def clean(markup):
    markup = re.sub(r"<script[\s\S]*?</script>", " ", markup)
    markup = re.sub(r"<style[\s\S]*?</style>", " ", markup)
    markup = re.sub(r"<!--[\s\S]*?-->", " ", markup)
    return markup


def texts(markup, selector_start, selector_end):
    start = markup.find(selector_start)
    end = markup.find(selector_end, start)
    if start < 0 or end < 0:
        return []
    body = clean(markup[start:end])
    body = re.sub(r"<[^>]+>", "\x00", body)
    lines = [re.sub(r"\s+", " ", html.unescape(line)).strip() for line in body.split("\x00")]
    return [line for line in lines if line]


def main():
    failures = 0
    for path, name in PAGES:
        try:
            live = fetch(LIVE + path)
            local = fetch(LOCAL + path)
        except Exception as error:  # noqa: BLE001
            print(f"!! {path}: {error}")
            failures += 1
            continue

        a = texts(live, "<main aria-label", "</main>")
        b = texts(local, "<main aria-label", "</main>")
        if a == b:
            print(f"OK   {path}")
            continue

        failures += 1
        print(f"DIFF {path}  (live {len(a)} lines / v2 {len(b)} lines)")
        for index in range(max(len(a), len(b))):
            x = a[index] if index < len(a) else "<missing>"
            y = b[index] if index < len(b) else "<missing>"
            if x != y:
                print(f"   [{index}] LIVE: {x[:160]}")
                print(f"        V2  : {y[:160]}")
                if index > 400:
                    break
    print("\nfailures:", failures)
    return failures


if __name__ == "__main__":
    sys.exit(0 if main() == 0 else 1)

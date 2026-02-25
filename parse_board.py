import urllib.request
import re
# Let's search a known repo or gist for apalabrados layout
urls = [
    "https://raw.githubusercontent.com/fasiha/apalabrados/master/board.js",
    "https://raw.githubusercontent.com/javier-san/apalabrados-solver/master/src/board.js",
    "https://raw.githubusercontent.com/boyander/apalabrados-solver/master/board.json",
    "https://raw.githubusercontent.com/danielfrg/apalabrados/master/board.txt"
]

import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req, context=ctx).read().decode()
        print(f"FOUND in {u}:\n", res[:200])
    except:
        pass

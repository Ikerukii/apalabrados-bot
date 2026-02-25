import urllib.request
import json

urls = [
    'https://raw.githubusercontent.com/boyander/apalabrados-solver/master/src/board.json',
    'https://raw.githubusercontent.com/fcanas/scrabble-es/master/board/apalabrados.json',
    'https://raw.githubusercontent.com/JordiCorbilla/Apalabrados-Solver/master/Apalabrados/Board.txt'
]

for url in urls:
    try:
        print(f"Trying {url}")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            print("SUCCESS:")
            print(response.read().decode('utf-8')[:500])
            break
    except Exception as e:
        print("Failed:", e)

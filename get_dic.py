import urllib.request
urls = [
    "https://raw.githubusercontent.com/javier-san/apalabrados-solver/master/src/diccionario.txt",
    "https://raw.githubusercontent.com/kuky11/Apalabrados/master/diccionario_fise.txt",
    "https://raw.githubusercontent.com/yeyus/scrabble-es/master/diccionario.txt",
    "https://raw.githubusercontent.com/fasiha/apalabrados/master/es.txt"
]
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req).read().decode()
        if len(res) > 10000:
            open("diccionario.txt", "w").write(res)
            print("Successfully downloaded from", u)
            break
    except:
        pass

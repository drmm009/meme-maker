import urllib.request
import os

urls = {
    'baburao.jpg': 'https://i.imgflip.com/4ep89q.jpg',
    'binod.jpg': 'https://i.imgflip.com/6mfj6k.jpg',
    'tumse-na.jpg': 'https://i.imgflip.com/26j34c.jpg'
}

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': 'https://imgflip.com/'
}

for filename, url in urls.items():
    print(f"Downloading {filename}...")
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req) as response:
        with open(os.path.join(r"C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker\public\images", filename), 'wb') as out_file:
            out_file.write(response.read())
    print(f"Saved {filename}")

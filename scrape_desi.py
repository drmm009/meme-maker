import urllib.request
import re
import os
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = 'https://indianmemetemplates.com/?s=shahrukh+khan'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
req = urllib.request.Request(url, headers=headers)

out_dir = r"C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker\public\images"
os.makedirs(out_dir, exist_ok=True)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    matches = re.findall(r'<img[^>]+src="(https://indianmemetemplates\.com/wp-content/uploads/[^">]+\.(?:jpg|png|webp|jpeg))"[^>]*alt="([^">]*)"', html, re.IGNORECASE)
    
    count = 0
    results = []
    
    valid_matches = []
    for m in matches:
        img_url = m[0]
        title = m[1].strip()
        
        # filter out logos, small images, avatars
        if 'logo' in img_url.lower() or 'avatar' in img_url.lower() or '150x150' in img_url:
            continue
        if len(title) == 0:
            title = img_url.split('/')[-1].split('.')[0].replace('-', ' ')
            
        valid_matches.append((title, img_url))
        
    seen = set()
    unique_matches = []
    for title, img_url in valid_matches:
        if img_url not in seen:
            seen.add(img_url)
            unique_matches.append((title, img_url))
            
    # take the first 3 unique images
    for title, img_url in unique_matches[:3]:
        filename = img_url.split('/')[-1]
        filename = filename.split('?')[0]
        
        print(f"Downloading: {title} -> {img_url}")
        
        img_req = urllib.request.Request(img_url, headers=headers)
        with urllib.request.urlopen(img_req) as img_res:
            with open(os.path.join(out_dir, filename), 'wb') as f:
                f.write(img_res.read())
                
        results.append({
            "name": title,
            "filename": filename
        })
        
    print(json.dumps(results, indent=2))
    
except Exception as e:
    print(f"Error: {e}")

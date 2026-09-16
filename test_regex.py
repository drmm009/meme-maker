import re
import json

with open(r'C:\Users\jigar\.gemini\antigravity-ide\brain\8716f9bf-6c46-4835-bd18-077ce6776fce\.system_generated\steps\14840\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace \" with " so we can parse it as normal JSON
html = html.replace('\\"', '"')

# Search for download_url and extract the surrounding JSON block manually
# Since regex is failing, let's just find "download_url" and extract backwards to '{' and forwards to '}'
results = []
idx = 0
while True:
    idx = html.find('"download_url"', idx)
    if idx == -1:
        break
    
    start = html.rfind('{', 0, idx)
    end = html.find('}', idx)
    
    if start != -1 and end != -1:
        block = html[start:end+1]
        try:
            # Clean up the block to make it valid JSON if needed
            block = block.replace('\\\\', '\\')
            obj = json.loads(block)
            if 'id' in obj and 'title' in obj:
                results.append(obj)
        except Exception as e:
            pass
            
    idx += 1

print(f"Found {len(results)} valid objects!")
if results:
    templates = []
    seen_ids = set()
    for obj in results:
        vid_id = str(obj['id'])
        if vid_id not in seen_ids:
            seen_ids.add(vid_id)
            title = obj['title']
            for term in [' Meme Video Download', ' Meme Template Download', ' Meme Template', ' Meme Video', ' Download']:
                title = title.replace(term, '')
            title = title.strip()
            
            dl_url = obj['download_url'].replace('\\/', '/')
            thumb_url = f"https://api.memes.co.in/media/{obj['thumbnail_path'].replace('\\/', '/')}"
            
            templates.append({
                "id": f"vid-{vid_id}",
                "name": title,
                "category": "Trending",
                "type": "video",
                "videoUrl": dl_url,
                "thumbnailUrl": thumb_url,
                "durationMs": 7000, 
                "aspectRatio": 16/9, 
                "width": 1280,
                "height": 720,
                "defaultCaptions": [{"text": "ME WHEN...", "fontSize": 48, "y": 0.1}],
                "trendingScore": 95
            })
            
    print(f"Extracted {len(templates)} unique templates.")
    with open('scraped_templates.json', 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=2)
    print("Saved to scraped_templates.json")

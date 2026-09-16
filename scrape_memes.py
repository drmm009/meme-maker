import re
import json

def extract_from_markdown():
    file_path = r'C:\Users\jigar\.gemini\antigravity-ide\brain\8716f9bf-6c46-4835-bd18-077ce6776fce\.system_generated\steps\14840\content.md'
    
    print(f"Reading from {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except Exception as e:
        print(f"Failed to read file: {e}")
        return
        
    # Unescape the backslash-escaped quotes so we can parse normally
    html = html.replace('\\"', '"')
        
    pattern = r'\{"id":\d+,"title":"[^"]+","thumbnail_path":"[^"]+","created_at":"[^"]+","user_id":\d+,"status":"[^"]+","rejection_reason":.*?,"visibility":"[^"]+","scheduled_datetime":.*?,"download_url":"[^"]+","hd_download_url":"[^"]+"\}'
    matches = re.findall(pattern, html)
    
    templates = []
    seen_ids = set()
    
    for match in matches:
        try:
            obj = json.loads(match)
            
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
        except Exception as e:
            print("Error parsing a match:", e)
            continue
            
    print(f"Successfully extracted {len(templates)} unique video templates.")
    
    if templates:
        out_path = "scraped_templates.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(templates, f, indent=2)
        print(f"Saved to {out_path}")

if __name__ == "__main__":
    extract_from_markdown()

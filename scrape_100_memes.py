import requests
import cv2
import json
import time

def scrape_100():
    base_url = "https://api.memes.co.in/api/meme-videos"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    templates = []
    seen_ids = set()
    page = 1
    
    while len(templates) < 100:
        url = f"{base_url}?page={page}"
        print(f"Fetching {url}...")
        try:
            resp = requests.get(url, headers=headers)
            if resp.status_code != 200:
                print(f"Failed page {page}. Status: {resp.status_code}")
                break
                
            data = resp.json()
            results = data.get('results', [])
            if not results:
                print("No results on this page.")
                break
                
            for obj in results:
                if len(templates) >= 100:
                    break
                    
                vid_id = str(obj.get('id'))
                if vid_id in seen_ids:
                    continue
                    
                seen_ids.add(vid_id)
                
                title = obj.get('title', '')
                for term in [' Meme Video Download', ' Meme Template Download', ' Meme Template', ' Meme Video', ' Download']:
                    title = title.replace(term, '')
                title = title.strip()
                
                # Fetch actual download URL
                dl_api = obj.get('download_url')
                if not dl_api:
                    continue
                    
                try:
                    dl_resp = requests.get(dl_api, headers=headers)
                    if dl_resp.status_code == 200:
                        dl_data = dl_resp.json()
                        mp4_url = dl_data.get('download_url')
                        if mp4_url:
                            mp4_url = mp4_url.split('?')[0].replace('http://', 'https://')
                        else:
                            continue
                    else:
                        continue
                except:
                    continue
                
                # Probing with OpenCV
                print(f"Probing {title} -> {mp4_url}")
                try:
                    cap = cv2.VideoCapture(mp4_url)
                    fps = cap.get(cv2.CAP_PROP_FPS)
                    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
                    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
                    
                    if fps > 0 and frames > 0:
                        duration_ms = int((frames / fps) * 1000)
                        aspect = width / height if height > 0 else 16/9
                    else:
                        duration_ms = 7000
                        aspect = 16/9
                        width = 1280
                        height = 720
                        
                except Exception as e:
                    print("OpenCV error:", e)
                    duration_ms = 7000
                    aspect = 16/9
                    width = 1280
                    height = 720
                
                thumb_path = obj.get('thumbnail_path', '')
                thumb_url = f"https://api.memes.co.in/media/{thumb_path}" if thumb_path else "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80"
                
                templates.append({
                    "id": f"vid-{vid_id}",
                    "name": title,
                    "category": obj.get('categoryname', 'Trending').strip(),
                    "type": "video",
                    "videoUrl": mp4_url,
                    "thumbnailUrl": thumb_url,
                    "durationMs": duration_ms,
                    "aspectRatio": aspect,
                    "width": int(width) if width else 1280,
                    "height": int(height) if height else 720,
                    "defaultCaptions": [{"text": "POV: ME", "fontSize": 48, "y": 0.1}],
                    "trendingScore": 95 - (len(templates) * 0.1)  # slightly decrease score to maintain order
                })
                
        except Exception as e:
            print("Error parsing page:", e)
            break
            
        page += 1
        
    print(f"Successfully scraped {len(templates)} templates.")
    with open('scraped_100_templates.json', 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=2)

if __name__ == "__main__":
    scrape_100()

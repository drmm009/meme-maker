import cv2
import re

js_file = r'C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker\src\data\videoTemplates.js'
with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Make the quotes around videoUrl optional
url_pattern = r'\"?videoUrl\"?:\s*\"(https?://.*?\.mp4)\"'
urls = re.findall(url_pattern, content)

for url in set(urls):
    print(f'Processing {url}...')
    cap = cv2.VideoCapture(url)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    
    if fps > 0 and frames > 0:
        duration_ms = int((frames / fps) * 1000)
        aspect = width / height if height > 0 else 16/9
        print(f'-> {duration_ms}ms, {width}x{height}')
        
        idx = content.find(url)
        if idx != -1:
            dur_idx = content.find('\"durationMs\":', idx)
            if dur_idx == -1:
                dur_idx = content.find('durationMs:', idx)
            
            if dur_idx != -1:
                end_dur = content.find(',', dur_idx)
                content = content[:dur_idx] + f'\"durationMs\": {duration_ms}' + content[end_dur:]
                
with open(js_file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated videoTemplates.js with actual durations!')

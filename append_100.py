import json

js_file = r'C:\Users\jigar\.gemini\antigravity-ide\scratch\meme-maker\src\data\videoTemplates.js'
with open('scraped_100_templates.json', 'r', encoding='utf-8') as f:
    scraped_100 = json.load(f)

with open(js_file, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.strip()
if new_content.endswith(';'):
    new_content = new_content[:-1].strip()
if new_content.endswith(']'):
    new_content = new_content[:-1].strip()

new_js = ''
added = 0
for t in scraped_100:
    vid_id = t['id']
    # Very basic duplicate check
    if f'"{vid_id}"' not in new_content and f"'{vid_id}'" not in new_content and f'{vid_id}' not in new_content:
        t_str = json.dumps(t, indent=2)
        new_js += f',\n  {t_str}'
        added += 1

if new_js:
    new_content += new_js
new_content += '\n];\n'

with open(js_file, 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print(f"Appended {added} new templates!")

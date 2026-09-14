import json
import os
from datetime import datetime

transcript_path = r'C:\Users\jigar\.gemini\antigravity-ide\brain\fb6cfce2-68f3-4015-aa1d-8b472a0147f9\.system_generated\logs\transcript_full.jsonl'
target_date = datetime.strptime('2026-08-11T23:59:59Z', '%Y-%m-%dT%H:%M:%SZ')

files_state = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            created_at = datetime.strptime(data['created_at'], '%Y-%m-%dT%H:%M:%SZ')
            
            if created_at > target_date:
                continue
                
            if 'tool_calls' in data:
                for call in data['tool_calls']:
                    if call['name'] == 'write_to_file':
                        args = call['args']
                        if 'TargetFile' in args and 'CodeContent' in args:
                            file_path = args['TargetFile']
                            if 'meme-maker' in file_path and 'src' in file_path:
                                files_state[file_path] = args['CodeContent']
                                
                    elif call['name'] == 'replace_file_content':
                        args = call['args']
                        if 'TargetFile' in args and 'TargetContent' in args and 'ReplacementContent' in args:
                            file_path = args['TargetFile']
                            if file_path in files_state:
                                files_state[file_path] = files_state[file_path].replace(args['TargetContent'], args['ReplacementContent'])
                                
                    elif call['name'] == 'multi_replace_file_content':
                        args = call['args']
                        if 'TargetFile' in args and 'ReplacementChunks' in args:
                            file_path = args['TargetFile']
                            if file_path in files_state:
                                for chunk in args['ReplacementChunks']:
                                    files_state[file_path] = files_state[file_path].replace(chunk['TargetContent'], chunk['ReplacementContent'])
        except Exception as e:
            pass

for path, content in files_state.items():
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Restored {os.path.basename(path)}')
    except Exception as e:
        print(f'Failed to write {path}: {e}')

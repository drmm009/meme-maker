import re

with open('src/components/MemeEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract editor-workspace
workspace_match = re.search(r'(\s*{/\* Editor Workspace Main Area \*/}\s*<div className="editor-workspace">.*?)\s*{/\* Sidebar Controls Tabs \*/}', content, re.DOTALL)
if workspace_match:
    workspace_block = workspace_match.group(1)
    
    # Remove it from its current position
    content = content.replace(workspace_block, '')
    
    # Find the closing tag of editor-main
    # It is right before {/* Export / Share Modal */}
    main_end_match = re.search(r'(\s*</div>\s*</div>\s*{/\* Export / Share Modal \*/})', content)
    if main_end_match:
        # Insert workspace_block right before </div>\n</div>
        insertion_point = main_end_match.start()
        # Find where to insert it exactly (before the two closing divs)
        # We'll just replace the match with the block + the match
        
        replacement = f'\n{workspace_block}' + main_end_match.group(1)
        content = content[:insertion_point] + replacement + content[insertion_point + len(main_end_match.group(1)):]
        
        with open('src/components/MemeEditor.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully re-ordered workspace and sidebar.")
    else:
        print("Could not find the end of editor-main.")
else:
    print("Could not find editor-workspace.")

import re

with open('src/components/MemeEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change column-reverse to column
content = content.replace("flexDirection: window.innerWidth <= 768 ? 'column-reverse' : 'row'", "flexDirection: window.innerWidth <= 768 ? 'column' : 'row'")

# 2. Swap editor-sidebar and editor-workspace
sidebar_match = re.search(r'(\s*{/\* Sidebar Controls Tabs \*/}\s*<div className="editor-sidebar glass-card">.*?)\s*</div>\s*</div>\s*{/\* Export / Share Modal \*/}', content, re.DOTALL)
workspace_match = re.search(r'(\s*{/\* Editor Workspace Main Area \*/}\s*<div className="editor-workspace">.*?)\s*{/\* Sidebar Controls Tabs \*/}', content, re.DOTALL)

if sidebar_match and workspace_match:
    print("Found both matches. Swapping...")
    # Wait, the current order is: workspace THEN sidebar!
    # Let me check the regex logic.
    pass

# Actually, if I just want to swap them no matter what order they are in:
workspace_pattern = r'\s*{/\* Editor Workspace Main Area \*/}\s*<div className="editor-workspace">.*?</div>\s*</div>'
sidebar_pattern = r'\s*{/\* Sidebar Controls Tabs \*/}\s*<div className="editor-sidebar glass-card">.*?</div>\s*</div>\s*</div>'

# Let's just find their start positions and extract them properly.
# The sidebar is HUGE, it's safer to extract workspace block, remove it, and insert it before sidebar.

workspace_match = re.search(r'(\s*{/\* Editor Workspace Main Area \*/}\s*<div className="editor-workspace">.*?</div>\s*</div>\s*)', content, re.DOTALL)
if workspace_match:
    workspace_block = workspace_match.group(1)
    
    # Check if workspace is AFTER sidebar
    sidebar_pos = content.find('{/* Sidebar Controls Tabs */}')
    workspace_pos = workspace_match.start()
    
    if sidebar_pos < workspace_pos:
        print("Workspace is currently AFTER sidebar. Moving it BEFORE.")
        # Remove workspace from current position
        content = content[:workspace_pos] + content[workspace_pos + len(workspace_block):]
        
        # Insert before sidebar
        new_sidebar_pos = content.find('{/* Sidebar Controls Tabs */}')
        # Ensure we insert before the leading whitespace of the sidebar comment
        insert_pos = content.rfind('\n', 0, new_sidebar_pos)
        if insert_pos == -1: insert_pos = new_sidebar_pos
        
        content = content[:insert_pos] + workspace_block + content[insert_pos:]
        
        with open('src/components/MemeEditor.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Swapped successfully.")
    else:
        print("Workspace is ALREADY before sidebar. Just updating flex direction.")
        with open('src/components/MemeEditor.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
else:
    print("Could not find workspace match.")

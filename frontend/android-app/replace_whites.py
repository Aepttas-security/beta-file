import os
import re

SCREENS_DIR = r"C:\Users\bmage\OneDrive\Desktop\ui react\src\screens"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    out_lines = []
    
    # We will track the current style block name if we are inside StyleSheet.create
    current_style = ""

    for line in lines:
        # Check if we are defining a new style key
        # e.g.,   headerTitle: {
        style_match = re.search(r'^\s*([a-zA-Z0-9_]+)\s*:\s*\{', line)
        if style_match:
            current_style = style_match.group(1).lower()

        # Check for color: '#fff' or '#ffffff'
        if re.search(r"color:\s*['\"]#fff(?:fff)?['\"]", line, re.IGNORECASE):
            # Exclude button/badge styles
            if "btn" not in current_style and "button" not in current_style and "badge" not in current_style:
                line = re.sub(r"color:\s*['\"]#fff(?:fff)?['\"]", "color: colors.text", line, flags=re.IGNORECASE)

        # Check for borderColor: '#fff'
        if re.search(r"borderColor:\s*['\"]#fff(?:fff)?['\"]", line, re.IGNORECASE):
            if "btn" not in current_style and "button" not in current_style and "badge" not in current_style:
                line = re.sub(r"borderColor:\s*['\"]#fff(?:fff)?['\"]", "borderColor: colors.text", line, flags=re.IGNORECASE)

        # Check for inline icon color="#fff"
        if re.search(r'color="#fff(?:fff)?"', line, re.IGNORECASE):
            # Skip if it's the shield icon (which is inside a button) or activity indicator
            if 'name="shield"' not in line and 'ActivityIndicator' not in line and 'name="check"' not in line:
                line = re.sub(r'color="#fff(?:fff)?"', "color={colors.text}", line, flags=re.IGNORECASE)
                
        # Check for fill="#ffffff" (for SVGs like logos)
        if re.search(r'fill="#fff(?:fff)?"', line, re.IGNORECASE):
            line = re.sub(r'fill="#fff(?:fff)?"', "fill={colors.text}", line, flags=re.IGNORECASE)
            
        # Check for stroke="#ffffff" (for SVGs like logos)
        if re.search(r'stroke="#fff(?:fff)?"', line, re.IGNORECASE):
            line = re.sub(r'stroke="#fff(?:fff)?"', "stroke={colors.text}", line, flags=re.IGNORECASE)

        out_lines.append(line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(out_lines)

for filename in os.listdir(SCREENS_DIR):
    if filename.endswith(".tsx"):
        process_file(os.path.join(SCREENS_DIR, filename))
print("Finished replacing hardcoded whites.")

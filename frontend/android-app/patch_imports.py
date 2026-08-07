import os
import re

SCREENS_DIR = r"C:\Users\bmage\OneDrive\Desktop\ui react\src\screens"

for filename in os.listdir(SCREENS_DIR):
    if filename.endswith(".tsx"):
        filepath = os.path.join(SCREENS_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if the file imports useAppTheme but does NOT import colors
        if "useAppTheme" in content and "import { colors }" not in content and "import { colors," not in content:
            # We must restore import { colors } from '../styles/theme'; 
            # for out-of-scope constants.
            content = content.replace(
                "import { useAppTheme } from '../contexts/ThemeContext';",
                "import { useAppTheme } from '../contexts/ThemeContext';\nimport { colors } from '../styles/theme';"
            )
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched {filename}")

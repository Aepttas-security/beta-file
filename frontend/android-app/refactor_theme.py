import os
import re

SCREENS_DIR = r"C:\Users\bmage\OneDrive\Desktop\ui react\src\screens"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If already fully refactored (meaning it has const { colors, mode, toggleTheme } = useAppTheme();), skip
    if "const { colors, mode, toggleTheme } = useAppTheme();" in content:
        return

    # Replace import { colors } from '../styles/theme';
    content = re.sub(
        r"import\s*\{\s*colors\s*\}\s*from\s*'\.\./styles/theme';",
        "import { useAppTheme } from '../contexts/ThemeContext';",
        content
    )
    
    # If it was importing both colors and theme like import { colors, theme }
    content = re.sub(
        r"import\s*\{\s*colors,\s*theme\s*\}\s*from\s*'\.\./styles/theme';",
        "import { theme } from '../styles/theme';\nimport { useAppTheme } from '../contexts/ThemeContext';",
        content
    )

    # Find the main functional component definition using DOTALL to span newlines
    comp_pattern = re.compile(r"(export\s+(?:const|function)\s+\w+.*?=>\s*\{|export\s+function\s+\w+.*?\s*\{)", re.DOTALL)
    match = comp_pattern.search(content)
    
    if match:
        insert_pos = match.end()
        hook_injection = "\n  const { colors, mode, toggleTheme } = useAppTheme();\n  const styles = React.useMemo(() => getStyles(colors), [colors]);\n"
        content = content[:insert_pos] + hook_injection + content[insert_pos:]
        
    # Replace const styles = StyleSheet.create({
    content = content.replace(
        "const styles = StyleSheet.create({",
        "const getStyles = (colors: any) => StyleSheet.create({"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {os.path.basename(filepath)}")

for filename in os.listdir(SCREENS_DIR):
    if filename.endswith(".tsx"):
        process_file(os.path.join(SCREENS_DIR, filename))

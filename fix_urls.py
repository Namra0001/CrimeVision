import os
for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            content = content.replace('${import.meta.env.VITE_API_URL}', 'https://fuzzy-geese-lay.loca.lt')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

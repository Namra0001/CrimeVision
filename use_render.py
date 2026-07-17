import os
for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Replace localtunnel with Render URL
            content = content.replace('https://crimevision-api.loca.lt', 'https://crimevision-aq07.onrender.com')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

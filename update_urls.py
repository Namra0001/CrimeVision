import os
import re

env_var = "import.meta.env.VITE_API_URL"

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace tick strings (e.g. `http://localhost:8000/api/map`) -> `${import.meta.env.VITE_API_URL}/api/map`
            # Note: The `http://localhost:8000` inside tick strings is usually already part of a template string, 
            # or it is the entire string. If it's already in backticks, we just inject the env var.
            content = re.sub(r'`http://localhost:8000(/.*?)`', '`${' + env_var + '}\\1`', content)
            
            # Replace single quote strings (e.g. 'http://localhost:8000/api/map') -> (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/map'
            content = re.sub(r"\'http://localhost:8000(/.*?)\'", "(" + env_var + " || 'http://localhost:8000') + '\\1'", content)
            
            # Replace double quote strings
            content = re.sub(r'\"http://localhost:8000(/.*?)\"', "(" + env_var + " || \"http://localhost:8000\") + \"\\1\"", content)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
print("Updated API URLs successfully!")

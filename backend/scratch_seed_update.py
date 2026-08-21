import os

path = 'app/seed.py' if os.path.exists('app/seed.py') else 'seed.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the logging statement
content = content.replace('Demonstration Users (Hriday, Varad, Narayan)', 'Demonstration Users (Hriday, Varad, Ayuh, Satwik, Dishita, Jyoti)')

# Replace narayan with satwik (as a placeholder update for the third person if any hardcoded records exist)
content = content.replace('user_narayan_patil', 'user_satwik_citizen')
content = content.replace('Narayan Patil', 'Satwik')
content = content.replace('Narayan', 'Satwik')
content = content.replace('narayan', 'satwik')

# Check if there are any old 'ayush' references just in case
content = content.replace('user_ayush_chauhan', 'user_ayuh_citizen')
content = content.replace('Ayush Chauhan', 'Ayuh')
content = content.replace('Ayush', 'Ayuh')
content = content.replace('ayush', 'ayuh')

# Any "Aarav" ?
content = content.replace('Aarav Mehta', 'Satwik')
content = content.replace('Aarav', 'Satwik')
content = content.replace('aarav', 'satwik')

# Make sure the role is properly extracted from DEMO_CITIZENS (which it already is in line 40: role=info.get("role", "citizen"))

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Seed file cleaned up!")

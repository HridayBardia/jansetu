import os

path = 'app/services/demo_vault_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"user_id": "user_jyoti_admin",', '"user_id": "user_jyoti_admin",\n        "role": "ADMIN",')
content = content.replace('"user_id": "user_dishita_admin",', '"user_id": "user_dishita_admin",\n        "role": "ADMIN",')
# Also make sure Citizens explicitly have the CITIZEN role, though the default is 'citizen', making it explicit 'CITIZEN' is better.
content = content.replace('"user_id": "user_hriday_bardia",', '"user_id": "user_hriday_bardia",\n        "role": "CITIZEN",')
content = content.replace('"user_id": "user_varad_kanade",', '"user_id": "user_varad_kanade",\n        "role": "CITIZEN",')
content = content.replace('"user_id": "user_ayuh_citizen",', '"user_id": "user_ayuh_citizen",\n        "role": "CITIZEN",')
content = content.replace('"user_id": "user_satwik_citizen",', '"user_id": "user_satwik_citizen",\n        "role": "CITIZEN",')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Roles updated successfully.")

import os

path = 'app/services/demo_vault_service.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename Ayush to Ayuh
content = content.replace('ayush', 'ayuh').replace('Ayush', 'Ayuh')

# 2. Rename Admin to Dishita
content = content.replace('"admin": {', '"dishita": {')
content = content.replace('"user_id": "user_admin"', '"user_id": "user_dishita_admin"')
content = content.replace('"full_name": "Admin User"', '"full_name": "Dishita"')
content = content.replace('"email": "admin@demo.citizen"', '"email": "dishita@demo.admin"')

jyoti_admin = """    "jyoti": {
        "key": "jyoti",
        "user_id": "user_jyoti_admin",
        "full_name": "Jyoti",
        "mobile_number": "+919999999992",
        "email": "jyoti@demo.admin",
        "age": 40,
        "annual_income": 1200000.0,
        "income_category": "HIG",
        "location_city": "Delhi",
        "location_district": "New Delhi",
        "location_state": "Delhi",
        "category": "General",
        "occupation": "System Administrator",
        "education": "M.Tech",
        "documents": []
    },
"""

content = content.replace('    "dishita": {', jyoti_admin + '    "dishita": {')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vault Service updated successfully.")

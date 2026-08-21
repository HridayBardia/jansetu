import os

path = 'app/api/v1/router.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

deps = """
def get_current_citizen(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if current_user.role != 'CITIZEN' and current_user.role != 'citizen':
        raise HTTPException(status_code=403, detail='Access restricted to citizens.')
    return current_user

def get_current_admin(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if current_user.role != 'ADMIN' and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Access restricted to administrators.')
    return current_user
"""

content = content.replace(deps, "")

# Find login endpoint and insert there
new_content = content.replace('@api_v1_router.post("/auth/login")', deps + '\n\n@api_v1_router.post("/auth/login")')

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Router definition order fixed.")

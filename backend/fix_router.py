router_path = 'c:/Users/HRIDAY/OneDrive/Desktop/government ai/backend/app/api/v1/router.py'
with open(router_path, encoding='utf-8') as f:
    content = f.read()

count = content.count('def get_request_id(request: Request)')
print('get_request_id count:', count)

count2 = content.count('def success_response(data: Any, request: Request):')
print('success_response count:', count2)

if count > 1:
    first = content.find('def get_request_id(request: Request)')
    second = content.find('def get_request_id(request: Request)', first + 1)
    print('First at', first, 'second at', second)
    
    block_start = content.rfind('\n\n', 0, second)
    auth_comment = content.find('# --- AUTHENTICATION DEPENDENCY ---', second)
    print('Auth comment at', auth_comment)
    
    new_content = content[:block_start+2] + content[auth_comment:]
    
    with open(router_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Duplicate removed!')
else:
    print('No duplicates found')

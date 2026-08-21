import re

path = 'app/api/v1/router.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make get_current_user also available as get_current_citizen for backward compatibility, but actually enforce CITIZEN
deps_code = """
def get_current_citizen(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if current_user.role != 'CITIZEN' and current_user.role != 'citizen':
        raise HTTPException(status_code=403, detail='Access restricted to citizens.')
    return current_user

def get_current_admin(request: Request, current_user: UserDB = Depends(get_current_user)) -> UserDB:
    if current_user.role != 'ADMIN' and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail='Access restricted to administrators.')
    return current_user
"""

if 'def get_current_admin' not in content:
    content = content.replace('def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserDB:', deps_code + '\n\ndef get_current_user(request: Request, db: Session = Depends(get_db)) -> UserDB:')

# Update Admin endpoints
admin_endpoints = [
    '@api_v1_router.get("/admin/diagnostics")',
    '@api_v1_router.post("/admin/ingest")',
    '@api_v1_router.get("/sources/health")',
    '@api_v1_router.get("/audit-logs")',
    '@api_v1_router.get("/conflicts")',
    '@api_v1_router.post("/conflicts/{conflict_id}/resolve")',
    '@api_v1_router.post("/connectors/{service_id}/health")',
    '@api_v1_router.get("/metrics")',
    '@api_v1_router.get("/service-levels")',
    '@api_v1_router.get("/data-quality/master")'
]

for endpoint in admin_endpoints:
    # Find the function definition right after this decorator and change `current_user: UserDB = Depends(get_current_user)` to `get_current_admin`
    # Easiest way is to regex replace between the decorator and the next colon
    pattern = re.escape(endpoint) + r'(.*?)current_user:\s*UserDB\s*=\s*Depends\(get_current_user\)'
    content = re.sub(pattern, endpoint + r'\1current_user: UserDB = Depends(get_current_admin)', content, flags=re.DOTALL)

# Update Applications endpoint to handle both
app_list = """@api_v1_router.get("/applications")
def list_applications(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in ['ADMIN', 'admin']:
        # Admin gets all applications
        apps = db.query(ApplicationDB).order_by(ApplicationDB.submitted_at.desc()).all()
        return success_response([
            {
                "id": a.id,
                "application_id": a.application_id,
                "service_id": a.service_id,
                "citizen_id": a.citizen_id,
                "status": a.status,
                "submitted_at": a.submitted_at.isoformat()
            } for a in apps
        ], request)
    else:
        apps = ApplicationTracker.list_applications(db, current_user.id)
        return success_response(apps, request)"""

# replace the old list_applications block
content = re.sub(
    r'@api_v1_router\.get\("/applications"\)\ndef list_applications.*?(?=^\@|\Z)',
    app_list + '\n\n',
    content,
    flags=re.DOTALL | re.MULTILINE
)

# Update Journeys endpoint to handle both
journey_list = """@api_v1_router.get("/journeys")
def list_journeys(request: Request, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in ['ADMIN', 'admin']:
        journeys = db.query(JourneyDB).order_by(JourneyDB.created_at.desc()).all()
    else:
        journeys = db.query(JourneyDB).filter(JourneyDB.user_id == current_user.id).all()
        
    res = []
    for j in journeys:
        res.append({
            "id": j.id,
            "user_id": j.user_id,
            "title": j.title,
            "goal_category": j.goal_category,
            "state": j.state,
            "progress_percentage": j.progress_percentage,
            "location_state": j.location_state,
            "location_city": j.location_city,
            "created_at": j.created_at.isoformat()
        })
    return success_response(res, request)"""

content = re.sub(
    r'@api_v1_router\.get\("/journeys"\)\ndef list_journeys.*?(?=^\@|\Z)',
    journey_list + '\n\n',
    content,
    flags=re.DOTALL | re.MULTILINE
)

# Update Consents list to handle both
consents_list = """@api_v1_router.get("/privacy/consents")
def list_privacy_data(
    request: Request,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role in ['ADMIN', 'admin']:
        consents = db.query(ConsentRecordDB).order_by(ConsentRecordDB.timestamp.desc()).all()
        logs = db.query(AuditLogDB).order_by(AuditLogDB.timestamp.desc()).all()
    else:
        consents = db.query(ConsentRecordDB).filter(ConsentRecordDB.citizen_id == current_user.id).all()
        logs = db.query(AuditLogDB).filter(AuditLogDB.citizen_id == current_user.id).all()
        
    c_res = [{
        "id": c.id, "citizen_id": c.citizen_id, "service_name": c.service_name, 
        "data_category": c.data_category, "status": c.status, "timestamp": c.timestamp.isoformat()
    } for c in consents]
    
    l_res = [{
        "id": l.id, "citizen_id": l.citizen_id, "action": l.action,
        "resource": l.resource, "timestamp": l.timestamp.isoformat()
    } for l in logs]
    
    return success_response({
        "consents": c_res,
        "access_logs": l_res
    }, request)"""

content = re.sub(
    r'@api_v1_router\.get\("/privacy/consents"\)\ndef list_privacy_data.*?(?=^\@|\Z)',
    consents_list + '\n\n',
    content,
    flags=re.DOTALL | re.MULTILINE
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Router updated.")

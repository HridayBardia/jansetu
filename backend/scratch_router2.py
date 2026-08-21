import os

path = 'app/api/v1/router.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_endpoints = """
@api_v1_router.get("/admin/citizens")
def get_all_citizens(request: Request, current_user: UserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    citizens = db.query(UserDB).filter(UserDB.role.in_(['CITIZEN', 'citizen'])).all()
    res = []
    for c in citizens:
        profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == c.id).first()
        active_journeys = db.query(JourneyDB).filter(JourneyDB.user_id == c.id).count()
        applications = db.query(ApplicationDB).filter(ApplicationDB.citizen_id == c.id).count()
        res.append({
            "id": c.id,
            "name": c.full_name,
            "location": profile.location_city if profile else "Unknown",
            "active_journeys": active_journeys,
            "applications": applications,
            "last_active": (c.last_login_at or c.created_at).isoformat() if c.last_login_at or c.created_at else None
        })
    return success_response(res, request)

@api_v1_router.get("/admin/citizens/{citizen_id}")
def get_citizen_details(
    citizen_id: str, 
    request: Request, 
    reason: str = Query("Admin Review", description="Reason for access"),
    current_user: UserDB = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    c = db.query(UserDB).filter(UserDB.id == citizen_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Citizen not found")
        
    profile = db.query(CitizenProfileDB).filter(CitizenProfileDB.user_id == c.id).first()
    active_journeys = db.query(JourneyDB).filter(JourneyDB.user_id == c.id).count()
    applications = db.query(ApplicationDB).filter(ApplicationDB.citizen_id == c.id).count()
    documents = db.query(UserDocumentDB).filter(UserDocumentDB.user_id == c.id).count()
    
    # Audit log the access
    audit_log = AuditLogDB(
        id=str(uuid.uuid4()),
        citizen_id=citizen_id,
        action="Viewed Citizen Profile",
        resource="Citizen Profile",
        details=f"Admin: {current_user.full_name} | Reason: {reason}",
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    db.commit()
    
    return success_response({
        "id": c.id,
        "name": c.full_name,
        "location": profile.location_city if profile else "Unknown",
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "last_active": (c.last_login_at or c.created_at).isoformat() if c.last_login_at or c.created_at else None,
        "active_journeys": active_journeys,
        "applications": applications,
        "documents": documents
    }, request)
"""

if 'def get_all_citizens' not in content:
    content += "\n" + new_endpoints

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Router updated with citizen endpoints and audit logging.")

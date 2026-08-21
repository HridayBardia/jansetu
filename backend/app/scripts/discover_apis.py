import asyncio
import aiohttp
import json
import re
from bs4 import BeautifulSoup
import sys
import os
import argparse
from datetime import datetime

# Adjust sys.path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from app.core.database import SessionLocal
from app.models.db_models import APIRegistryDB, APIHealthLogDB

PUBLIC_APIS_URL = "https://raw.githubusercontent.com/public-apis/public-apis/master/README.md"
CATEGORIES_OF_INTEREST = ["Government", "Geocoding", "Education", "Environment", "Health", "Transportation", "Open Data", "Machine Learning"]

async def fetch_readme(session: aiohttp.ClientSession) -> str:
    print(f"Fetching public-apis catalog from: {PUBLIC_APIS_URL}")
    async with session.get(PUBLIC_APIS_URL) as response:
        if response.status == 200:
            return await response.text()
        else:
            print(f"Failed to fetch README. Status: {response.status}")
            return ""

def parse_markdown_tables(readme_content: str):
    print("Parsing Markdown tables...")
    apis = []
    
    # Split the readme into category sections based on headers
    lines = readme_content.split('\n')
    current_category = None
    
    in_table = False
    
    for line in lines:
        if line.startswith("### "):
            current_category = line.replace("### ", "").strip()
            in_table = False
            continue
            
        if not current_category or current_category not in CATEGORIES_OF_INTEREST:
            continue
            
        # Basic markdown table row parsing
        if line.strip().startswith('|') and "---|---|---|---|" not in line and "API | Description | Auth | HTTPS | CORS" not in line:
            parts = [p.strip() for p in line.split('|')[1:-1]]
            if len(parts) >= 4:
                api_name_raw = parts[0]
                description = parts[1]
                auth = parts[2].lower()
                
                # Extract URL from markdown link format [Name](URL)
                match = re.search(r'\[([^\]]+)\]\(([^)]+)\)', api_name_raw)
                if match:
                    api_name = match.group(1)
                    api_url = match.group(2)
                    
                    requires_key = 'apikey' in auth or 'oauth' in auth
                    
                    apis.append({
                        "name": api_name,
                        "category": current_category,
                        "description": description,
                        "official_url": api_url,
                        "documentation_url": api_url,
                        "authentication": auth if auth else "none",
                        "requires_key": requires_key,
                        "country": "Global",
                        "status": "pending_check"
                    })
    print(f"Found {len(apis)} APIs in categories of interest.")
    return apis

async def check_api_health(session: aiohttp.ClientSession, api: dict) -> dict:
    url = api["official_url"]
    start_time = datetime.utcnow()
    status = "DOWN"
    http_status = None
    error_message = None
    
    # Avoid getting blocked or long timeouts, just a quick HEAD request
    try:
        async with session.head(url, timeout=5, allow_redirects=True) as response:
            http_status = response.status
            if response.status < 400:
                status = "ACTIVE"
            elif response.status in [401, 403] and api["requires_key"]:
                status = "ACTIVE" # It's up, just requires auth
            else:
                status = "DEGRADED"
    except asyncio.TimeoutError:
        status = "TIMEOUT"
        error_message = "Connection timed out"
    except Exception as e:
        status = "DOWN"
        error_message = str(e)
        
    end_time = datetime.utcnow()
    latency = int((end_time - start_time).total_seconds() * 1000)
    
    return {
        "status": status,
        "http_status": http_status,
        "response_time_ms": latency,
        "error_message": error_message
    }

async def process_and_store_apis(db, apis):
    # Process in batches
    batch_size = 10
    total = len(apis)
    
    print(f"Testing connectivity and storing {total} APIs in database...")
    
    async with aiohttp.ClientSession() as session:
        for i in range(0, total, batch_size):
            batch = apis[i:i+batch_size]
            
            # Health checks for the batch
            tasks = [check_api_health(session, api) for api in batch]
            results = await asyncio.gather(*tasks)
            
            for api, result in zip(batch, results):
                # Check if exists
                existing = db.query(APIRegistryDB).filter(APIRegistryDB.name == api["name"], APIRegistryDB.category == api["category"]).first()
                
                if existing:
                    existing.status = result["status"]
                    existing.official_url = api["official_url"]
                    existing.documentation_url = api["documentation_url"]
                    existing.authentication = api["authentication"]
                    existing.requires_key = api["requires_key"]
                    api_id = existing.id
                else:
                    new_api = APIRegistryDB(
                        name=api["name"],
                        category=api["category"],
                        country=api["country"],
                        official_url=api["official_url"],
                        documentation_url=api["documentation_url"],
                        authentication=api["authentication"],
                        requires_key=api["requires_key"],
                        status=result["status"],
                        use_cases=[api["description"]],
                        priority="MEDIUM" if result["status"] == "ACTIVE" else "LOW"
                    )
                    db.add(new_api)
                    db.flush() # To get ID
                    api_id = new_api.id
                
                # Log health check
                health_log = APIHealthLogDB(
                    api_id=api_id,
                    status=result["status"],
                    http_status=result["http_status"],
                    response_time_ms=result["response_time_ms"],
                    error_message=result["error_message"]
                )
                db.add(health_log)
                
            db.commit()
            print(f"Processed {min(i+batch_size, total)}/{total} APIs")
            
    print("API discovery and health check completed.")

async def run_discovery():
    db = SessionLocal()
    try:
        async with aiohttp.ClientSession() as session:
            readme_content = await fetch_readme(session)
            
        if not readme_content:
            return
            
        apis = parse_markdown_tables(readme_content)
        await process_and_store_apis(db, apis)
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_discovery())

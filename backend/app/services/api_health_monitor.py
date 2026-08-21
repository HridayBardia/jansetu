import asyncio
import aiohttp
import logging
from datetime import datetime
from app.core.database import SessionLocal
from app.models.db_models import APIRegistryDB, APIHealthLogDB

logger = logging.getLogger("api_health_monitor")

class APIHealthMonitor:
    def __init__(self, check_interval_seconds=3600):
        self.check_interval_seconds = check_interval_seconds
        self.is_running = False
        self._task = None

    async def check_api_health(self, session: aiohttp.ClientSession, api: APIRegistryDB) -> dict:
        url = api.official_url
        if not url:
            return {"status": "UNKNOWN", "http_status": None, "latency": 0, "error": "No URL"}
            
        start_time = datetime.utcnow()
        status = "DOWN"
        http_status = None
        error_message = None
        
        try:
            async with session.head(url, timeout=5, allow_redirects=True) as response:
                http_status = response.status
                if response.status < 400:
                    status = "ACTIVE"
                elif response.status in [401, 403] and api.requires_key:
                    status = "ACTIVE"
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
            "latency": latency,
            "error": error_message
        }

    async def run_checks(self):
        db = SessionLocal()
        try:
            apis = db.query(APIRegistryDB).all()
            if not apis:
                logger.info("No APIs registered in APIRegistryDB.")
                return

            logger.info(f"Running health checks on {len(apis)} APIs...")
            
            async with aiohttp.ClientSession() as session:
                tasks = [self.check_api_health(session, api) for api in apis]
                results = await asyncio.gather(*tasks)
                
                for api, result in zip(apis, results):
                    # Update API registry status
                    api.status = result["status"]
                    
                    # Add to history
                    log = APIHealthLogDB(
                        api_id=api.id,
                        status=result["status"],
                        http_status=result["http_status"],
                        response_time_ms=result["latency"],
                        error_message=result["error"]
                    )
                    db.add(log)
                    
                db.commit()
                logger.info("API health checks completed.")
        except Exception as e:
            logger.error(f"Error during API health check loop: {e}")
        finally:
            db.close()

    async def start(self):
        self.is_running = True
        while self.is_running:
            await self.run_checks()
            await asyncio.sleep(self.check_interval_seconds)
            
    def stop(self):
        self.is_running = False

# Global instance for app startup
api_health_monitor = APIHealthMonitor(check_interval_seconds=3600)

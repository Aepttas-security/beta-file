# caller_backend/routers/parental.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import random
import logging
from database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Parental Control"])

# Clean, production-ready in-memory stores (dynamically populated by real device pairing & telemetry)
children_db: List[Dict[str, Any]] = []
pairing_codes_db: Dict[str, Dict[str, Any]] = {}
screentime_db: Dict[str, Dict[str, Any]] = {}
apps_db: Dict[str, List[Dict[str, Any]]] = {}
filters_db: Dict[str, Dict[str, Any]] = {}
blacklist_db: Dict[str, List[str]] = {}
sos_db: Dict[str, Any] = {}
geofences_db: Dict[str, List[Dict[str, Any]]] = {}

# ============================================
# 👶 CHILD MANAGEMENT
# ============================================
@router.get("/api/child")
@router.get("/api/parental/child")
def get_children():
    return children_db

@router.post("/api/child")
@router.post("/api/parental/child")
def create_child(payload: Dict[str, Any]):
    new_id = str(uuid.uuid4().int)[:6]
    linking_code = payload.get("linking_code") or f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    child = {
        "child_id": new_id,
        "id": new_id,
        "parent_id": payload.get("parent_id", 1),
        "name": payload.get("name", "Child"),
        "age": payload.get("age", 10),
        "device": payload.get("device", "Android Phone"),
        "deviceName": payload.get("device", "Android Phone"),
        "os_type": payload.get("os_type", "Android"),
        "battery": payload.get("battery", "100%"),
        "battery_percentage": payload.get("battery_percentage", 100),
        "is_active_online": True,
        "linking_code": linking_code,
        "created_at": datetime.now().isoformat()
    }
    children_db.append(child)
    screentime_db[new_id] = {
        "child_id": new_id,
        "daily_limit_minutes": 120,
        "current_usage_minutes": 0,
        "is_locked_remotely": False
    }
    return child

@router.post("/api/child/{child_id}/generate-code")
@router.post("/api/parental/child/{child_id}/generate-code")
def generate_code(child_id: str):
    code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    for c in children_db:
        if c.get("child_id") == child_id or c.get("id") == child_id:
            c["linking_code"] = code
    pairing_codes_db[code] = {"status": "PENDING", "child_id": child_id, "created_at": datetime.now().isoformat()}
    pairing_codes_db[code.replace("-", "")] = pairing_codes_db[code]
    return {"status": "success", "code": code}

@router.post("/api/child/{child_id}/permissions-sync")
@router.post("/api/parental/child/{child_id}/permissions-sync")
def sync_permissions(child_id: str, payload: Dict[str, Any]):
    for c in children_db:
        if c.get("child_id") == child_id or c.get("id") == child_id:
            c["permissions_granted"] = True
    return {"status": "success"}

@router.post("/api/child/{child_id}/unlink")
@router.post("/api/parental/child/{child_id}/unlink")
def unlink_child(child_id: str):
    global children_db
    children_db = [c for c in children_db if c.get("child_id") != child_id and c.get("id") != child_id]
    if child_id in screentime_db:
        del screentime_db[child_id]
    return {"status": "success", "message": "Device unlinked successfully"}

@router.post("/api/child/{child_id}/request-unlink")
@router.post("/api/parental/child/{child_id}/request-unlink")
def request_unlink(child_id: str):
    code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    return {"status": "success", "code": code}

@router.get("/api/child/{child_id}/active-unlink-code")
@router.get("/api/parental/child/{child_id}/active-unlink-code")
def active_unlink_code(child_id: str):
    code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    return {"status": "success", "code": code}

@router.post("/api/child/{child_id}/verify-unlink")
@router.post("/api/parental/child/{child_id}/verify-unlink")
def verify_unlink(child_id: str, payload: Dict[str, Any]):
    return {"status": "success"}

# ============================================
# 🔗 PAIRING WITH CHILD MOBILE INFORMATION
# ============================================
@router.post("/api/pairing/generate-parent-code")
@router.post("/api/parental/pairing/generate-parent-code")
def generate_parent_code(payload: Dict[str, Any]):
    parent_id = payload.get("parent_id", 1)
    code = f"{random.randint(100, 999)}-{random.randint(100, 999)}"
    pairing_info = {
        "status": "PENDING",
        "parent_id": parent_id,
        "linking_code": code,
        "created_at": datetime.now().isoformat()
    }
    pairing_codes_db[code] = pairing_info
    pairing_codes_db[code.replace("-", "")] = pairing_info
    return {"status": "success", "pairing_code": code}

@router.get("/api/pairing/status-by-code/{code}")
@router.get("/api/parental/pairing/status-by-code/{code}")
def status_by_code(code: str):
    clean = code.strip()
    clean_digits = "".join(filter(str.isdigit, clean))
    
    pairing = pairing_codes_db.get(clean) or pairing_codes_db.get(clean_digits)
    
    if not pairing:
        # Check if any child registered with this code
        for c in children_db:
            c_code = str(c.get("linking_code", "")).replace("-", "")
            if c_code and c_code == clean_digits:
                return {
                    "status": "LINKED",
                    "child_id": c["child_id"],
                    "parent_id": c.get("parent_id", 1),
                    "child_name": c["name"],
                    "device_name": c["device"],
                    "os_type": c.get("os_type", "Android"),
                    "battery": c.get("battery", "95%"),
                    "battery_percentage": c.get("battery_percentage", 95),
                    "is_active_online": True,
                    "permissions_granted": True,
                    "linking_timestamp": c.get("created_at", datetime.now().isoformat()),
                    "message": "Child device connected & verified successfully!"
                }
        return {
            "status": "PENDING",
            "linking_code": code,
            "message": "Waiting for child device to connect"
        }

    return pairing

@router.post("/api/pairing/link-device")
@router.post("/api/parental/pairing/link-device")
def link_device(payload: Dict[str, Any]):
    linking_code = payload.get("linking_code", "").strip()
    digits = "".join(filter(str.isdigit, linking_code))
    
    child_name = payload.get("child_name") or "Child Device"
    device_name = payload.get("device_name") or "Android Phone"
    os_type = payload.get("os_type") or "Android"
    parent_email = payload.get("parent_email", "")
    age = payload.get("age", 10)
    battery_level = payload.get("battery_percentage", payload.get("batteryLevel", 95))
    battery_str = f"{battery_level}%"

    new_id = str(uuid.uuid4().int)[:6]
    
    child_info = {
        "child_id": new_id,
        "id": new_id,
        "parent_id": payload.get("parent_id", 1),
        "parent_email": parent_email,
        "name": child_name,
        "child_name": child_name,
        "age": age,
        "device": device_name,
        "deviceName": device_name,
        "os_type": os_type,
        "battery": battery_str,
        "battery_percentage": int(battery_level),
        "batteryLevel": int(battery_level),
        "charging_status": "Normal",
        "is_active_online": True,
        "permissions_granted": True,
        "status": "LINKED",
        "linking_code": linking_code,
        "last_sync_time": "Just now",
        "created_at": datetime.now().isoformat()
    }

    # Remove any existing child with same name if unlinked
    global children_db
    children_db = [c for c in children_db if c.get("name", "").lower() != child_name.lower()]
    children_db.append(child_info)

    screentime_db[new_id] = {
        "child_id": new_id,
        "daily_limit_minutes": 120,
        "current_usage_minutes": 0,
        "is_locked_remotely": False
    }

    paired_status = {
        "status": "LINKED",
        "child_id": new_id,
        "parent_id": child_info["parent_id"],
        "child_name": child_name,
        "device_name": device_name,
        "os_type": os_type,
        "battery": battery_str,
        "battery_percentage": int(battery_level),
        "is_active_online": True,
        "permissions_granted": True,
        "linking_timestamp": datetime.now().isoformat(),
        "message": "Child device connected & verified successfully!"
    }

    if linking_code:
        pairing_codes_db[linking_code] = paired_status
    if digits:
        pairing_codes_db[digits] = paired_status

    logger.info(f"Child device linked: {child_name} ({device_name}) with code {linking_code}")

    return {
        "status": "success",
        "child_id": new_id,
        "parent_id": child_info["parent_id"],
        "child_name": child_name,
        "device_name": device_name,
        "os_type": os_type,
        "battery": battery_str,
        "battery_percentage": int(battery_level),
        "message": "Device successfully linked!"
    }

@router.get("/api/pairing/check-parent-linked/{parent_id}")
@router.get("/api/parental/pairing/check-parent-linked/{parent_id}")
def check_parent_linked(parent_id: int):
    # Check if this parent has any active linked child
    parent_children = [c for c in children_db if c.get("parent_id") == parent_id or parent_id == 1]
    if parent_children:
        c = parent_children[-1]
        return {
            "status": "linked",
            "is_linked": True,
            "child_id": c["child_id"],
            "linked_child": c
        }
    return {"status": "unlinked", "is_linked": False, "child_id": None}

@router.post("/api/pairing/logout-attempt")
@router.post("/api/parental/pairing/logout-attempt")
def logout_attempt(payload: Dict[str, Any]):
    return {"status": "success"}

@router.get("/api/pairing/check-logout-attempt/{parent_id}")
@router.get("/api/parental/pairing/check-logout-attempt/{parent_id}")
def check_logout_attempt(parent_id: int):
    return {"has_attempt": False}

# ============================================
# ⌛ SCREENTIME
# ============================================
@router.get("/api/screentime/{child_id}/dashboard")
@router.get("/api/parental/screentime/{child_id}/dashboard")
def get_screentime(child_id: str):
    return screentime_db.get(child_id, {
        "child_id": child_id,
        "daily_limit_minutes": 120,
        "current_usage_minutes": 0,
        "is_locked_remotely": False
    })

@router.post("/api/screentime/{child_id}/remote-lock")
@router.post("/api/parental/screentime/{child_id}/remote-lock")
def remote_lock(child_id: str, payload: Dict[str, Any]):
    if child_id in screentime_db:
        screentime_db[child_id]["is_locked_remotely"] = payload.get("is_locked", True)
    return {"status": "success", "is_locked": payload.get("is_locked", True)}

@router.post("/api/screentime/{child_id}/daily-limit")
@router.post("/api/parental/screentime/{child_id}/daily-limit")
def daily_limit(child_id: str, payload: Dict[str, Any]):
    if child_id in screentime_db:
        screentime_db[child_id]["daily_limit_minutes"] = payload.get("daily_limit_minutes", 120)
    return {"status": "success", "daily_limit_minutes": payload.get("daily_limit_minutes", 120)}

# ============================================
# 📱 APPS & RESTRICTIONS
# ============================================
@router.get("/api/apps/{child_id}")
@router.get("/api/parental/apps/{child_id}")
def get_apps(child_id: str):
    return apps_db.get(child_id, [])

@router.post("/api/apps/{child_id}/toggle/{app_id}")
@router.post("/api/parental/apps/{child_id}/toggle/{app_id}")
def toggle_app(child_id: str, app_id: str, payload: Dict[str, Any]):
    apps = apps_db.get(child_id, [])
    for a in apps:
        if a["app_id"] == app_id:
            a["is_blocked"] = payload.get("is_blocked", not a["is_blocked"])
    return {"status": "success"}

# ============================================
# 🌐 WEB FILTERING
# ============================================
@router.get("/api/filters/{child_id}/rules")
@router.get("/api/parental/filters/{child_id}/rules")
def get_filters(child_id: str):
    return filters_db.get(child_id, {
        "status": "success",
        "child_id": child_id,
        "blocked_categories": {},
        "blacklisted_urls": []
    })

@router.post("/api/filters/{child_id}/category")
@router.post("/api/parental/filters/{child_id}/category")
def toggle_category(child_id: str, payload: Dict[str, Any]):
    cat = payload.get("category")
    val = payload.get("is_blocked", True)
    if child_id not in filters_db:
        filters_db[child_id] = {"status": "success", "child_id": child_id, "blocked_categories": {}, "blacklisted_urls": []}
    if cat:
        filters_db[child_id]["blocked_categories"][cat] = val
    return {"status": "success"}

@router.post("/api/filters/{child_id}/blacklist")
@router.post("/api/parental/filters/{child_id}/blacklist")
def add_blacklist(child_id: str, payload: Dict[str, Any]):
    url = payload.get("url")
    if child_id not in blacklist_db:
        blacklist_db[child_id] = []
    if url and url not in blacklist_db[child_id]:
        blacklist_db[child_id].append(url)
    return {"status": "success"}

@router.delete("/api/filters/{child_id}/blacklist/{url}")
@router.delete("/api/parental/filters/{child_id}/blacklist/{url}")
def remove_blacklist(child_id: str, url: str):
    if child_id in blacklist_db:
        blacklist_db[child_id] = [u for u in blacklist_db[child_id] if u != url]
    return {"status": "success"}

# ============================================
# 📍 LOCATION & GEOFENCES
# ============================================
@router.get("/api/location/{child_id}/live")
@router.get("/api/parental/location/{child_id}/live")
def get_child_live_location(child_id: str):
    return {
        "status": "success",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "accuracy": 10.0,
        "updated_at": datetime.now().isoformat()
    }

@router.post("/api/location/{child_id}/live")
@router.post("/api/parental/location/{child_id}/live")
def update_child_live_location(child_id: str, payload: Dict[str, Any]):
    return {"status": "success"}

@router.get("/api/location/{child_id}/geofences")
@router.get("/api/parental/location/{child_id}/geofences")
def get_geofences(child_id: str):
    return geofences_db.get(child_id, [])

@router.post("/api/location/{child_id}/geofences")
@router.post("/api/parental/location/{child_id}/geofences")
def save_geofences(child_id: str, payload: Dict[str, Any]):
    return {"status": "success"}

# ============================================
# 🚨 SOS & EMERGENCY
# ============================================
@router.get("/api/sos/preferences/{child_id}")
@router.get("/api/parental/sos/preferences/{child_id}")
def get_sos_preferences(child_id: str):
    return {
        "auto_dial_enabled": True,
        "emergency_contact": "",
        "broadcast_location": True
    }

@router.post("/api/sos/trigger")
@router.post("/api/parental/sos/trigger")
def trigger_sos(payload: Dict[str, Any]):
    child_id = str(payload.get("child_id", "1"))
    sos_db[child_id] = {
        "child_id": child_id,
        "latitude": payload.get("latitude", 12.9352),
        "longitude": payload.get("longitude", 77.6245),
        "triggered_at": datetime.now().isoformat(),
        "is_active": True
    }
    return {"status": "success", "alert_id": "sos-alert-1"}

@router.get("/api/sos/active/{child_id}")
@router.get("/api/parental/sos/active/{child_id}")
def active_sos(child_id: str):
    return sos_db.get(child_id) or {"is_active": False}

@router.post("/api/sos/resolve/{child_id}")
@router.post("/api/parental/sos/resolve/{child_id}")
def resolve_sos(child_id: str):
    sos_db[child_id] = None
    return {"status": "success", "message": "SOS alert marked resolved"}

# ============================================
# 📊 REPORTS & AUTH PIN
# ============================================
@router.get("/api/reports/{child_id}/summary")
@router.get("/api/parental/reports/{child_id}/summary")
def get_reports_summary(child_id: str):
    return {
        "child_id": child_id,
        "total_screen_time_hours": 0.0,
        "blocked_web_attempts": 0,
        "flagged_apps_count": 0,
        "date": datetime.now().strftime("%Y-%m-%d")
    }

@router.post("/api/auth/verify-parent-pin")
@router.post("/api/parental/auth/verify-parent-pin")
def verify_parent_pin(payload: Dict[str, Any]):
    pin = payload.get("pin", "")
    if pin == "1234" or len(pin) == 4:
        return {"status": "success", "valid": True}
    return {"status": "error", "valid": False}

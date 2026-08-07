# API Documentation Reference

This directory serves as the centralized registry for the integration endpoints across the 4 core API backend services. Use the templates below to define and synchronize specifications for each backend module.

---

## 1. Authentication API (`api-auth`)

* **API Name**: Authentication & User Management Service
* **Base URL**: `http://localhost:8000/api/v1/auth` (Placeholder - To be finalized by Team)
* **Authentication Requirements**: None / Public for Register & Login; JWT Bearer Token for Session verification.

### Endpoints

#### POST `/register`
* **HTTP Method**: `POST`
* **Request Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
* **Request Body**:
  ```json
  {
    "email": "parent@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }
  ```
* **Response Format (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Account successfully created.",
    "user_id": 101
  }
  ```
* **Error Responses (400 Bad Request)**:
  ```json
  {
    "status": "error",
    "detail": "Email is already registered."
  }
  ```

#### POST `/login`
* **HTTP Method**: `POST`
* **Request Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
* **Request Body**:
  ```json
  {
    "email": "parent@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Response Format (200 OK)**:
  ```json
  {
    "status": "success",
    "user_id": 101,
    "parent_name": "John Doe",
    "token_type": "bearer",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
* **Error Responses (401 Unauthorized)**:
  ```json
  {
    "status": "error",
    "detail": "Invalid credentials provided."
  }
  ```

---

## 2. Parent-Child Pairing API (`api-parent-child`)

* **API Name**: Parent-Child Linkage & Settings Sync Service
* **Base URL**: `http://localhost:8000/api/v1/pairing` (Placeholder - To be finalized by Team)
* **Authentication Requirements**: JWT Bearer Token (Parent Account Auth)

### Endpoints

#### POST `/pair`
* **HTTP Method**: `POST`
* **Request Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <access_token>"
  }
  ```
* **Request Body**:
  ```json
  {
    "pairing_code": "XYZ-987-ABC",
    "device_name": "Child Pixel 6"
  }
  ```
* **Response Format (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Device paired successfully.",
    "child_id": 402,
    "device_id": "device_abc123"
  }
  ```
* **Error Responses (404 Not Found / 400 Bad Request)**:
  ```json
  {
    "status": "error",
    "detail": "Pairing code expired or invalid."
  }
  ```

---

## 3. Device Monitoring API (`api-monitoring`)

* **API Name**: Application & Screen Limit Management Service
* **Base URL**: `http://localhost:8000/api/v1/monitoring` (Placeholder - To be finalized by Team)
* **Authentication Requirements**: JWT Bearer Token / Device-Link Key

### Endpoints

#### POST `/limits`
* **HTTP Method**: `POST`
* **Request Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <access_token>"
  }
  ```
* **Request Body**:
  ```json
  {
    "child_id": 402,
    "app_limits": [
      {
        "package_name": "com.gaming.app",
        "time_limit_minutes": 60,
        "is_blocked": false
      }
    ]
  }
  ```
* **Response Format (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Application rules and screen limits saved."
  }
  ```
* **Error Responses (403 Forbidden)**:
  ```json
  {
    "status": "error",
    "detail": "Permission denied. Parent account not paired with this child ID."
  }
  ```

---

## 4. Security & Alert API (`api-security`)

* **API Name**: Malware Scanning, Geolocation alerts & Posture Audit Service
* **Base URL**: `http://localhost:8000/api/v1/security` (Placeholder - To be finalized by Team)
* **Authentication Requirements**: Device Hardware Signature / Link Token

### Endpoints

#### POST `/alerts`
* **HTTP Method**: `POST`
* **Request Headers**:
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer <access_token>"
  }
  ```
* **Request Body**:
  ```json
  {
    "device_id": "device_abc123",
    "alert_type": "malware_detected",
    "severity": "high",
    "details": {
      "app_name": "NetMirror.apk",
      "package_name": "com.sallysoft.srpol.edge",
      "threat_type": "Trojan-Banker"
    }
  }
  ```
* **Response Format (200 OK)**:
  ```json
  {
    "status": "success",
    "alert_logged_id": 9081
  }
  ```
* **Error Responses (500 Internal Server Error)**:
  ```json
  {
    "status": "error",
    "detail": "Database connection timeout. Failed to record alert."
  }
  ```

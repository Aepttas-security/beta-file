# Integration Testing Checklist

Use this checklist to verify connectivity, request formats, schema mapping, and error resilience during application integration.

---

## 1. Build Verification
- [ ] Frontend builds successfully (`npm run android` parses without errors).
- [ ] All Gradle and Metro build environments compile correctly.

## 2. API Connectivity Checks
- [ ] **Parent Control API connection**:
  - [ ] Ping root health-check endpoint.
  - [ ] Verify frontend dashboard fetches child pairing configurations.
- [ ] **Call Management API connection**:
  - [ ] Ping root health-check endpoint.
  - [ ] Verify live call simulator card displays status logs from call server.
- [ ] **Vulnerability API connection**:
  - [ ] Ping root health-check endpoint.
  - [ ] Verify app posture reports load on request.
- [ ] **Geolocation API connection**:
  - [ ] Ping root health-check endpoint.
  - [ ] Verify location history endpoints resolve correctly.
- [ ] **Malware API connection**:
  - [ ] Ping root health-check endpoint.
  - [ ] Verify signature checker is responding.

## 3. Schema & Validation Checks
- [ ] **API Request/Response Validation**:
  - [ ] Verify frontend payload keys (camelCase) match backend models (snake_case or camelCase).
  - [ ] Check query and path parameter names.
- [ ] **Authentication Testing**:
  - [ ] Verify JWT token storage is persistent and refreshed correctly.
  - [ ] Verify route interceptors block unauthorized access.

## 4. Resilience & Error Handling
- [ ] **Error Handling**:
  - [ ] Verify UI shows clean, user-friendly warnings when receiving non-200 responses (e.g., `400 Bad Request`, `401 Unauthorized`, `500 Server Error`).
- [ ] **Network Failure Handling**:
  - [ ] Test application behavior under simulated packet loss, network throttling, or offline states.
  - [ ] Verify offline mock database fallbacks work correctly.

## 5. End-to-End Application Testing
- [ ] Test the entire user journey: User Registration -> Link Child Code -> Toggle Limits -> Simulate Spam Caller Detection -> Trigger Vulnerability Scanning -> Display Live Geo-logs.

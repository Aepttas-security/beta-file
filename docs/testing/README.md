# Integration Testing Checklist

This checklist defines the validation checkpoints necessary to verify structural connectivity, data mapping, and routing reliability between the Android UI client and the integrated API backend services.

---

## 1. Authentication Integration Checklist (`api-auth`)
- [ ] **Registration Verification**:
  - [ ] Submit registration form from frontend UI (`SignUpScreen.tsx`).
  - [ ] Verify endpoint `POST /register` is hit with exact payload properties (`email`, `password`, `name`).
  - [ ] Confirm response parses `status: "success"` and updates UI.
- [ ] **Login Verification**:
  - [ ] Input credentials on `LoginScreen.tsx`.
  - [ ] Verify `POST /login` processes login request.
  - [ ] Confirm access token JWT is returned and stored securely in local app storage.
- [ ] **Bypass Toggle Validation**:
  - [ ] Test decoupled login toggles behave correctly under network loss/failure.

---

## 2. Parent-Child Pairing Checklist (`api-parent-child`)
- [ ] **Pairing Request Validation**:
  - [ ] Submit pairing pin code from `ChildLinkScreen.tsx`.
  - [ ] Verify pairing code structure aligns with schema (`api-parent-child` pairing model).
  - [ ] Confirm response stores `device_id` and binds parent state.

---

## 3. Device Monitoring Checklist (`api-monitoring`)
- [ ] **Screen Rules Synchronization**:
  - [ ] Adjust parental limits controls on the dashboard screen.
  - [ ] Verify rules array payload is pushed to `/limits`.
  - [ ] Confirm child profile screen updates restrictions in real-time.

---

## 4. Vulnerability & Security Alerts Checklist (`api-security`)
- [ ] **Malware Scan Event Log**:
  - [ ] Trigger an APK scan or install simulation.
  - [ ] Verify the detection alerts payload is POSTed to the alert gateway database.
  - [ ] Confirm alert notification pops up correctly in the Parent's Dashboard layout.
- [ ] **Geolocation history tracking**:
  - [ ] Save GPS logs on `GeoTrackingScreen.tsx`.
  - [ ] Verify request logs are saved to database.
  - [ ] Verify history logs display correctly inside location history lists.

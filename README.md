# Android Security Application

## 1. Project Overview & Purpose
The **Android Security Application** is a consolidated mobile security and device management platform designed to protect users, secure operating environments, and empower parents. 

The application offers a unified suite of security and tracking layers:
* **Parental Controls**: Manage app restrictions, set active screen time limits, and audit linked child accounts.
* **Live Call Intel & Call Management**: Active caller intelligence, risk level gauges, spam reporting, and real detection active toggles.
* **Security & Vulnerabilities Auditor**: Permission scan validation reports, APK sandboxing, and security posture checks.
* **Geolocation Tracker**: Active tracker telemetry mapping, log history recording, and nearby places search.
* **Malware Engine**: Static scanning algorithms and MD5 hash database verification checks.

---

## 2. Repository Structure

```
SecurityApp/
│
├── frontend/
│   └── android-app/
│       └── [Android UI Project]
│
├── backend/
│   ├── parent-control/         # Parent Control API codebase
│   ├── call-management/        # Call Management API codebase
│   ├── vulnerability/          # Vulnerability API codebase
│   ├── geolocation/            # Geolocation API codebase
│   └── malware/                # Malware API codebase
│
├── docs/
│   ├── api-documentation/      # API templates & specs completed by backend teams
│   ├── architecture/           # Data flow charts & diagram maps
│   └── testing/                # Integration testing checklists
│
├── .gitignore
├── README.md
└── docker-compose.yml          # Container configuration orchestrator
```

---

## 3. Frontend Information & Run Instructions

The frontend is built using **React Native (TypeScript)**. 

### Instructions for running the frontend:
1. **Navigate into the application folder**:
   ```bash
   cd frontend/android-app
   ```
2. **Install node dependencies**:
   ```bash
   npm install
   ```
3. **Start the Metro Bundler**:
   ```bash
   npm start
   ```
4. **Boot the application on an emulator or device**:
   Make sure an active Android Virtual Device (AVD) is running, then execute:
   ```bash
   npm run android
   ```

---

## 4. Backend/API Modules & Integration Workflow

There are five modular services under the `backend/` directory:
1. **Parent Control**: Manages user profiles, linking keys, and application timer constraints.
2. **Call Management**: Relays live caller scores and updates list definitions for blacklisted contacts.
3. **Vulnerability**: Audits application postures and handles sandbox validation checks.
4. **Geolocation**: Records device tracking logs and fetches nearby location points.
5. **Malware**: Hosts signature reference libraries and logs scans.

### Instructions for adding backend modules:
Each backend team should clone the main repository, create their dedicated feature branch, place their codebase inside their designated subfolder (`backend/<module-name>`), configure their Dockerfile build instructions, and add local launch guides to their module.

### Integration Workflow:
1. Complete API specs in [`docs/api-documentation/README.md`](docs/api-documentation/README.md).
2. Wire API URL calls in the React Native repository layer (`frontend/android-app/src/data/`).
3. Set up the Docker containers inside the root [`docker-compose.yml`](docker-compose.yml) to perform system-wide local integration tests.

---

## 5. Git Branching & Pull Request Workflow

We use a feature-branch flow to coordinate collaborations cleanly across the monorepo:

### Branching Hierarchy
```
main
│
├── feature/parent-control
├── feature/call-management
├── feature/vulnerability
├── feature/geolocation
├── feature/malware
└── feature/ui-integration
```

### Team Collaboration Workflow
1. **Create Feature Branch**:
   Check out from `main` to a module feature branch:
   ```bash
   git checkout -b feature/<module-name>
   ```
2. **Implement Changes**:
   Write files *only* within your designated folder (e.g., `backend/parent-control/` or `docs/api-documentation/`). Do not touch other teams' code.
3. **Commit & Push Work**:
   ```bash
   git add .
   git commit -m "feat: implement initial endpoints configuration for <module-name>"
   git push origin feature/<module-name>
   ```
4. **Pull Request (PR)**:
   Create a Pull Request against `main`. Ensure all integration checklist test boxes pass before obtaining code-review approval to merge.

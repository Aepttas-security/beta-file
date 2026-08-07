# Android Security Application Monorepo (SecurityApp)

This repository hosts the consolidated source code for the Android Security Application. It comprises the React Native Android frontend application and the four modular FastAPI backend services designed to support security auditing, parental control coordination, pairing link verification, and alert relays.

---

## 1. Repository Structure

```
SecurityApp/
│
├── frontend/
│   └── android-app/
│       └── [Android UI Project]
│
├── backend/
│   ├── api-auth/               # Authentication microservice
│   ├── api-parent-child/       # Parent-child relationship linker
│   ├── api-monitoring/         # App limits & screen time logging
│   └── api-security/           # Vulnerability, scans & alert logging
│
├── docs/
│   ├── api-documentation/      # API definitions & schema spec templates
│   ├── architecture/           # Data flows & system diagrams
│   └── testing/                # Integration checklist
│
├── .gitignore
├── README.md
└── docker-compose.yml          # Container configuration orchestrator
```

---

## 2. Local Development Requirements

Before booting components, install these dependencies on your dev workstation:
1. **Node.js** (v18+) & **npm** (v9+)
2. **JDK** (v17+) for Gradle compilation
3. **Android Studio** (with Android SDK & virtual emulators set up)
4. **Python** (v3.10+) & **pip**
5. **Docker Desktop** (for container orchestration)

---

## 3. How to Run the Android Frontend

Navigate into the React Native application directory:
```bash
cd frontend/android-app
```

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the Metro Bundler**:
   ```bash
   npm start
   ```
3. **Run on Android Emulator/Device**:
   Ensure an active Android virtual device is booted, then run:
   ```bash
   npm run android
   ```

---

## 4. How to Run Each Backend API (FastAPI)

Each backend service resides inside its dedicated directory. They are designed to run isolated:

### api-auth (Port 8000)
```bash
cd backend/api-auth
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### api-parent-child (Port 8001)
```bash
cd backend/api-parent-child
python -m venv .venv
# Activate virtual environment, then install and run:
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### api-monitoring (Port 8002)
```bash
cd backend/api-monitoring
python -m venv .venv
# Activate virtual environment, then install and run:
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

### api-security (Port 8003)
```bash
cd backend/api-security
python -m venv .venv
# Activate virtual environment, then install and run:
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
```

---

## 5. How Frontend Communicates with the APIs

Communication is driven by standard HTTP/REST requests containing JSON payloads.
The endpoints are structured cleanly in the frontend's repository layer:
* **Authentication**: Resolved via [`authRepository.ts`](frontend/android-app/src/data/authRepository.ts) routing login/signup calls to `api-auth`.
* **Parental Controls**: Managed by [`parentalRepository.ts`](frontend/android-app/src/data/parentalRepository.ts) sending synchronization instructions to `api-parent-child` and `api-monitoring`.
* **Scanning & Tracking**: Orchestrated by [`repository.ts`](frontend/android-app/src/data/repository.ts) querying malware updates and geolocations from `api-security`.

To route traffic correctly during local development, ensure base address IPs match your machine’s private LAN IP rather than localhost/127.0.0.1 (so virtual devices or physical testing phones can connect over Wi-Fi).

---

## 6. Docker Orchestration

To run all four backend services concurrently under Docker, configure the secrets, connection strings, and ports inside the root level [`docker-compose.yml`](docker-compose.yml) and run:
```bash
docker-compose up --build
```
This is suitable for testing end-to-end integration matches before staging deployment.

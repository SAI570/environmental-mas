# Self-Organizing Multi-Agent Systems for Decentralized Environmental Monitoring

> **B.Tech Computer Science Final Project & Academic Demonstration**  
> *Autonomous Edge Sensing • AI Anomaly Detection • Peer-to-Peer Consensus • Self-Organizing Mesh Recovery*

---

## Table of Contents
1. [Project Title](#1-project-title)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Proposed Solution](#4-proposed-solution)
5. [System Architecture](#5-system-architecture)
6. [AI Anomaly Detection](#6-ai-anomaly-detection)
7. [Event Classification](#7-event-classification)
8. [Autonomous Agents](#8-autonomous-agents)
9. [Agent Communication](#9-agent-communication)
10. [Local Consensus](#10-local-consensus)
11. [Failure Handling](#11-failure-handling)
12. [Self-Organization](#12-self-organization)
13. [Network Recovery](#13-network-recovery)
14. [Database Design](#14-database-design)
15. [API Endpoints](#15-api-endpoints)
16. [Frontend Pages](#16-frontend-pages)
17. [Installation Instructions](#17-installation-instructions)
18. [How to Run on Windows (PowerShell)](#18-how-to-run-on-windows-powershell)
19. [Faculty Viva Demonstration Workflow](#19-faculty-viva-demonstration-workflow)
20. [Testing Instructions](#20-testing-instructions)
21. [Limitations & Honest Academic Scope](#21-limitations--honest-academic-scope)
22. [Future Enhancements](#22-future-enhancements)
23. [Deployment Instructions (Vercel, Render & Supabase)](#23-deployment-instructions)

---

## 1. Project Title
**Self-Organizing Multi-Agent Systems for Decentralized Environmental Monitoring**

---

## 2. Problem Statement
Traditional environmental monitoring deployments rely on centralized telemetry collection, where remote sensor stations periodically stream raw readings to a central cloud server. This paradigm introduces critical single-point vulnerabilities:
- **Central Point of Failure:** If the central processing server or base station connectivity fails, alerting ceases entirely.
- **Sensor False Positives:** Individual malfunctioning sensors frequently trigger false alarms when analyzing readings in isolation without local peer corroboration.
- **Topological Fragility:** Node destruction (e.g., from wildfires, floods, battery exhaustion, or hardware faults) partitions the communication network, leaving surviving sensor clusters isolated and unable to relay incident warnings.

---

## 3. Objectives
1. Simulate a multi-agent environmental swarm of 20 autonomous software nodes with spatial coordinates, telemetry, and battery status.
2. Train a lightweight machine learning anomaly detection model using Scikit-Learn's Isolation Forest on multi-variate environmental readings.
3. Formulate transparent, deterministic event classification rules (Wildfire, Industrial Pollution, Extreme Heat, Baseline Normal).
4. Simulate peer-to-peer communication among active neighbors within physical proximity range.
5. Implement neighbor-based voting consensus to confirm environmental emergencies before raising system alarms.
6. Handle dynamic node failures, sever inactive communication links, and autonomously reorganize network edges to preserve topological connectivity.
7. Persist audit events, incident records, telemetry snapshots, and consensus votes in a local SQLite database (with PostgreSQL / Supabase compatibility).
8. Provide a professional 6-page operations center web dashboard built with Next.js and Tailwind CSS.

---

## 4. Proposed Solution
This project develops an integrated, student-level simulation where intelligence and decision-making are locally distributed among autonomous agent nodes. Each agent independently samples its micro-environment, checks its readings against a trained AI Isolation Forest model, classifies potential incident types, exchanges alerts with neighboring peers, and votes in a localized consensus protocol. If any agent fails, remaining active nodes detect edge severance and autonomously adjust transmission power to reorganize communication bridges, maintaining swarm connectivity.

```
Environmental Sensing
         ↓
Local AI Analysis (Isolation Forest)
         ↓
Anomaly Detection
         ↓
Event Classification (Explainable Rules)
         ↓
Agent-to-Agent Communication (Alert Broadcasts)
         ↓
Local Consensus (Quorum & Threshold Voting)
         ↓
Incident Confirmation
         ↓
Agent Failure Simulation
         ↓
Network Reorganization (Adaptive Range Mesh)
         ↓
Recovery Verification (Real Timer Benchmark)
         ↓
Continued Monitoring & Historical Persistence
```

---

## 5. System Architecture
The system consists of two primary layers designed with clean separation of concerns:

- **Backend (Python 3.10+ / FastAPI):**
  - `SimulationManager`: Maintains state for 20 autonomous agents.
  - `AnomalyDetector`: Scikit-Learn Isolation Forest wrapper with validation.
  - `EventClassifier`: Rule-based classification engine.
  - `CommunicationBus`: Simulated peer message exchange.
  - `LocalConsensusEngine`: Quorum and voting mechanism.
  - `NetworkManager`: Authoritative NetworkX graph maintaining nodes, Euclidean proximity edges, and adaptive reorganization.
  - `Database Layer`: SQLAlchemy ORM with SQLite for zero-config local operation.
- **Frontend (Next.js 14 / TypeScript / Tailwind CSS):**
  - Six specialized operational consoles.
  - Custom SVG interactive network graph mirroring the NetworkX graph.
  - Direct REST communication with FastAPI.

---

## 6. AI Anomaly Detection
- **Algorithm:** Scikit-Learn `IsolationForest(n_estimators=100, contamination=0.03, random_state=42)`.
- **Training Data:** 2,500 synthetic samples generated via `backend/scripts/train_model.py` modeling ambient wilderness and urban buffer readings:
  - Temperature: $18^\circ\text{C} - 32^\circ\text{C}$ (mean $24.5^\circ\text{C}$)
  - Humidity: $35\% - 80\%$ (mean $58.0\%$)
  - Smoke Particulate: $0.005 - 0.12$ (mean $0.030$)
  - $\text{CO}_2$: $360 - 520\text{ ppm}$ (mean $415\text{ ppm}$)
  - Air Quality Index (AQI): $15 - 85$ (mean $42$)
  - Soil Moisture: $25\% - 70\%$ (mean $48.0\%$)
- **Artifact:** Persisted to `models/isolation_forest.joblib`.
- **Role:** The ML model determines *whether* multivariate sensor readings deviate abnormally from nominal bounds. It does not label the event type; that responsibility belongs to the Event Classifier.

---

## 7. Event Classification
Explainable, deterministic classification logic mapping sensor evidence to event types:

| Event Type | Sensor Evidence Criteria | Severity |
| :--- | :--- | :--- |
| **FIRE** | $\text{Temp} \ge 40^\circ\text{C}$, $\text{Smoke} \ge 0.25$, $\text{Humidity} \le 35\%$ | CRITICAL |
| **POLLUTION** | $\text{AQI} \ge 130$, $\text{CO}_2 \ge 680\text{ ppm}$, $\text{Smoke} \ge 0.12$, $\text{Temp} < 42^\circ\text{C}$ | HIGH |
| **EXTREME_HEAT** | $\text{Temp} \ge 39^\circ\text{C}$, $\text{Smoke} < 0.20$ (clean atmospheric profile) | HIGH |
| **OTHER_ANOMALY** | ML Anomaly flagged, but criteria above not met (e.g., severe soil drought) | MEDIUM |
| **NORMAL** | All parameters within calibrated baseline ranges | NORMAL |

---

## 8. Autonomous Agents
Each agent node (`Agent`) represents a deployed sensor station or drone:
- Unique identifier (e.g., `A01` through `A20`).
- 2D coordinate on a $100\text{m} \times 100\text{m}$ grid.
- Current telemetry: Temperature, Humidity, Smoke, $\text{CO}_2$, AQI, Soil Moisture, Battery $\%$.
- Operational status: `ACTIVE`, `FAILED`, `WARNING`.
- Local inbox for peer messages.
- Assigned environmental zone (e.g., North Forest, Pine Ridge, Industrial Outpost).

---

## 9. Agent Communication
Simulated local wireless communication (`CommunicationBus`):
- Message format: `sender_id`, `receiver_id`, `message_type` (`ALERT`, `HEARTBEAT`), `event_type`, `severity`, `evidence`, and `timestamp`.
- When an agent flags an environmental anomaly, it broadcasts an `ALERT` packet to all active neighbors within radio range.
- Failed nodes cannot send or receive messages.

---

## 10. Local Consensus
Multi-agent agreement avoids isolated false alarms:
- **Voting Quorum:** At least 2 active nodes must participate.
- **Agreement Threshold:** $\ge 60\%$ of participating nodes must corroborate the candidate event.
- **Consensus Strength:**
  $$\text{Strength} = \left(\frac{\text{Supporting Nodes}}{\text{Total Participating Nodes}}\right) \times 100\%$$
- **Outcome Statuses:**
  - `CONFIRMED`: Quorum reached and $\ge 60\%$ agreement.
  - `INCONCLUSIVE`: Conflicting evidence or isolated node with no corroborating peers.
  - `REJECTED`: Neighborhood majority voted against the candidate event.

---

## 11. Failure Handling
When an agent experiences battery depletion, physical damage, or simulated hardware fault:
1. Status transitions to `FAILED`.
2. All incident communication edges are severed in the NetworkX graph.
3. The node is barred from consensus voting and message reception.
4. An audit record is written to the database.

---

## 12. Self-Organization
To preserve monitoring connectivity after node failures:
- Active nodes evaluate the remaining connected components in the NetworkX graph.
- If the network becomes partitioned into $\ge 2$ disconnected sub-graphs, surviving boundary agents boost transmission power to an extended adaptive relay radius ($R_{\text{adaptive}} = 38\text{m}$).
- New adaptive edges (`ADAPTIVE_REORGANIZED`) are established between nearest boundary nodes.
- Execution duration is measured using Python's `time.perf_counter()`.

---

## 13. Network Recovery
- **Proximity Metric:** 2D Euclidean Distance:
  $$d(u, v) = \sqrt{(x_u - x_v)^2 + (y_u - y_v)^2}$$
- **Base Range:** $R = 28.0\text{ units}$.
- **Adaptive Range:** $R = 38.0\text{ units}$.
- Restoring a failed node returns it to `ACTIVE`, re-evaluates physical neighbors, and re-integrates the node into the mesh.

---

## 14. Database Design
Uses SQLAlchemy ORM:
- **SQLite** by default (`./environmental_mas.db`).
- **PostgreSQL / Supabase** supported via `DATABASE_URL`.
- **Tables:**
  - `incidents`: Historical records of environmental events and consensus outcomes.
  - `sensor_readings`: Periodic telemetry snapshots.
  - `consensus_records`: Detailed voting audits.
  - `agent_failures`: Node failure logs, lost/added links, and recovery duration benchmarks.
  - `system_activities`: Unified chronological operational audit trail.

---

## 15. API Endpoints
All endpoints are prefixed with `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | High-level summary of swarm health, anomalies, and active incident |
| `GET` | `/api/agents` | List all 20 agents with telemetry, battery, and neighbor counts |
| `GET` | `/api/agents/{id}` | Detailed telemetry and AI diagnostic state of a specific node |
| `POST`| `/api/agents` | Deploy a new autonomous agent node |
| `PATCH`| `/api/agents/{id}` | Update sensor readings, coordinates, or battery |
| `DELETE`| `/api/agents/{id}` | Decommission an agent node |
| `POST`| `/api/agents/{id}/analyze` | Execute on-demand AI anomaly detection & event classification |
| `POST`| `/api/agents/{id}/fail` | Simulate node failure and trigger self-organization |
| `POST`| `/api/agents/{id}/restore` | Restore node to active status and recalculate links |
| `GET` | `/api/network` | Full NetworkX graph (nodes, edges, connectivity status) |
| `POST`| `/api/network/recover` | Trigger manual self-organizing network reorganization |
| `GET` | `/api/events` | List historical environmental incidents |
| `POST`| `/api/events/fire` | Trigger wildfire scenario near target node |
| `POST`| `/api/events/pollution` | Trigger pollution spike scenario near target node |
| `POST`| `/api/events/extreme-heat` | Trigger heatwave scenario near target node |
| `POST`| `/api/events/reset` | Reset simulation to initial 20 normal agents |
| `GET` | `/api/history` | Retrieve chronological audit activity trail |
| `GET` | `/api/analytics` | Aggregated time-series and recovery benchmark metrics |

---

## 16. Frontend Pages
The Next.js web application consists of 6 dedicated operational consoles:
1. **Command Center (`/command-center` or `/`):** High-level overview, live KPI cards, interactive geospatial mesh map, active incident banner, and recent actions feed.
2. **Agent Operations (`/agents`):** Complete swarm directory table, real-time sensor dials, AI anomaly score badge, manual reading editor, and deploy/fail/restore controls.
3. **Network Intelligence (`/network`):** Interactive NetworkX SVG mesh with active/failed/reorganized edges, live recovery benchmark card, and quick failure toggles.
4. **Incident Management (`/incidents`):** One-click scenario triggers (Fire, Pollution, Heatwave, Reset), detailed primary detector evidence panel, consensus breakdown, and incident history table.
5. **Environmental Analytics (`/analytics`):** Dynamic SVG charts for Temperature over time, Smoke levels over time, Anomaly vs Baseline ratios, and Self-organization recovery duration benchmarks.
6. **System History (`/history`):** Complete chronological audit trail with category filtering (`INCIDENT`, `CONSENSUS`, `ANOMALY`, `FAILURE`, `RECOVERY`, `AGENT`) and text search.

---

## 17. Installation Instructions
### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Windows PowerShell (or standard Linux/macOS bash)

---

## 18. How to Run on Windows (PowerShell)

### Step 1: Open Terminal 1 (Backend)
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Generate synthetic dataset and train AI model
python scripts/train_model.py

# Start the FastAPI backend server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*Backend will be running at:* `http://127.0.0.1:8000`  
*Interactive Swagger API documentation:* `http://127.0.0.1:8000/docs`

---

### Step 2: Open Terminal 2 (Frontend)
```powershell
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend will be running at:* `http://localhost:3000`

---

## 19. Faculty Viva Demonstration Workflow
Follow this 10-step sequence during your project examination:

1. **Initial Monitoring State:**
   - Open `http://localhost:3000` (Command Center).
   - Point out all 20 nodes active, nominal environmental readings, and fully connected mesh edges.
2. **Simulate Wildfire Incident:**
   - Navigate to **Incident Management** (`/incidents`).
   - Click **Trigger Wildfire** (targets node `A07` in Pine Ridge).
3. **Inspect AI Anomaly Detection:**
   - Observe how `A07` and surrounding nodes detect sharp sensor deviations.
   - Show the Isolation Forest decision score transitioning from positive (normal) to negative (anomaly).
4. **Explain Event Classification:**
   - Demonstrate why the classifier identified `FIRE`: Temperature exceeded $40^\circ\text{C}$, smoke particulate spiked above $0.25$, and humidity dropped below $35\%$.
5. **Demonstrate Neighbor Alerting:**
   - Show that `A07` broadcasted alert packets to its physical neighbors (`A06`, `A08`, `A09`).
6. **Explain Local Consensus:**
   - Show the consensus voting panel: 3 out of 4 nodes corroborated the fire signature ($75\%$ consensus strength $\ge 60\%$ threshold $\rightarrow$ `CONFIRMED`).
7. **Simulate Node Failure:**
   - Navigate to **Agent Operations** (`/agents`).
   - Select node `A05` (a central bridge node) and click **Simulate Failure**.
8. **Demonstrate Self-Organizing Network Recovery:**
   - Navigate to **Network Intelligence** (`/network`).
   - Point out `A05` marked in gray as `FAILED`, its standard links removed, and new adaptive cyan bridge edges established.
   - Highlight the **Self-Organization Metrics** box displaying real measured recovery time (typically $0.2 - 0.9\text{ ms}$).
9. **Inspect Historical Audit Trail:**
   - Navigate to **System History** (`/history`).
   - Show the persisted audit records for incident creation, consensus voting, node failure, and network recovery.
10. **Review Environmental Analytics:**
    - Navigate to **Environmental Analytics** (`/analytics`).
    - Show the temperature and smoke spikes recorded on the time-series charts.

---

## 20. Testing Instructions
The backend includes a comprehensive pytest suite covering all 16 specification points.

Run the tests using PowerShell:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest tests -v
```

All 25 test cases will execute and verify:
- AI Isolation Forest model training, saving, and loading
- Baseline normal vs anomalous sensor vector detection
- Deterministic event classification rules (Fire, Pollution, Heat, Normal)
- Agent creation, updating, and positioning
- Neighbor-based alert broadcasting (ignoring failed nodes)
- Local consensus confirmation, inconclusive decisions, and insufficient quorum
- Node failure, edge severing, and NetworkX topological updates
- Self-organizing adaptive range reorganization with real duration measurement
- Node restoration and link re-establishment
- Database persistence of incidents, consensus, and system activities
- FastAPI REST endpoint contracts and schemas

---

## 21. Limitations & Honest Academic Scope
- **Simulated Radio & Hardware:** Sensor readings, node coordinates, and peer radio transmissions are simulated in Python memory. Physical IoT hardware (e.g., ESP32, LoRaWAN) is not attached.
- **Architectural Scope:** While agent decision logic and consensus voting are locally distributed among neighborhood nodes, the web application utilizes a centralized FastAPI backend and SQLite database to coordinate the demonstration and provide web observability.

---

## 22. Future Enhancements
- Integration of physical hardware microcontrollers (e.g., ESP32 nodes communicating via ESP-NOW or LoRa mesh).
- Dynamic mobile agents utilizing A* pathfinding to simulate autonomous drone relocation toward high-risk incident zones.
- Time-series forecasting models (e.g., ARIMA or lightweight LSTM) to predict fire spread trajectories.
- Cryptographic message signing for Byzantine fault tolerance.

---

## 23. Deployment Instructions

### A. Frontend Deployment (Vercel)
1. Push project to your GitHub repository (when requested).
2. Import `frontend` directory into Vercel.
3. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g., `https://your-mas-backend.onrender.com`).
4. Click Deploy.

### B. Backend Deployment (Render)
1. In Render, create a new **Web Service**.
2. Set Root Directory to `backend`.
3. Set Build Command: `pip install -r requirements.txt && python scripts/train_model.py`
4. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure Environment Variables:
   - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app`
   - `DATABASE_URL`: Your Supabase connection string (or leave empty for ephemeral SQLite).

### C. Database Deployment (Supabase PostgreSQL)
1. Create a free project at [supabase.com](https://supabase.com).
2. Copy the PostgreSQL connection URI from Project Settings $\rightarrow$ Database.
3. Add `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` to your Render environment variables.
4. FastAPI will automatically initialize all required tables on startup.

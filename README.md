# ACKERMAN — MAN 6L23/30H Digital Twin Platform

Industrial digital twin system for MAN Energy Solutions 6L23/30H GenSet with real-time monitoring, ML-based predictive maintenance, and physics simulation.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Web App                      │
│         (Vite + Tailwind + Recharts)                │
│                                                     │
│  ┌──────────┐ ┌────────────┐ ┌────────────────┐     │
│  │Dashboard │ │ ML Results │ │   Simulation   │     │
│  │  Gauges  │ │  Health    │ │  Controls +    │     │
│  │  Trends  │ │  RUL       │ │  Live Results  │     │
│  └────┬─────┘ └─────┬──────┘ └───────┬────────┘     │
└───────┼─────────────┼────────────────┼──────────────┘
        │             │                │
        ▼             ▼                ▼
┌─────────────────────────────────────────────────────┐
│                  SUPABASE                           │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │
│  │ Table 1      │ │ Table 2      │ │ Table 3    │   │
│  │sensor_       │ │ml_           │ │simulation_ │   │
│  │readings      │ │predictions   │ │data        │   │
│  │              │ │              │ │row1=control│   │
│  │← ST1 writes  │ │← ST2 writes  │ │← web writes│   │
│  │→ web reads   │ │→ web reads   │ │rows 2+ ←   │   │
│  └──────┬───────┘ └──────┬───────┘ └──────┬─────┘   │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Streamlit1│    │Streamlit2│    │Streamlit3│
    │  Data    │    │   ML     │    │  Sim     │
    │Generator │    │ Engine   │    │ Engine   │
    └──────────┘    └──────────┘    └──────────┘
```

## Engine: MAN 6L23/30H GenSet (Tier II)

| Parameter | Value |
|-----------|-------|
| Cylinders | 6 (in-line) |
| Bore / Stroke | 225mm / 300mm |
| Rated Power | 780 kW @ 720 rpm / 810 kW @ 750 rpm |
| Rated Speed | 720 rpm (also 750 rpm variant) |
| TBO | 8,000 hours |
| Firing Order | 1-4-2-6-3-5 |

## Monitored Parameters (35+)

### Speed System
- Engine Speed (RPM) — Alarm: 815, Shutdown: 825
- Turbocharger Speed (RPM) — Alarm: 55,290

### Lubricating Oil System (SAE 40)
- LO Temp Before Cooler — Normal: 60-75°C, Alarm: 85°C, Shutdown: 95°C
- LO Temp After Cooler (inlet engine) — Normal: 45-65°C, Alarm: 75°C, Shutdown: 85°C
- LO Pressure After Filter — Normal: 3.1-4.5 bar, Alarm: <2.5 bar, Shutdown: <3.0 bar
- LO Filter Pressure Drop — Normal: 0.5-1.0 bar, Alarm: >1.5 bar
- LO Level — Alarm low: 20%, high: 95%
- Main Bearing Temperature — Alarm: >95°C

### HT Cooling Water System (setpoint 82°C)
- HT CW Temp Inlet — Normal: 60-75°C, Alarm: 90°C
- HT CW Temp Outlet — Normal: 70-85°C, Alarm: 90°C, Shutdown: 93°C
- HT CW Pressure — Alarm: <0.4+static bar
- HT CW Temp Rise — Normal: 5-10°C

### LT Cooling Water System (setpoint 35°C)
- LT CW Pressure — Alarm: <0.4+static bar
- LT CW Temp Outlet — Normal: 29-41°C

### Exhaust Gas System
- Exhaust Temp Before TC — Normal: 425-475°C, Alarm: 550°C, Shutdown: 600°C
- Exhaust Temp After TC — Normal: 290-370°C, Alarm: 450°C
- Exhaust Temp Cyl #1-6 — Alarm: >500°C, Deviation: ±50°C

### Charge Air System
- Charge Air Pressure — Normal: 2.0-2.5 bar, Alarm: <1.5 bar
- Charge Air Temperature — Normal: 35-55°C, Alarm: >65°C

### Fuel Oil System
- Fuel Oil Pressure (MDO) — Normal: 2.5-5 bar, Alarm: <1.5 bar
- Fuel Rack Position — 0-100%

### Alternator / Electrical
- Generator Load — 0-780 kW
- Frequency — Normal: 49.5-50.5 Hz
- Voltage — Normal: 385-415 V
- Load Factor — 0-100%

### Safety Sensors
- Oil Mist Level — Alarm: >50%, Shutdown: >80%
- Crankcase Pressure
- Start Air Pressure — Normal: 7-30 bar, Alarm: <7 bar
- Ambient Temperature

---

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase_schema.sql`
3. Go to Settings > API, copy your Project URL and anon key

### 2. React App Setup
```bash
cd ackerman-digital-twin

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials and Streamlit URLs

# Run development server
npm run dev

# Build for production
npm run build
```

### 3. Streamlit Services Setup

Deploy each of the three Streamlit files to [Streamlit Community Cloud](https://streamlit.io/cloud):

1. Go to share.streamlit.io → New app
2. Upload your repository
3. Set main file: `streamlit_1_generator.py` (or `_2`, `_3`)
4. Go to App Settings → Secrets, paste:

```toml
SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
```

### 4. Connect Everything
Add the Streamlit Cloud URLs to your React `.env`:
```
VITE_STREAMLIT_1_URL=https://your-name-streamlit1.streamlit.app
VITE_STREAMLIT_2_URL=https://your-name-streamlit2.streamlit.app
VITE_STREAMLIT_3_URL=https://your-name-streamlit3.streamlit.app
```

---

## Data Flow Details

### Real-time Monitoring
1. **Streamlit 1** runs continuously → inserts rows into `sensor_readings` every N seconds
2. React app has a **Supabase realtime subscription** on `sensor_readings`
3. New rows immediately push to the web via WebSocket
4. Gauges, charts, and alarm log update in real-time

### ML Predictions
1. **Streamlit 2** polls `sensor_readings` every 10 seconds
2. Runs anomaly detection (Isolation Forest) + health scoring + fault classification + RUL estimation
3. Inserts results into `ml_predictions`
4. React app subscribes to `ml_predictions` → live health score, RUL, recommendations

### Simulation
1. User sets parameters in React web UI (speed, load, ambient temp, fault injection, etc.)
2. Web writes control params to `simulation_data` **row 1** (row_type='control', id=1)
3. **Streamlit 3** polls row 1 → reads controls → runs physics simulation → inserts data rows (row_type='data')
4. React app subscribes to new 'data' rows → displays live simulation readings with gauges and trends

---

## ML Models

| Model | Purpose |
|-------|---------|
| Isolation Forest (statistical proxy) | Anomaly detection |
| Rule-based scoring | Health score 0-100 |
| Statistical pattern matching | Fault classification |
| Trend-based linear regression | RUL estimation |

**Fault Detection Rules:**
- **Fouled Injector**: Inter-cylinder exhaust temp deviation >30°C
- **LO Degradation**: High LO temp + low LO pressure combination
- **Cooling Issue**: HT CW outlet temp >87°C
- **TC Fouling**: Charge air pressure <92% of expected at given load
- **Bearing Wear**: Main bearing temp >80°C

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (PostgreSQL + Realtime) |
| Backend (Data) | Streamlit 1 — Python |
| Backend (ML) | Streamlit 2 — Python + NumPy |
| Backend (Sim) | Streamlit 3 — Python + NumPy |

---

## Source
Engine specifications from: MAN Energy Solutions, *L23/30H GenSet TierII Project Guide*, 2024-09-19.

# Connected Vehicle Intelligence Platform

An end-to-end vehicle telemetry platform that combines data engineering, machine learning, and retrieval-augmented generation (RAG) to support fleet monitoring and AI-assisted vehicle diagnostics.

## Introduction

Connected vehicles continuously generate operational data through onboard sensors and diagnostic interfaces. Signals such as engine speed, vehicle velocity, coolant temperature, intake pressure, and throttle position can reveal how a vehicle behaves under different driving conditions. However, turning raw telemetry into useful fleet-level insight requires a reliable pipeline for collecting, validating, storing, analyzing, and interpreting these measurements.

The **Connected Vehicle Intelligence Platform** explores this challenge through an integrated data and AI architecture. It ingests real-world OBD-II telemetry recordings, streams individual measurements through Apache Kafka, processes and persists them in PostgreSQL, and applies machine-learning-based anomaly detection to identify unusual sensor behavior. A FastAPI backend exposes vehicle, telemetry, health, and anomaly information to a React dashboard. In addition, a retrieval-augmented diagnostic assistant combines technical documentation with vehicle context and a locally served language model to provide grounded explanations.

The project brings together several engineering concerns in one application:

- **Data Engineering:** CSV ingestion, event streaming, ETL validation, transformation, and batch persistence.
- **Machine Learning:** unsupervised anomaly detection with Isolation Forest and batch scoring.
- **Backend Engineering:** REST APIs, database repositories, and service integration.
- **Applied AI:** semantic retrieval over automotive diagnostic documentation and LLM-based responses.
- **Frontend Engineering:** fleet analytics, vehicle-level views, and a conversational diagnostic interface.

The repository is an evolving engineering project. The sections below describe the components currently present in the codebase and distinguish them from possible future extensions.

## Architecture

The platform is organized around a telemetry pipeline, a separate model-scoring workflow, API services, and an AI-assisted diagnostic workflow.

```mermaid
flowchart LR
    subgraph SOURCE["Telemetry Source"]
        CSV["OBD-II CSV recordings"]
        READER["CSV Reader"]
        PARSER["Parser & metadata extraction"]
        CSV --> READER --> PARSER
    end

    subgraph STREAM["Streaming & ETL"]
        PRODUCER["Kafka Producer"]
        KAFKA[("Apache Kafka")]
        CONSUMER["Kafka Consumer"]
        CLEAN["Clean · Validate · Transform"]
        PRODUCER --> KAFKA --> CONSUMER --> CLEAN
    end

    subgraph STORE["Operational Storage"]
        PG[("PostgreSQL")]
        CLEAN --> PG
    end

    subgraph ML["Anomaly Detection"]
        TRAIN["Isolation Forest training"]
        MODEL["Serialized model"]
        SCORE["Batch inference & scoring"]
        PG --> TRAIN --> MODEL
        MODEL --> SCORE
        PG <--> SCORE
    end

    subgraph API["Application Backend"]
        FASTAPI["FastAPI"]
        VEHICLE["Vehicle & telemetry endpoints"]
        ANALYTICS["Fleet health & anomaly analytics"]
        AIPIPE["Diagnostic RAG pipeline"]
        FASTAPI --> VEHICLE
        FASTAPI --> ANALYTICS
        FASTAPI --> AIPIPE
    end

    subgraph RAG["Knowledge Retrieval"]
        DOCS["Automotive diagnostic documents"]
        CHROMA[("ChromaDB")]
        RETRIEVE["Semantic retrieval"]
        PROMPT["Diagnostic prompt"]
        LLM["Ollama · Llama 3.2"]
        DOCS --> CHROMA
        CHROMA --> RETRIEVE --> PROMPT --> LLM
    end

    subgraph UI["Frontend"]
        REACT["React + TypeScript"]
        DASH["Fleet dashboard"]
        DETAILS["Vehicle analytics"]
        CHAT["AI diagnostic assistant"]
        REACT --> DASH
        REACT --> DETAILS
        REACT --> CHAT
    end

    PG --> VEHICLE
    PG --> ANALYTICS
    AIPIPE --> RETRIEVE
    AIPIPE --> PROMPT
    LLM --> AIPIPE
    VEHICLE --> REACT
    ANALYTICS --> REACT
    AIPIPE --> REACT
```

### Data flow

1. CSV recordings are discovered and parsed; filename metadata is used to enrich telemetry records.
2. The Kafka producer publishes individual telemetry records to the `vehicle-telemetry` topic.
3. The ETL consumer reads Kafka messages, cleans values, validates required fields and plausible sensor ranges, transforms records, and inserts them into PostgreSQL in batches.
4. The anomaly-detection workflow trains an Isolation Forest model from stored telemetry and saves the model artifact. A separate batch-scoring job writes anomaly scores, anomaly flags, and model version information back to PostgreSQL.
5. FastAPI exposes vehicle, telemetry, statistics, health-score, and anomaly endpoints to the frontend.
6. For diagnostic questions, the RAG pipeline retrieves relevant documentation from ChromaDB, adds available vehicle context and recent conversation history, and sends the resulting prompt to Ollama.

## Dataset & Data Sources

### Primary dataset: Automotive OBD-II Dataset (KIT)

The project currently uses the **Automotive OBD-II Dataset** published by the Karlsruhe Institute of Technology (KIT).

- **Original source:** [KITopen – Automotive OBD-II Dataset](https://publikationen.bibliothek.kit.edu/1000085073)
- **DOI:** [10.5445/IR/1000085073](https://doi.org/10.5445/IR/1000085073)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0), as specified by the dataset record.
- **Collection period:** 5 July 2017 – 23 April 2018.
- **Format:** CSV recordings collected through an OBD-II interface.
- **Vehicle represented in the repository recordings:** SEAT Leon.

The repository currently contains **81 CSV recording files** under `data/raw/`. Their filenames encode the recording date, vehicle make and model, route, and driving condition. The recordings include normal traffic, free-flow traffic (`Frei`), traffic jams (`Stau`), and a measurement-error-labelled recording (`Messfehler`).

The source dataset documents ten OBD-II signals:

| Signal | Description |
|---|---|
| Engine coolant temperature | Coolant temperature |
| Intake manifold pressure | Absolute intake manifold pressure |
| Engine RPM | Engine rotational speed |
| Vehicle speed | Vehicle speed sensor reading |
| Intake air temperature | Intake air temperature |
| Air flow rate | Mass air flow measurement |
| Throttle position | Absolute throttle position |
| Ambient air temperature | Outside air temperature |
| Accelerator pedal position D | Accelerator pedal sensor D |
| Accelerator pedal position E | Accelerator pedal sensor E |

These measurements provide a foundation for time-series exploration, vehicle behavior analysis, sensor-level anomaly detection, and fleet health monitoring. The repository's ingestion parser maps the source fields into the platform's normalized telemetry schema.

**Data attribution:** The original dataset is provided by Marc Weber / Karlsruhe Institute of Technology. Please retain the original attribution and license when redistributing or adapting the data.

### Additional public datasets for future extensions

The following resources are relevant to possible extensions. They are **not represented as integrated into the current pipeline**.

| Dataset | What it provides | Potential use |
|---|---|---|
| [LEVIN Open Data](https://github.com/YunSolutions/levin-openData) | Real-world OBD data collected from approximately 30 vehicles, alongside accelerometer and GPS-related signals. | Broader vehicle coverage and multi-sensor analysis. |
| [In-vehicle Sensing Datasets – Florida Atlantic University](https://zenodo.org/records/10044775) | GPS, IMU, and OBD recordings across 497 trajectories and more than 2,400 km. | Sensor fusion, trajectory analysis, and driving-context features. |
| [UDOT & Panasonic Connected Vehicle BSM Data](https://catalog.data.gov/dataset/bsm-from-udot-and-panasonic-connected-vehicle-data-ecosystem-program) | Basic Safety Messages from a connected-vehicle deployment in Utah. | Future V2X and connected-infrastructure experiments. |
| [MetroPT Predictive Maintenance Dataset](https://zenodo.org/records/6854240) | Large-scale pressure, temperature, current, control-signal, and GPS data from an urban metro system. | Transfer experiments for time-series anomaly detection and predictive maintenance; note that it is rail-system data, not passenger-car OBD data. |

## Core Capabilities

### 1. Telemetry ingestion and streaming

- Discovers CSV recordings from `data/raw/`.
- Extracts recording metadata from filenames.
- Normalizes sensor names and timestamps.
- Publishes telemetry events to Apache Kafka.
- Supports configurable Kafka bootstrap servers and topic names.

### 2. ETL and persistence

The Kafka consumer implements a batch-oriented ETL workflow:

- **Cleaning:** trims strings and converts missing or NaN values into database-compatible nulls.
- **Validation:** checks required fields and basic plausible ranges for selected sensor measurements.
- **Transformation:** prepares normalized records for the telemetry database model.
- **Loading:** creates or reuses vehicle records and bulk-inserts telemetry into PostgreSQL.

The consumer uses a batch size of 500 records.

### 3. Machine-learning anomaly detection

The anomaly-detection module uses **Isolation Forest**, an unsupervised learning algorithm, to identify unusual combinations of vehicle sensor measurements.

The current training configuration uses:

- Five input features: coolant temperature, engine RPM, vehicle speed, intake manifold pressure, and throttle position.
- 200 estimators.
- A configured contamination parameter of 0.02.
- A fixed random seed for reproducibility.
- A serialized model artifact stored under `backend/ml/anomaly/artifacts/`.

The batch inference workflow scores telemetry records and stores the anomaly score, anomaly flag, and model version in PostgreSQL. The vehicle health score is then derived from anomaly frequency and anomaly severity.

> The Isolation Forest output is an anomaly indicator, not a confirmed mechanical fault diagnosis. Its results should be interpreted as signals for further investigation.

### 4. Fleet analytics and REST API

The FastAPI backend provides endpoints for:

- Listing vehicles and retrieving vehicle details.
- Retrieving vehicle telemetry with pagination and optional date filtering.
- Computing vehicle-level telemetry statistics.
- Retrieving health scores and health trends.
- Exploring detected anomalies and likely contributing sensor deviations.
- Asking diagnostic questions with optional vehicle context.
- Receiving streamed diagnostic responses.

### 5. RAG-based diagnostic assistant

The diagnostic assistant uses a retrieval-augmented generation workflow:

1. Receives a question from the frontend.
2. Retrieves the three most relevant document chunks from the ChromaDB collection.
3. Adds available vehicle context, including health score and anomaly information.
4. Includes recent conversation history when provided.
5. Sends the assembled prompt to the local Ollama model (`llama3.2`).
6. Returns the answer with source references; a streaming endpoint is also available.

The vector store is configured to use Sentence Transformers with `all-MiniLM-L6-v2` embeddings and persistent ChromaDB storage.

The repository includes automotive diagnostic knowledge files in `data/manuals/`, covering coolant temperature, engine RPM, OBD-II diagnostic codes, FAQs, and fleet insights.

### 6. Web dashboard

The frontend is built with React and TypeScript. It provides fleet and vehicle data views, analytics visualizations, and an AI diagnostic chat interface. Recharts is used for data visualization, while Axios handles API communication.

## Technology Stack

| Area | Technologies |
|---|---|
| Programming | Python, TypeScript |
| Data processing | Pandas, NumPy |
| Streaming | Apache Kafka, kafka-python |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| Machine Learning | scikit-learn, Isolation Forest, Joblib |
| Vector database | ChromaDB |
| Embeddings | Sentence Transformers |
| LLM inference | Ollama, Llama 3.2 |
| Frontend | React 19, Vite, React Router |
| Visualization | Recharts |
| Migrations | Alembic |
| Local infrastructure | Docker Compose |

## Repository Structure

```text
connected-vehicle-intelligence-platform/
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   └── schemas/
│   ├── config/
│   ├── database/
│   │   ├── models/
│   │   └── repositories/
│   ├── etl/
│   │   ├── cleaner.py
│   │   ├── consumer.py
│   │   ├── transformer.py
│   │   └── validator.py
│   ├── ingestion/
│   │   ├── parser.py
│   │   ├── producer.py
│   │   └── reader.py
│   ├── llm/
│   ├── ml/
│   │   └── anomaly/
│   │       ├── train.py
│   │       ├── inference.py
│   │       └── batch_score.py
│   ├── rag/
│   ├── scripts/
│   ├── main.py
│   └── requirements.txt
├── data/
│   ├── manuals/
│   └── raw/
├── docker/
│   └── docker-compose.kafka.yml
├── frontend/
│   └── src/
├── alembic.ini
├── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11 or later
- Node.js and npm
- PostgreSQL
- Docker Desktop or Docker Engine with Docker Compose
- Ollama (for the diagnostic assistant)

### 1. Clone the repository

```bash
git clone https://github.com/saragh66/connected-vehicle-intelligence-platform.git
cd connected-vehicle-intelligence-platform
```

### 2. Configure the backend

Create a `.env` file in the project root. The backend settings currently require a database connection string and support Kafka configuration.

Example:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/connected_vehicles
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_TELEMETRY=vehicle-telemetry
API_PREFIX=/api/v1
```

Create the PostgreSQL database named `connected_vehicles` before starting the application. Use your own local credentials; do not commit secrets.

### 3. Start Kafka

The repository provides a Docker Compose file for Kafka, ZooKeeper, and Kafka UI:

```bash
docker compose -f docker/docker-compose.kafka.yml up -d
```

Kafka UI is exposed on [http://localhost:8090](http://localhost:8090).

### 4. Install Python dependencies

```bash
python -m venv .venv
```

Activate the environment:

**Windows**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux / macOS**
```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

### 5. Initialize the database

```bash
python -m backend.scripts.create_tables
```

### 6. Start the API

From the repository root:

```bash
uvicorn backend.main:app --reload
```

- API base path: `http://localhost:8000/api/v1`
- Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 7. Run the telemetry pipeline

Open separate terminals from the repository root.

**Publish CSV records to Kafka:**

```bash
python -m backend.ingestion.producer
```

**Consume, validate, transform, and load Kafka records into PostgreSQL:**

```bash
python -m backend.etl.consumer
```

### 8. Train and run anomaly scoring

After telemetry has been loaded into PostgreSQL:

```bash
python -m backend.ml.anomaly.train
python -m backend.ml.anomaly.batch_score
```

The training step creates the Isolation Forest model artifact. The batch-scoring step applies the saved model to stored telemetry and updates anomaly-related fields.

### 9. Start the diagnostic language model

Install [Ollama](https://ollama.com/) and download the model:

```bash
ollama pull llama3.2
```

Ensure the Ollama service is running before using the AI diagnostic endpoints.

### 10. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Use the local URL printed by Vite to open the dashboard.

## API Reference

The API prefix is configured as `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/vehicles/` | List vehicles |
| GET | `/vehicles/with-health` | List vehicles with health information |
| GET | `/vehicles/{vehicle_id}` | Retrieve vehicle details |
| GET | `/vehicles/{vehicle_id}/telemetry` | Retrieve paginated telemetry |
| GET | `/vehicles/{vehicle_id}/stats` | Retrieve telemetry statistics |
| GET | `/vehicles/{vehicle_id}/health-score` | Retrieve vehicle health score |
| GET | `/vehicles/{vehicle_id}/anomalies` | Retrieve detected anomalies |
| GET | `/vehicles/{vehicle_id}/anomaly-causes` | Retrieve likely sensor contributors |
| GET | `/vehicles/{vehicle_id}/health-trend` | Retrieve health trend data |
| GET | `/vehicles/fleet/anomaly-types` | Aggregate anomaly types across the fleet |
| POST | `/ai/ask` | Submit a diagnostic question |
| POST | `/ai/ask/stream` | Receive a streamed diagnostic answer |

For request and response schemas, use the interactive Swagger documentation at `/docs`.

## Roadmap

- [ ] Add automated tests for ingestion, ETL, API, and anomaly-scoring workflows.
- [ ] Evaluate anomaly detection with domain-informed validation and documented metrics.
- [ ] Improve model monitoring, versioning, and reproducibility.
- [ ] Extend the streaming workflow with continuous scoring and operational observability.
- [ ] Expand the dataset with complementary vehicle and V2X sources.
- [ ] Improve RAG evaluation, document ingestion, and retrieval quality.
- [ ] Add a complete deployment configuration for the application services.

## Author

**Sara El Ghayati**  
Artificial Intelligence & Data Engineering

- GitHub: [@saragh66](https://github.com/saragh66)

---

*An engineering project at the intersection of Data Engineering, Machine Learning, and AI-powered automotive diagnostics.*

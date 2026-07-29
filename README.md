# ⚡ DataFlow (Qyntro)

> **Visual ETL & AI-Powered Data Pipeline Engineering Platform**  
> An intuitive, web-based node graph editor for visually designing, validating, executing, profiling, and generating data transformation pipelines in real-time.  
> 📖 *For complete technical architecture & specification details, see [approach.txt](approach.txt).*
---

## 📌 Overview

**DataFlow** (also known as **Qyntro**) is an end-to-end visual data engineering workbench. Built with a modern React frontend and a FastAPI backend engine, DataFlow enables users to visually construct, execute, and export complex data processing workflows via interactive drag-and-drop node graphs or natural language prompts.

Data processes, transformations, joins, and aggregations can be executed by the high-performance Python FastAPI engine using Pandas vectorization, or seamlessly fall back to an in-browser JavaScript execution engine for zero-latency client-side processing.

---

## ✨ Key Features

- **✨ AI-Powered Pipeline Designer**: Describe your workflow in natural language (e.g., *"Filter sales where revenue > 200, group by region, and build a bar chart"*), and Groq LLM (`llama-3.3-70b-versatile`) will generate and connect the node graph on your canvas automatically.
- **🎨 Visual Node Graph Canvas**: Drag-and-drop pipeline designer built with ReactFlow, featuring real-time node connections, edge styling, animated graph execution states, and cycle detection (`is_dag`).
- **⚡ Dual Execution Engine**: High-speed Python Pandas execution server for vectorized data operations, with an instant in-browser JavaScript engine fallback.
- **💻 Python & SQL Code Export**: Convert visual pipelines into executable Python (Pandas/Polars) code or standard SQL queries ready for production scripts.
- **📊 Interactive Visualizations & Dashboard**: Built-in charting engine (Recharts / Plotly.js) with a slide-out Dashboard drawer for rendered graphs (Bar, Line, Scatter, Pie).
- **📈 Automated Data Profiling**: Statistical summaries, column data type inspection, missing value ratios, and sample distribution histograms.
- **🚀 Virtualized Data Table**: High-performance tabular data grid powered by `@tanstack/react-virtual` capable of handling large datasets smoothly.
- **📚 Template Gallery**: Pre-built pipeline recipes (Quick Preview, Clean & Export, Data Profiling, etc.) for instant initialization.
- **💾 Import / Export & Persistence**: Auto-saves pipelines locally in `localStorage`, imports/exports pipeline JSON definitions, and exports processed data into CSV, JSON, or JSONL formats.
- **🚀 Vercel Serverless Ready**: Native Vercel integration via `api/index.py` and `vercel.json` to deploy both frontend and serverless Python backend in one click.

---

## 🛠️ Architecture & Tech Stack

### **AI Layer**
* **LLM Engine**: Groq REST API (`https://api.groq.com/openai/v1/chat/completions`)
* **Model**: `llama-3.3-70b-versatile` with structured JSON schema output
* **Fallback**: Rule-based smart pipeline generator for offline or key-less usage

### **Frontend (`/frontend`)**
* **Framework**: React 19 + Vite 8
* **Node Graph Engine**: ReactFlow (`reactflow`)
* **State Management**: Zustand
* **Styling**: Tailwind CSS v4 + Custom CSS Design System
* **Data Parsing**: PapaParse (CSV)
* **Visualizations**: Plotly.js & Recharts
* **Export Bundler**: JSZip + HTML2Canvas (Programmatic PNG chart rendering + ZIP packaging)
* **Table Virtualization**: `@tanstack/react-virtual`
* **Linter**: Oxlint

### **Backend (`/backend` & `/api`)**
* **Framework**: Python 3.11 + FastAPI
* **Data Processing**: Pandas vectorization engine
* **Validation**: Pydantic v2
* **Server**: Uvicorn / Vercel Serverless ASGI
* **Algorithms**: DFS node coloring for Directed Acyclic Graph (DAG) cycle detection

---

## 📁 Repository Structure

```text
DataFlow/
├── api/                      # Vercel Serverless Function Entrypoint
│   └── index.py              # ASGI wrapper for Vercel Python runtime
│
├── backend/                  # FastAPI Python Service & Execution Engine
│   ├── ai_generator.py       # Groq AI LLM Pipeline Designer & Fallback Engine
│   ├── executor.py           # Pandas vectorized pipeline execution driver
│   ├── data_ops.py           # Data transformation & profiling functions
│   ├── main.py               # FastAPI application & endpoints
│   ├── Dockerfile            # Container definition for Docker/Render/Railway
│   ├── Procfile              # Heroku/Render process configuration
│   └── requirements.txt      # Python dependencies (FastAPI, Pandas, httpx, Uvicorn)
│
├── frontend/                 # React Frontend Application
│   ├── src/
│   │   ├── components/       # Data table, charts, profiler, dashboards, code export modals
│   │   ├── execution/        # Pipeline runner button & status handlers
│   │   ├── nodes/            # Node definitions (Load, Clean, Transform, Combine, Chart, etc.)
│   │   ├── panels/           # Node Palette, Inspector, Template Gallery, AIChatDrawer
│   │   ├── App.jsx           # Root layout
│   │   ├── store.js          # Zustand global state store
│   │   └── pipelineTemplates.js # Pre-configured pipeline recipes
│   ├── package.json          # Frontend dependencies & npm scripts
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind styling rules
│
├── sample-data/              # Example datasets for testing
│   ├── employees.csv         # Employee records dataset
│   └── sales_orders.csv      # Sales orders dataset
│
└── vercel.json               # Full-stack Vercel deployment configuration
```

---

## 📦 Node Catalog & Capabilities

DataFlow provides a rich library of nodes categorized by function:

| Category | Available Nodes & Description |
| :--- | :--- |
| **📥 Input / Output** | **Load** (CSV/JSON/Sample data), **Preview** (Table preview), **Export** (CSV/JSON/JSONL download). |
| **🧹 Data Cleaning** | **Drop Nulls** (Remove missing values), **Deduplicate** (Drop duplicate rows), **Fill Missing** (Impute values), **String Clean** (Trim/Case/Strip), **Scale & Normalize** (Min-Max, Z-Score, Log). |
| **🔄 Transformation** | **Column Filter** (Select/Drop columns), **Rename Column**, **Type Converter** (Cast types), **Calculated Field** (Custom math expressions), **Value Mapper**. |
| **🔀 Combine & Reshape** | **Merge / Join** (Inner, Left, Right, Outer joins), **Concatenate** (Row stacking), **Pivot** (Reshape matrix). |
| **📊 Aggregation & Profile** | **Group By & Aggregate** (Sum, Avg, Count, Min, Max), **Data Profiler** (Column stats & null distribution). |
| **📈 Visualizations** | **Chart Renderer** (Configurable Bar, Line, Scatter, Pie, Area, Histogram charts). |
| **📝 Annotations** | **Sticky Note / Comment** (Canvas documentation notes). |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
* **Node.js**: v18.0.0 or higher
* **Python**: v3.9 or higher
* **npm**: v9.0.0 or higher

---

### 1️⃣ Local Backend Setup

Navigate to the `backend` directory and set up your virtual environment:

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your Groq API Key
# Windows PowerShell: $env:GROQ_API_KEY="gsk_..."
# Linux/macOS: export GROQ_API_KEY="gsk_..."

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend server runs on **`http://localhost:8000`**.  
Interactive API Docs (Swagger UI) are available at **`http://localhost:8000/docs`**.

---

### 2️⃣ Local Frontend Setup

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔌 API Reference

### Health Check
- **`GET /`**  
  *Response:* `{"app": "DataFlow Python Engine", "status": "ok", "engine": "Pandas + FastAPI + Groq AI"}`

### Pipeline Execution
- **`POST /pipelines/execute`**  
  Executes the full pipeline via Pandas vectorized engine and returns per-node results.

### Pipeline Topology & DAG Validation
- **`POST /pipelines/parse`**  
  Validates graph topology and checks whether the network is a Directed Acyclic Graph (DAG).

### AI Pipeline Generation
- **`POST /ai/generate-pipeline`**  
  Generates a node DAG structure from a natural language prompt using Groq `llama-3.3-70b-versatile`.

  **Request Body:**
  ```json
  {
    "prompt": "Filter sales orders with revenue > 200, group by region, and build a bar chart",
    "apiKey": "gsk_..."
  }
  ```

---

## 🌐 Deploying DataFlow

### Option 1: Vercel (All-in-One Deployment)
1. Push repository to GitHub.
2. Import repository into [Vercel](https://vercel.com).
3. Set environment variable `GROQ_API_KEY` = `gsk_...`.
4. Click **Deploy**. Vercel will host both the frontend and Python serverless API automatically.

### Option 2: Render.com (Backend) + Vercel (Frontend)
- Deploy `backend/` on Render as a Python Web Service (`uvicorn main:app --host 0.0.0.0 --port $PORT`).
- Deploy `frontend/` on Vercel setting `VITE_API_URL` to your Render backend URL.

---

## 📄 License

This project is open source under the MIT License.

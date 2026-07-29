# ⚡ DataFlow (Qyntro)

> **Visual ETL & Data Pipeline Engineering Platform**  
> An intuitive, web-based node graph editor for building, validating, profiling, and executing data transformation pipelines in real-time.

---

## 📌 Overview

**DataFlow** (also known as **Qyntro**) is an end-to-end visual data engineering workbench. Built with a modern React frontend and a FastAPI microservice backend, DataFlow enables users to visually construct data processing workflows via interactive drag-and-drop node graphs.

Data processes, transformations, joins, and aggregations are executed by the high-performance Python FastAPI engine using Pandas vectorization for ultra-low latency (<20ms execution times), alongside DAG topology validation and cycle detection. An in-browser JS execution fallback is also supported.

---

## ✨ Key Features

- **🎨 Visual Node Graph Editor**: Drag-and-drop pipeline designer built with ReactFlow, featuring real-time node connections, edge styling, and custom layout controls.
- **⚡ In-Browser Execution Engine**: Immediate client-side processing of CSV and JSON data — perform filtering, joining, aggregations, transformations, and string manipulations without server round-trips.
- **🔍 Backend Topology & DAG Validation**: Python FastAPI endpoint checking pipeline structures, returning graph counts and calculating Directed Acyclic Graph (`is_dag`) compliance using DFS cycle detection algorithms.
- **📊 Interactive Visualizations & Dashboard**: Built-in charting engine (Recharts / Plotly.js) with a slide-out Dashboard drawer for rendered graphs (Bar, Line, Scatter, Pie).
- **🚀 Virtualized Data Table**: High-performance tabular data grid powered by `@tanstack/react-virtual` capable of handling large datasets smoothly.
- **📈 Automated Data Profiling**: Statistical summaries, column data type inspection, missing value ratios, and sample distributions.
- **📚 Template Gallery**: Pre-built pipeline recipes (Quick Preview, Clean & Export, Data Profiling, etc.) for instant initialization.
- **💾 Import / Export & Persistence**: Auto-saves pipelines locally in `localStorage`, imports/exports pipeline JSON definitions, and exports processed data into CSV, JSON, or JSONL formats.
- **🌗 Theme Toggle**: Dark mode and light mode interface options with sleek custom styling.

---

## 🛠️ Architecture & Tech Stack

### **Frontend (`/frontend`)**
* **Framework**: React 19 + Vite 8
* **Node Graph Engine**: ReactFlow (`reactflow`)
* **State Management**: Zustand
* **Styling**: Tailwind CSS v4 + Custom CSS Design System
* **Data Parsing**: PapaParse (CSV)
* **Visualizations**: Plotly.js & Recharts
* **Table Virtualization**: `@tanstack/react-virtual`
* **Linter**: Oxlint

### **Backend (`/backend`)**
* **Framework**: Python 3 + FastAPI
* **Validation**: Pydantic v2
* **Server**: Uvicorn
* **Algorithms**: Graph traversal (DFS node coloring) for DAG verification

---

## 📁 Repository Structure

```text
DataFlow/
├── backend/                  # FastAPI Python Service
│   ├── main.py               # API endpoints & DAG graph validation logic
│   └── requirements.txt      # Python dependencies (FastAPI, Uvicorn, Pydantic)
│
├── frontend/                 # React Frontend Application
│   ├── src/
│   │   ├── components/       # Data table, charts, profiler, dashboards, modals
│   │   ├── execution/        # Pipeline runner button & status handlers
│   │   ├── nodes/            # Node definitions (I/O, Clean, Transform, Combine, etc.)
│   │   ├── panels/           # Node Palette, Inspector, Template Gallery
│   │   ├── App.jsx           # Root application layout
│   │   ├── store.js          # Zustand global state store
│   │   └── pipelineTemplates.js # Pre-configured pipeline recipes
│   ├── package.json          # Frontend dependencies & npm scripts
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind styling rules
│
└── sample-data/              # Example datasets for testing
    ├── employees.csv         # Employee records dataset
    └── sales_orders.csv      # Sales orders dataset
```

---

## 📦 Node Catalog & Capabilities

DataFlow provides a rich library of nodes categorized by function:

| Category | Available Nodes & Description |
| :--- | :--- |
| **📥 Input / Output** | **Load** (CSV/JSON/Sample data), **Preview** (Table preview), **Export** (CSV/JSON/JSONL download). |
| **🧹 Data Cleaning** | **Drop Nulls** (Remove missing values), **Deduplicate** (Drop duplicate rows), **Fill Missing** (Impute values), **String Clean** (Trim/Case/Strip). |
| **🔄 Transformation** | **Column Filter** (Select/Drop columns), **Rename Column**, **Type Converter** (Cast types), **Calculated Field** (Custom expressions), **Value Mapper**. |
| **🔀 Combine & Reshape** | **Merge / Join** (Inner, Left, Right, Outer joins), **Concatenate** (Row stacking), **Pivot** (Reshape matrix). |
| **📊 Aggregation & Profile** | **Group By & Aggregate** (Sum, Avg, Count, Min, Max), **Data Profiler** (Column stats & null distribution). |
| **📈 Visualizations** | **Chart Renderer** (Configurable Bar, Line, Scatter, and Pie charts). |
| **📝 Annotations** | **Sticky Note / Comment** (Canvas documentation notes). |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or higher
* **Python**: v3.9 or higher
* **npm**: v9.0.0 or higher

---

### 1️⃣ Setting Up the Backend

Navigate to the `backend` directory and set up a virtual environment:

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

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend server will run on **`http://localhost:8000`**.  
Interactive API Documentation (Swagger UI) is accessible at **`http://localhost:8000/docs`**.

---

### 2️⃣ Setting Up the Frontend

In a new terminal window, navigate to the `frontend` directory:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`** (or the URL displayed in your terminal).

---

## 🔌 API Reference

### Health Check
- **`GET /`**  
  *Response:* `{"app": "DataFlow", "status": "ok"}`

### Pipeline Validation
- **`POST /pipelines/parse`**  
  Validates graph topology and checks whether the network is a Directed Acyclic Graph (DAG).
  
  **Request Body:**
  ```json
  {
    "nodes": [
      { "id": "node-1" },
      { "id": "node-2" }
    ],
    "edges": [
      { "id": "e1-2", "source": "node-1", "target": "node-2" }
    ]
  }
  ```

  **Response:**
  ```json
  {
    "num_nodes": 2,
    "num_edges": 1,
    "is_dag": true
  }
  ```

---

## 🧪 Testing with Sample Data

The `sample-data/` folder contains ready-to-use CSV files to test pipeline functionality:
- **`employees.csv`**: Contains employee information (IDs, names, departments, salaries, hire dates).
- **`sales_orders.csv`**: Contains sales transaction data (Order IDs, customer names, product categories, quantities, unit prices).

**To use them:**
1. Drag a **Load Data** node onto the canvas.
2. Select **Sample Data** in the node options and pick either `employees.csv` or `sales_orders.csv`.
3. Connect downstream nodes such as **Data Profiler**, **Group By**, or **Chart Renderer** to explore and analyze the data!

---

## 📜 Available Scripts (Frontend)

Inside the `frontend` directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR. |
| `npm run build` | Builds the production-ready bundle. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs `oxlint` to check for code quality and lint issues. |

---

## 📄 License

This project is open source under the MIT License.

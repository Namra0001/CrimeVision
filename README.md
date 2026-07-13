# CrimeVision 🚓 🔍

CrimeVision is an advanced, AI-powered predictive policing and analytics platform designed specifically for the Karnataka State Police. It empowers law enforcement with real-time geospatial intelligence, predictive risk modeling, and a highly secure natural language AI assistant capable of processing both English and Kannada inputs.

## 🌟 Key Features

*   **Geospatial Crime Mapping**: Visualize FIRs, criminal activities, and incident hotspots on an interactive state-wide map.
*   **Predictive Risk Analysis (Hotspot Detection)**: Uses historical crime data to identify emerging high-risk zones and autonomously recommends actionable enforcement steps (e.g., Pink Patrols, CCTV deployment).
*   **Live Incident Feed**: Real-time ticker of incoming FIRs seamlessly integrated into the command dashboard.
*   **District & Station Drilldowns**: Compare clearance rates and resource allocations across all 31 districts and 27 police stations.
*   **Trend Alerts**: Automated anomaly detection flags sudden spikes in specific crime categories (like cyber fraud or burglary) so officers can respond proactively.
*   **Bilingual AI Assistant**: A locally-contextualized intelligence network. Ask complex questions like "What are the common trends in cybercrime?" in English or Kannada. The AI automatically translates Kannada queries to English for internal processing and responds back in Kannada.
*   **Custom Document Analysis**: Upload external CSV datasets directly to the AI Assistant for immediate context-aware analysis.

## 🛠️ Technology Stack

**Frontend:**
*   **React (Vite)**: Lightning-fast rendering and modular component structure.
*   **Tailwind CSS**: Utility-first styling for a beautiful, modern, dark-themed UI.
*   **Lucide React**: Crisp, modern iconography.
*   **Recharts**: Interactive data visualizations for crime trends and category distributions.

**Backend:**
*   **FastAPI**: High-performance Python framework for handling API requests.
*   **SQLAlchemy**: Robust ORM for complex database querying and data modeling.
*   **SQLite**: Lightweight relational database mapping to State, District, Unit, and Employee structures.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   Python (3.9 or higher)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    venv\Scripts\activate  # On Windows
    # source venv/bin/activate  # On macOS/Linux
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the FastAPI server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`

## 🔐 Security & Data Privacy

CrimeVision is designed for law enforcement grade security. All data operations are strictly read-only on the frontend dashboards to prevent accidental deletion. The AI Assistant operates on localized context to prevent sensitive state data leakage. 

## Project Deploy Link: http://crime-vision-six.vercel.app
## Project Video Link: https://www.youtube.com/watch?v=64YQuT57EY4

---
*© 2026 CrimeVision - IT Cell Headquarters, Surat.*

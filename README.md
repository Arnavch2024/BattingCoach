# Research RAG

**Research RAG** is a comprehensive, full-stack application designed to accelerate academic and technical research. By leveraging advanced Retrieval-Augmented Generation (RAG) pipelines, the tool allows users to upload research papers (PDFs) and instantly interact with them. 

Beyond standard document Q&A, Research RAG serves as an intelligent research assistant that can:
- **Analyze and Query:** Extract insights from uploaded papers using a highly accurate 3-stage RAG pipeline (Cosine FAISS + BM25 Fusion + CrossEncoder).
- **Visualize Architectures:** Automatically generate interactive, node-based diagrams to visualize complex system architectures or methodologies described in the papers.
- **Build Prototypes:** Instantly turn paper concepts into functional, sandboxed React UI prototypes with live previews.
- **Explore Ecosystems:** Seamlessly search external sources like ArXiv for related papers, GitHub for implementations, and HuggingFace for relevant datasets and models via integrated Model Context Protocol (MCP) tools.

This tool bridges the gap between reading a paper and actively understanding, visualizing, and implementing its concepts.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + ReactFlow |
| Backend | Python Flask |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | FAISS (cosine similarity) |
| Reranking | BM25 fusion + CrossEncoder |
| PDF parsing | PyMuPDF |
| Text splitting | LangChain RecursiveCharacterTextSplitter |
| ArXiv | REST API (free) |
| GitHub | Search API (60 req/hr free) |
| HuggingFace | Datasets/Models API (free) |

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # add your GROQ_API_KEY
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **Chat** — Upload a PDF, ask questions via RAG (retrieve → rerank → generate)
- **Search** — Search ArXiv, GitHub, HuggingFace Datasets/Models
- **Architecture** — Auto-generate interactive architecture diagrams from paper context
- **Prototype** — Generate React UI prototypes from paper descriptions with live preview

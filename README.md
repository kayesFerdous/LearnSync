
<!-- Improved top-level README designed for clarity and professionalism. -->

<div align="center">
<p align="center">
	<img src="frontend/public/logo.png" alt="LearnSync" width="120" />
	<h1 align="center">LearnSync</h1>
</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-blue.svg)](frontend)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-lightgrey.svg)](backend)
[![Languages](https://img.shields.io/badge/Tech-TS%20%7C%20Python-%23007ACC)](#)

</div>

LearnSync is a full-stack AI-powered learning and productivity platform combining a Next.js frontend with a FastAPI backend. It provides multi-turn AI chat, document workspaces, quiz generation, Google Calendar synchronization, routine extraction from images, and file-based knowledge retrieval.

### 🎯 Technical Reviewer Navigation
To audit the codebase structure and review the system's outputs, use the direct shortcuts below:
* **[🔎 End-to-End RAG Trace & Logs](#rag-trace)** — Step-by-step example tracing parsing, query expansion, metadata filters, and retrieval scoring.
* **[📸 Core Workspace Screenshots](#interface-showcase)** — Visual interfaces displaying active RAG chats and key user workspaces.
* **[📂 Complete 11+ Screen Gallery](#complete-gallery)** — Collapsed index containing quizzes, settings, editors, and administrative panels.
* **[🏗️ Full-Stack System Architecture Diagram](#system-architecture)** — High-level layout of user, worker, and storage layers.
* **[💻 Direct Code Links](#rag-code-links)** — Link directly to the Python implementation files (Ingestion, Scoping, and Retrieval).

---

## Quick links

- Source: `frontend/` and `backend/`
- Demo screenshots: `frontend/outputs/`
- Architecture diagram: `frontend/outputs/architecture_diagram1.svg`
- Docs & contributing: `CONTRIBUTING.md`

## Key features

- Streaming AI chat with conversation contexts and folders
- File uploads with background ingestion, chunking, and vector indexing
- Course workspace with mind maps and quiz generation
- Google Calendar integration and routine extraction from images
- Rich text editor (Tiptap) and translation utilities
- JWT cookie auth + Google OAuth, admin and user settings

---

<h2 id="rag-architecture">🧠 Retrieval-Augmented Generation (RAG) Architecture</h2>

LearnSync implements a custom **Retrieval-Augmented Generation (RAG)** pipeline designed to address core document retrieval limitations, such as layout preservation during parsing, chunk semantic context-loss, and multi-turn conversational query ambiguity.

Instead of treating text as a flat character string, the architecture integrates deep-learning document analysis with structured vector storage:

```mermaid
graph TD
    A[File Upload] -->|R2 Pre-signed Upload| B[(Cloudflare R2)]
    B -->|Async Event Task| C[Background Worker]
    C -->|IBM Docling Parser| D[Document Layout Converter]
    D -->|Hybrid Chunker| E[Structure-Aware Splitting]
    E -->|Breadcrumb Extraction| F[Context Prepender]
    F -->|Dense + Sparse Embeddings| G[(Qdrant Vector DB)]
    
    H[User Search Query] -->|Multi-Turn History Expansion| I[LLM Query Rewriter]
    I -->|Security & Access Controls| J[Qdrant Metadata Filter]
    J -->|Dense + Sparse Fusion Search| G
    G -->|Ollama Embeddings| K[Dense Match]
    G -->|FastEmbed BM25| L[Sparse Match]
    K & L -->|RRF Fusion / Scoring| M[Context Assembly]
    M -->|Prompt Context + Citations| N[LLM Inference]
```

<h3 id="rag-code-links">Core Technical Implementation</h3>

You can review the direct implementation patterns in the following files:

1. **Layout-Aware Document Ingestion (IBM Docling)** 
   * **Source File:** [ingestion.py (L76-104)](backend/src/rag/ingestion.py#L76-L104)
   * **Implementation:** Text-based parsers discard layout formatting and column flow. LearnSync utilizes **IBM's Docling** (`DocumentConverter`), employing deep-learning layout models to reconstruct the structural layout (e.g. multi-column alignment, lists, tables) of documents before chunking.
2. **Structure-Preserving Chunking**
   * **Source File:** [ingestion.py (L91-101)](backend/src/rag/ingestion.py#L91-L101)
   * **Implementation:** Leverages Docling's `HybridChunker` to respect native document boundaries (headers, lists, tables). This prevents splitting key items (like single table cells or list nodes) in half, grouping adjacent text nodes up to a 500-token threshold.
3. **Contextual Enrichment**
   * **Source File:** [ingestion.py (L12-73)](backend/src/rag/ingestion.py#L12-L73)
   * **Implementation:** Resolves mid-document context loss (the *"lost in chunking"* problem). During ingestion, it recursively extracts a chunk's hierarchical section breadcrumbs (e.g. `Syllabus > Chapter 3 > Grading Criteria`) and prepends this trail directly to the chunk's content before computing embeddings.
4. **Multi-Turn Query Rewriting & Expansion**
   * **Source File:** [rag_node.py (L12-38)](backend/src/agents/nodes/rag_node.py#L12-L38)
   * **Implementation:** Converts conversational shorthand (e.g. *"how is it graded?"*) into a standalone retrieval vector search query by prompting a dedicated LLM thread with the user query and the last three turns of conversation history.
5. **Metadata-Scoped Vector Filtering**
   * **Source File:** [rag_node.py (L47-74)](backend/src/agents/nodes/rag_node.py#L47-L74)
   * **Implementation:** Restricts vector queries at search time using Qdrant field conditions (`metadata.user_id` and selected `file_ids`, `folder_id`, or `conversation_id`) to ensure data isolation.
6. **Dense + Sparse Hybrid Search**
   * **Source File:** [store.py (L53-66)](backend/src/rag/store.py#L53-L66) & [retrieval.py (L7-23)](backend/src/rag/retrieval.py#L7-L23)
   * **Implementation:** Configures a Qdrant `HYBRID` vector store blending Dense Search (`OllamaEmbeddings` for conceptual semantics) and Sparse Search (`FastEmbedSparse` with BM25 for exact terms/IDs).

---

<h2 id="rag-trace">🔎 RAG Execution Trace (Inputs & Outputs)</h2>

This dry-run trace demonstrates how a complex document layout is ingested, scoped, retrieved, and synthesized into a response:

#### 1. Ingestion Phase (Document Parsing & Enrichment)
* **Uploaded File:** `LLM_Agents_Overview.pdf`
* **Raw Document Layout:**
  ```text
  1. Introduction to Agentic Workflows
     ...
     1.3 Evaluation & Performance
         Table 2: Planner latency comparison
         | Planner Model  | Latency (s) | Success Rate |
         | ReAct          | 1.2         | 78%          |
         | Plan-and-Solve | 3.8         | 92%          |
  ```
* **Resulting Ingested Chunk (`_convert_chunk_to_document`):**
  ```python
  # Metadata extracted
  metadata = {
      "source": "LLM_Agents_Overview.pdf",
      "page": 4,
      "section": "1. Introduction to Agentic Workflows > 1.3 Evaluation & Performance > Table 2",
      "type": "table",
      "user_id": "user_dev_99",
      "document_id": "doc_agent_01"
  }
  
  # Page content with prepended breadcrumbs (ensuring semantic contextual retrieval)
  page_content = """
  Context: 1. Introduction to Agentic Workflows > 1.3 Evaluation & Performance > Table 2
  Content: Table 2: Planner latency comparison. Planner Model | Latency (s) | Success Rate. ReAct | 1.2 | 78%. Plan-and-Solve | 3.8 | 92%.
  """
  ```

#### 2. Query Phase (Rewriting & Scoping)
* **Conversation History:**
  * **User:** *"I'm reading the agent overview PDF."*
  * **Assistant:** *"Great! How can I help you with that?"*
  * **User:** *"how fast is the plan and solve one compared to react?"*
* **LLM Query Expansion output (`rewrite_query`):**
  ```text
  "Plan-and-Solve versus ReAct planner model latency speed comparison success rate agentic workflows table"
  ```
* **Qdrant Search Conditions:**
  ```python
  # Hard constraint: limits search exclusively to the selected document
  filter_conditions = [
      FieldCondition(key="metadata.user_id", match=MatchValue(value="user_dev_99")),
      FieldCondition(key="metadata.document_id", match=MatchAny(any=["doc_agent_01"]))
  ]
  ```

#### 3. Retrieval & Synthesis Phase (Fusing & Answering)
* **Hybrid Search (Dense + Sparse Qdrant Fusion):**
  * *Dense Vector* matches the intent *"how fast"* / *"compared to"*.
  * *Sparse Vector* anchors the exact keys *"Plan-and-Solve"* and *"ReAct"*.
  * **Top-1 Match retrieved:** The exact Table 2 chunk above (RRF score: `0.957`).
* **Final LLM Response (`rag_node` output):**
  ```text
  Based on Table 2 in `LLM_Agents_Overview.pdf` (Page 4, Section: `1. Introduction to Agentic Workflows > 1.3 Evaluation & Performance`):

  - **Plan-and-Solve** has a latency of **3.8 seconds** with a **92% success rate**.
  - **ReAct** has a latency of **1.2 seconds** with a **78% success rate**.

  **Comparison:** Plan-and-Solve takes approximately **2.6 seconds longer** (about 3.1x the latency of ReAct), but delivers a **14% absolute increase** in success rate.
  ```

---

<h2 id="system-architecture">🏗️ System Architecture & Components</h2>

LearnSync is organized as a clear, decoupled full-stack system. The React frontend interacts with the FastAPI backend via cookie-authenticated REST APIs and Server-Sent Events (SSE) for AI streaming.

![Architecture diagram](frontend/outputs/architecture_diagram1.svg)

- **Frontend:** Next.js 15 App Router (`frontend/`) — React, TypeScript, TailwindCSS, Zustand state stores.
- **Backend:** FastAPI (`backend/`) — SQLAlchemy (asynchronous ORM), LangGraph (multi-agent orchestration), LangChain core integration.
- **Storage Layer:** PostgreSQL (relational user/app data), Qdrant (high-speed hybrid vector store), Cloudflare R2 (object storage for pre-signed file uploads).

---

<h2 id="interface-showcase">📸 User Interface Showcase</h2>

Here are the primary workspaces of LearnSync. Review the full design specs in `frontend/outputs/`:

### Main Dashboard & Workspace Hub
![Dashboard](frontend/outputs/dashboard.png)

### RAG-Powered AI Chat (Active Ingestion & Source Citations)
![Chat](frontend/outputs/conversation_with_llm.png)

<details id="complete-gallery">
<summary>📂 Click to expand the Complete Application Gallery (11+ additional screens)</summary>
<br>

A closer look at the premium, responsive UI elements implemented throughout LearnSync:

| Section | Screenshot |
| :--- | :--- |
| **Course Workspace** (Modules, AI Summaries & Files) | ![Course workspace](frontend/outputs/course.png) |
| **Interactive Mind Maps** (Document Structure Visualizer) | ![Mind map](frontend/outputs/mindmap.png) |
| **AI Quiz Configuration** (Difficulty & Scope Controls) | ![New quiz modal](frontend/outputs/new_quiz.png) |
| **Interactive Quiz Interface** (Timed Testing Playground) | ![Quiz view](frontend/outputs/quiz.png) |
| **Immediate Quiz Feedback** (Detailed Corrections & Explanations) | ![Quiz feedback](frontend/outputs/quiz_wrong.png) |
| **Google Calendar Hub** (Syncing Extracted Routines) | ![Calendar view](frontend/outputs/calendar.png) |
| **Class Schedule Extraction** (Asynchronous Weekly View) | ![Class schedule](frontend/outputs/class_schedule.png) |
| **Rich Text Editor** (Tiptap-Powered Editing & Translation Tools) | ![Editor](frontend/outputs/text_editor.png) |
| **Peer Chat Messenger** (Real-Time Messaging Workspace) | ![Chat (people)](frontend/outputs/chat_with_people.png) |
| **Administrative Diagnostic Panel** (User Tracking & Token Metrics) | ![Admin panel](frontend/outputs/admin_pannel.png) |
| **Profile Settings** (Credential Management) | ![Profile](frontend/outputs/profile.png) |
| **System Settings** (Visual Customization & Locale Limits) | ![Settings](frontend/outputs/settings.png) |

</details>

---

## 🛠️ Tech Stack & Ecosystem

- **Frontend:** Next.js (App Router), React, TypeScript, TailwindCSS, Zustand, TanStack Query.
- **Backend:** FastAPI, Python, SQLAlchemy (Async), LangGraph, LangChain, PyDantic.
- **AI Core:** Google Gemini 2.5 Flash, Groq, Ollama Embeddings, IBM Docling.
- **Infrastructure:** Microsoft Azure, Cloudflare R2, PostgreSQL, Qdrant Hybrid Cloud.

## Local setup (developer)

1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

2. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

3. Environment

Copy the example environment file and fill values:

```bash
cp backend/.env.example backend/.env
```

Minimum variables (see `backend/.env.example`):

- `DATABASE_URL`
- `JWT_SECRET`
- `R2_ACCESS_KEY` / `R2_SECRET_KEY` / `R2_BUCKET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `QDRANT_URL` / `QDRANT_API_KEY`


## API overview

Primary endpoints (same as before):

- `POST /auth/signup` - create an email/password account.
- `POST /auth/login` - sign in with email/password.
- `GET /auth/login/google` - start Google OAuth.
- `GET /auth/callback` - finish Google OAuth.
- `GET /me` - get the current user.
- `PATCH /me/settings` - update theme, timezone, or font.
- `POST /conversation` - start a new streaming chat.
- `POST /conversation/{conversation_id}` - continue a conversation.
- `GET /conversation` - list folders and conversations.
- `POST /uploads/presign` - create R2 upload URLs.
- `POST /uploads/confirm` - confirm uploads and queue processing.
- `GET /calendar` - list Google Calendar events.
- `POST /calendar` - create a calendar event.
- `GET /routines` - load the current routine.
- `POST /routines/generate-from-image` - extract a routine from an image.
- `POST /routines/confirm` - save an approved routine.
- `POST /mcq/generate` - generate quizzes from study content.
- `POST /messaging/send` - send a direct message.
- `GET /editor/translate` - translate Banglish or Bangla text to English.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on reporting issues and submitting pull requests.

## License

This repository is licensed under the MIT License — see [LICENSE](LICENSE) for details.
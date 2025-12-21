# IDP Backend - LearnSync AI Assistant

A sophisticated FastAPI-based backend application that powers LearnSync, an intelligent AI assistant with Google Calendar integration, conversational AI capabilities, and text processing features. Built with LangGraph for advanced agent orchestration and powered by multiple LLM providers.

## 🌟 Features

### 🤖 Intelligent Chat System
- **Multi-Agent Architecture**: Uses LangGraph state graph for intelligent routing between different agent types
- **Conversational AI**: Powered by Google Gemini 2.5 Flash for engaging, context-aware conversations
- **Streaming Responses**: Real-time Server-Sent Events (SSE) streaming for immediate user feedback
- **Persistent Memory**: SQLite-based conversation history using LangGraph checkpointing
- **Smart Tool Selection**: Automatic detection and routing to appropriate agent based on user intent

### 📅 Google Calendar Integration
- **Full Calendar Management**: Create, read, update, and delete calendar events
- **Natural Language Processing**: Use conversational commands to manage your schedule
- **Advanced Querying**: Filter events by date range, keywords, and custom parameters
- **Tool-Calling Agent**: Specialized calendar agent with LangChain toolkit integration
- **OAuth 2.0 Authentication**: Secure Google Calendar API access

### ✍️ Text Processing
- **Language Conversion**: Banglish (Romanized Bengali) to English text conversion
- **LLM-Powered Translation**: Uses Groq's GPT models for accurate text transformation

### 🎨 Document Processing
- **Supabase Integration**: Cloud storage for file management
- **PowerPoint Support**: Python-pptx integration for presentation processing

## 🏗️ Architecture

### Agent System
The application uses a sophisticated multi-agent system built with LangGraph:

```
User Query → Tool Selection Node → [Calendar Agent | Chat Agent] → Response
```

**Agent Nodes:**
- **Tool Selection Node**: Analyzes user intent and routes to appropriate agent
- **Calendar Node**: Handles calendar operations using LangChain's tool-calling agent
- **Chat Node**: Manages general conversations with context awareness

**State Management:**
- Maintains conversation context with message history reduction (last 6 messages)
- Thread-based user sessions for personalized experiences
- Metadata and scratchpad for inter-agent communication

### Tech Stack

**Core Framework:**
- FastAPI - Modern async web framework
- LangGraph - Agent orchestration and state management
- LangChain - LLM integration and tool management

**LLM Providers:**
- Google Gemini 2.5 Flash (via langchain-google-genai)
- Groq GPT (via langchain-groq)
- Support for Cohere integration

**Storage & Databases:**
- SQLite with aiosqlite - Async conversation persistence
- LangGraph SQLite Checkpointer - Agent state management
- Chroma - Vector database for embeddings
- Supabase - Cloud storage

**APIs & Services:**
- Google Calendar API (via langchain-google-community)
- Google Generative AI Embeddings
- LiteLLM - Multi-provider LLM gateway
- Memori SDK - Memory management

## 📋 Prerequisites

- Python 3.13 or higher
- [uv](https://github.com/astral-sh/uv) - Modern Python package manager
- Google Cloud Platform account (for Calendar API)
- API keys for:
  - Google AI (Gemini)
  - Groq
  - Cohere
  - Pinecone (optional)
  - Supabase

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd idp-main
```

### 2. Install Dependencies
```bash
uv sync
```

This will install all required packages including:
- fastapi, uvicorn - Web framework and server
- langgraph, langchain-core - Agent framework
- langchain-google-genai, langchain-groq - LLM providers
- langchain-google-community - Google Calendar integration
- aiosqlite - Async database
- pydantic-settings - Configuration management
- And more...

### 3. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# LLM API Keys
GOOGLE_API_KEY=your_google_ai_api_key
GROQ_API_KEY=your_groq_api_key
COHERE_API_KEY=your_cohere_api_key

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key

# Application Configuration
PDF_PATH=/path/to/pdf/storage
FRONTEND_LINK=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_BUCKET=your_bucket_name
SUPABASE_FOLDER=your_folder_name
```

### 4. Google Calendar Setup

The application requires Google Calendar API credentials for calendar operations:

#### Get OAuth 2.0 Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Desktop App** as application type
6. Download the credentials JSON file
7. Save it as `credentials.json` in the project root

#### Generate Access Token:
1. Run the application for the first time:
   ```bash
   uv run uvicorn src.main:app --reload
   ```
2. A browser window will automatically open for Google authentication
3. Grant calendar permissions to the application
4. `token.json` will be automatically created and saved

**🔒 Security Note**: Both `credentials.json` and `token.json` contain sensitive authentication data. They are automatically excluded from version control. Never commit these files to the repository.

## 🎯 Running the Application

### Development Mode
```bash
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📡 API Endpoints

### Chat Bot
**POST** `/chat_bot`
- Conversational AI with streaming responses
- Request: `{"question": "your message"}`
- Response: Server-Sent Events (SSE) stream
- Features: Real-time status updates, step-by-step processing feedback

### Calendar Management

**GET** `/api/calendar/events`
- Retrieve calendar events
- Query Parameters:
  - `min_datetime`: Start date filter (optional)
  - `max_datetime`: End date filter (optional)
  - `query`: Search keyword (optional)
  - `show_deleted`: Include deleted events (default: false)
  - `max_results`: Maximum events to return (default: 20)
  - `single_events`: Expand recurring events (default: true)
  - `order_by`: Sort order (default: "startTime")
- Response: List of calendar events with details

**DELETE** `/api/calendar/events/{calendar_id}/{event_id}`
- Delete a specific calendar event
- Path Parameters:
  - `calendar_id`: Google Calendar ID
  - `event_id`: Unique event identifier

### Text Editor

**POST** `/api/text-editor/convert`
- Convert Banglish text to English
- Request: `{"text": "your banglish text"}`
- Response: Converted English text

### Health Check

**GET** `/heath`
- Service health status
- Response: `{"message": "all is well"}`

## 🗂️ Project Structure

```
idp-main/
├── src/
│   ├── main.py                 # FastAPI application entry point
│   ├── agents/                 # Agent system implementation
│   │   ├── graph.py           # LangGraph state graph builder
│   │   ├── model.py           # Agent state definitions
│   │   ├── registry.py        # Agent factory/registry
│   │   ├── runner.py          # Agent execution engine
│   │   ├── nodes/             # Agent node implementations
│   │   │   ├── calendar_node.py
│   │   │   ├── chat_node.py
│   │   │   └── tool_selection_node.py
│   │   ├── tools/             # LangChain tools
│   │   │   └── google_calendar.py
│   │   └── integrations/      # External service integrations
│   │       └── google/
│   │           └── google_calendar.py
│   ├── api/                   # API layer
│   │   ├── dependencies.py    # Dependency injection
│   │   ├── agent/            # Agent router
│   │   │   └── router.py
│   │   └── routes/           # API route handlers
│   │       ├── calendar.py
│   │       ├── text_editor.py
│   │       └── study_bot.py
│   ├── core/                  # Core application components
│   │   ├── config.py         # Settings and configuration
│   │   ├── lifespan.py       # Application lifecycle management
│   │   ├── logging_config.py # Logging setup
│   │   └── integrations/     # Core integrations
│   │       └── google/
│   │           ├── calendar_service.py
│   │           ├── calendar.py
│   │           └── credentials.py
│   ├── schemas/              # Pydantic models
│   │   ├── bot.py
│   │   ├── calendar.py
│   │   ├── text_editor.py
│   │   └── study_bot.py
│   ├── services/             # Business logic layer
│   │   ├── llm_service.py    # LLM setup and configuration
│   │   ├── calendar_service.py
│   │   ├── text_editor_service.py
│   │   └── study_bot.py
│   └── workflows/            # Additional workflow definitions
│       ├── chat_workflow.py
│       └── nodes.py
├── credentials.json          # Google OAuth credentials (not in git)
├── token.json               # Google access token (not in git)
├── chat.sqlite              # Conversation history database
├── pyproject.toml           # Project dependencies
├── .env                     # Environment variables (not in git)
└── README.md               # This file
```

## 🔧 Configuration

### LLM Configuration
The application uses multiple LLM providers configured in `src/services/llm_service.py`:

- **Groq**: Default model `openai/gpt-oss-20b`
- **Google Gemini**: Default model `gemini-2.5-flash`
- **Embeddings**: Google `text-embedding-004`

### Agent Configuration
State management and message history:
- Message history: Last 6 messages retained
- Conversation persistence: SQLite with async support
- Thread-based sessions: Unique thread IDs per user

### CORS Configuration
Configured in `src/main.py`:
- Allowed origins: Frontend link from env + localhost:3000
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS
- Credentials: Enabled

## 🧪 Development

### Code Style
- Type hints throughout the codebase
- Async/await for I/O operations
- Pydantic for data validation
- Structured logging with colorlog

### Key Design Patterns
- **Dependency Injection**: FastAPI dependencies for service management
- **Factory Pattern**: Agent and tool creation
- **State Machine**: LangGraph for agent orchestration
- **Repository Pattern**: Service layer abstraction

### Logging
Configured in `src/core/logging_config.py` with color-coded output for different log levels.

## 🔒 Security Considerations

- **API Keys**: Never commit API keys or credentials to version control
- **OAuth Tokens**: Automatically excluded from git via `.gitignore`
- **Environment Variables**: Use `.env` file for sensitive configuration
- **CORS**: Configure allowed origins appropriately for production
- **Input Validation**: Pydantic models validate all API inputs

## 🐛 Troubleshooting

### Common Issues

**Google Calendar Authentication Fails:**
- Ensure `credentials.json` is in the project root
- Check that Google Calendar API is enabled in Google Cloud Console
- Verify OAuth consent screen is configured correctly
- Delete `token.json` and re-authenticate if issues persist

**LLM API Errors:**
- Verify API keys are correctly set in `.env`
- Check API key permissions and quotas
- Ensure no trailing whitespace in `.env` file

**Database Errors:**
- Delete `chat.sqlite*` files to reset conversation history
- Ensure write permissions for the application directory

**Import Errors:**
- Run `uv sync` to ensure all dependencies are installed
- Activate virtual environment if not using `uv run`

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]

## 👥 Authors

- **Kayes Ferdous** - Initial work

## 🙏 Acknowledgments

- LangChain & LangGraph teams for the agent framework
- Google for Gemini API and Calendar API
- Groq for high-performance LLM inference
- FastAPI team for the excellent web framework

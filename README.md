# IDP Backend

## Setup

### Prerequisites
- Python 3.x
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

1. Install dependencies:
```bash
uv sync
```

2. Create a `.env` file with the required environment variables (see `src/core/config.py` for required variables).

### Google Calendar Setup

The application uses Google Calendar API. To set up authentication:

1. **Get credentials.json**: 
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials (Desktop App)
   - Download the credentials and save as `credentials.json` in the project root

2. **Generate token.json**:
   - Run the application for the first time
   - A browser window will open for Google authentication
   - After authentication, `token.json` will be automatically created

**Note**: Both `credentials.json` and `token.json` contain sensitive authentication data and are excluded from version control via `.gitignore`. Never commit these files to the repository.

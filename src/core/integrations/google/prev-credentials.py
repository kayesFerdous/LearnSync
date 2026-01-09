from langchain_google_community.calendar.utils import get_google_credentials

# Scopes: full access (review at https://developers.google.com/calendar/api/auth)

def load_google_credentials():
    return get_google_credentials(
        token_file="token.json",  # Will create if missing
        scopes=["https://www.googleapis.com/auth/calendar"],  # Or .readonly for view-only
        client_secrets_file="credentials.json",
    )



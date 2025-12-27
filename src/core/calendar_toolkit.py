from langchain_google_community import CalendarToolkit
from langchain_google_community.calendar.toolkit import build_calendar_service
from langchain_google_community.calendar.utils import get_google_credentials
import google.oauth2.service_account as _sa

# Some langchain-google-community builds look for ServiceCredentials; provide an alias if missing.
if not hasattr(_sa, "ServiceCredentials"):
    _sa.ServiceCredentials = _sa.Credentials

# Scopes: full access (review at https://developers.google.com/calendar/api/auth)
credentials = get_google_credentials(
    token_file="token.json",  # Will create if missing
    scopes=["https://www.googleapis.com/auth/calendar"],  # Or .readonly for view-only
    client_secrets_file="credentials.json",
)

api_resource = build_calendar_service(credentials=credentials)


def get_tools():
    try:
        toolkit = CalendarToolkit(api_resource=api_resource)
        return toolkit.get_tools()
    except:
        print("Error occured in src.core.calendar_toolkit.py: \n Error initializing the toolkit")

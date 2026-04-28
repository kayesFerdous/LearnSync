# IDP Backend Restructuring

Summary of all structural, naming, and architectural changes applied to the codebase.

---

## Phase 1 — Dead Code & Cleanup

### Deleted Files & Directories

| Path | Reason |
|---|---|
| `src/schemas/` (entire dir) | Unused legacy schemas (`bot.py`, `calendar.py`, `study_bot.py`, `text_editor.py`) |
| `src/api/not_userd_routes/` | Misspelled directory with dead route files |
| `src/question_generation/` | Unused module, no imports anywhere |
| `src/services/resend_email.py` | Dead — replaced by `brevo_email.py` |
| `src/services/text_editor_service.py` | Portfolio-era leftover, no imports |
| `src/agents/tools/no_use_google_calendar.py` | Explicitly marked unused |
| `src/agents/integrations/` | Contained a single Bangla-named file, unused |
| `src/db/models/` | Empty directory |
| `src/core/calendar_toolkit.py` | `get_current_time_context()` moved to `src/core/integrations/google/calendar_service.py`; rest was dead |
| `TODOS.py` | Scratch file |
| `test.py` | Scratch file |

### Cleaned Modules

- **`src/main.py`** — Removed duplicate `agent_router` import (was the same module as `conversation_router`), removed all commented-out dead imports (`study_bot`, `text_editor`, old `calendar`).
- **`src/services/llm_service.py`** — Removed `setup_prompt_template()`, `setup_groq_llm_not_async()`, `setup_non_async_gemini_llm()`, `Route` class (moved to agents), and commented-out vector store code.

---

## Phase 2 — Bug Fixes

| Bug | Fix | File(s) |
|---|---|---|
| Duplicate router registration | Removed second import of the same module | `src/main.py` |
| `state['file_ids']` KeyError | Changed to `state.get('metadata', {}).get('file_ids', [])` | `src/agents/nodes/route_intent_node.py` |
| `async get_r2_client()` with no awaits | Removed `async` keyword; updated 2 callers that used `await` | `src/services/storage/r2.py`, `src/core/lifespan.py`, `src/services/file_processing.py` |
| Hardcoded session secret `"super_secret"` | Extracted to `settings.SESSION_SECRET_KEY` | `src/main.py`, `src/core/config.py` |
| Deprecated `datetime.utcnow()` | Replaced with `datetime.now(timezone.utc)` | `src/messaging/service.py`, `src/api/conversations/router.py`, `src/api/conversations/mindmap_schemas.py` |
| Typo `ENDPINT_URL` in R2 client | Fixed to `endpoint_url` | `src/services/storage/r2.py` |
| Typo `/heath` health endpoint | Fixed to `/health` | `src/main.py` |

---

## Phase 3 — Naming & Conventions

### File Renames

| Old Path | New Path | Reason |
|---|---|---|
| `src/routines/models.py` | `src/routines/model.py` | Consistency — all other domains use singular `model.py` |
| `src/users/crud.py` | `src/users/repository.py` | Clearer intent — "repository" describes data-access layer |
| `src/routines/crud.py` | `src/routines/repository.py` | Same as above |

All import sites (7+ for users, 5+ for routines, 6 for model rename) were updated across the codebase including Alembic `env.py` and `init_db.py`.

### Logging Standardization

Replaced **all** `print()` calls across 10+ source files (35+ occurrences) with structured `logger` calls using `src.core.logging_config.get_logger(__name__)`.

Affected files:
- `src/agents/runner.py`
- `src/agents/nodes/calendar_node.py`
- `src/agents/nodes/chat_node.py`
- `src/agents/nodes/routine_node.py`
- `src/agents/nodes/routine_approval_node.py`
- `src/api/conversations/router.py`
- `src/api/messaging/router.py`
- `src/routines/service.py`
- `src/core/integrations/google/calendar_service.py`
- `src/core/integrations/google/auth_utils.py`
- `src/calendar/google_client.py`

---

## Phase 4 — Schema Deduplication

| Duplication | Resolution |
|---|---|
| `ProcessingStatus` / `FileType` enums duplicated in `api/uploads/schemas.py` and `conversations/model.py` | Single source of truth in `src/conversations/model.py`; upload schemas and router now import from there |
| `UserRead` duplicated in `api/admin/schemas.py` and `users/schemas.py` | Admin schemas now import `UserRead` from `src/users/schemas` |
| Service layer (`users/service.py`) importing API schemas (`api/auth/schemas.py`) | Created domain-level `src/auth/schemas.py` with `SignupData` and `LoginData`; service layer imports from domain, not API |

---

## Phase 5 — Agent Decoupling

### AgentContext

Created an `AgentContext` dataclass in `src/agents/model.py` to replace raw `config["configurable"]["db"]` access:

```python
@dataclass
class AgentContext:
    db: AsyncSession
```

- `src/agents/runner.py` creates and passes `AgentContext` via LangGraph config
- `src/agents/nodes/calendar_node.py` and `routine_approval_node.py` consume it via `ctx = config["configurable"]["ctx"]`
- Backward-compatible `"db"` key still set for any nodes not yet migrated

### Route Model

Moved the `Route` Pydantic model from `src/services/llm_service.py` to `src/agents/model.py` (where agent state types belong). `llm_service.py` imports it lazily to avoid circular imports.

### RAG Store Documentation

Added a module docstring to `src/rag/store.py` explaining the dual sync-singleton / async-lifespan architecture.

---

## Phase 6 — Infrastructure

### Centralized Exception Handling

**New file: `src/core/exceptions.py`**

Base class `AppException(Exception)` carries `status_code`, `code`, and `detail`. All domain exceptions inherit from it:

| Exception | Status | Code |
|---|---|---|
| `EmptyTokenException` | 401 | `EMPTY_TOKEN` |
| `InvalidCredentialsException` | 401 | `INVALID_CREDENTIALS` |
| `UserAlreadyExistsException` | 409 | `USER_ALREADY_EXISTS` |
| `EmailNotVerifiedException` | 403 | `EMAIL_NOT_VERIFIED` |
| `EmailVerificationTokenInvalidException` | 400 | `EMAIL_TOKEN_INVALID` |
| `EmailVerificationTokenExpiredException` | 400 | `EMAIL_TOKEN_EXPIRED` |
| `EmailVerificationResendTooSoonException` | 429 | `EMAIL_RESEND_TOO_SOON` |
| `EmailVerificationDeliveryException` | 502 | `EMAIL_DELIVERY_FAILED` |
| `NotFoundException` | 404 | `NOT_FOUND` |
| `ForbiddenException` | 403 | `FORBIDDEN` |

A global FastAPI handler (`register_exception_handlers`) is registered in `src/main.py` and returns a consistent JSON envelope:

```json
{"detail": "...", "code": "..."}
```

**Removed:** 8 bare `pass` exception classes from `src/users/service.py` and 1 from `src/services/brevo_email.py`.

**Simplified:** `src/api/auth/router.py` no longer manually wraps each exception in `HTTPException` — `AppException` subclasses propagate to the global handler automatically.

> `AuthError` in `src/auth/service.py` intentionally remains separate — it is caught in the API dependency layer where a `WWW-Authenticate` header must be added.

### WebSocket Auth Extraction

- **`get_current_user_ws()`** moved from `src/api/messaging/router.py` → `src/api/dependencies.py` (shared dependency, reusable by any future WebSocket endpoint)
- **`ConnectionManager`** moved from `src/api/messaging/router.py` → `src/messaging/service.py` (service-layer concern; exposed as module-level `manager` singleton)

---

## Verification

All checks pass after restructuring:

- `python -c "from src.main import app"` — full import chain resolves
- No remaining imports of deleted modules (`src.schemas`, `src.routines.models`, `src.users.crud`, `src.routines.crud`, `src.question_generation`, `src.services.text_editor`, `src.services.resend_email`)
- No remaining `print()` calls in `src/`
- No remaining `datetime.utcnow()` calls
- Exception hierarchy validated (correct `status_code` on all subclasses)

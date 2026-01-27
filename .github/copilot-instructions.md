# VibeCode - AI Coding Agent Instructions

## Project Overview

**VibeCode** is an Auth0-integrated full-stack authentication application with:
- **Frontend**: React 18 + Vite (port 3002)
- **Backend**: FastAPI with PostgreSQL (port 8000)
- **Authentication**: Auth0 OAuth2 flow with JWT token verification
- **Philosophy**: "Working code first" - pragmatic development focusing on functionality over perfection

## Architecture & Data Flow

### Core Authentication Flow
1. **Frontend**: User clicks login → `useAuth0` hook triggers Auth0 popup
2. **Auth0**: User authenticates → redirects back with JWT token
3. **Frontend**: `useAuth0.handleRedirectCallback()` captures token → stored in localStorage
4. **API Calls**: Token sent via `Authorization: Bearer {token}` header
5. **Backend**: `verify_token()` dependency validates JWT signature using Auth0's JWKS endpoint
6. **Database**: User profile cached in PostgreSQL `users` table on first protected API call

### Key Component Relationships
```
App.jsx (root)
├─ useAuth0 hook (state manager for auth)
│  ├─ auth0Client initialization
│  ├─ handleRedirectCallback() processing
│  └─ getToken() for API requests
├─ Login (renders if not authenticated)
├─ UserProfile (renders if authenticated)
└─ ProtectedContent (fetches from /api/protected)
```

## Critical Configuration & Integration Points

### Environment Variables Required
**Frontend** (`.env.local`):
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
```

**Backend** (`.backend/.env`):
```
DATABASE_URL=postgresql://user@/vibecode?host=/var/run/postgresql
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
```

### Vite Proxy Configuration
`vite.config.js` proxies `/api/*` requests to `http://localhost:8000` - all axios calls use relative paths (e.g., `/api/protected`).

### Auth0 OAuth Settings in Code
- **Scope**: `openid profile email` (simple user info)
- **Prompt**: `login` (show login screen every time)
- **Cache**: localStorage (persists state across browser refreshes)
- **Redirect URI**: `window.location.origin` (auto-detected)

## Database Schema & Patterns

### Users Table
```python
class User(Base):
    __tablename__ = "users"
    id, auth0_id (unique), email, name, picture, last_token, created_at, updated_at
```

**Key Pattern**: Users are created on-demand when accessing `/api/protected` for the first time. The `last_token` column stores JWT tokens (testing/debugging only).

**Migration Safety**: Backend includes inline migration logic (lines 50-55 of `main.py`) - new columns added via `ALTER TABLE` if missing, errors logged but don't crash startup.

## Backend API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /` | None | Health check |
| `GET /api/protected` | JWT | Main protected route - creates/updates user in DB |
| `GET /api/token/latest` | JWT | Retrieves last stored token from DB |
| `GET /api/users/me` | JWT | Returns current user profile |

## Development Workflows

### Start Full Stack
```bash
# Terminal 1: Frontend (port 3002)
npm run dev

# Terminal 2: Backend (port 8000)
npm run server
# or: cd backend && uvicorn main:app --reload --port 8000
```

### Build & Production
- **Frontend**: `npm run build` → outputs `dist/` folder
- **Backend**: `npm run server:prod` binds to `0.0.0.0:8000`

## Project-Specific Conventions

### Error Handling Approach
- **Frontend**: Graceful logging with `[Auth0]` console prefixes (see `useAuth0.jsx` lines 33-45)
- **Backend**: State validation errors tolerated (invalid_grant treated as "already authenticated elsewhere")
- **Philosophy**: Errors logged but don't block flow - app continues working when possible

### Component Patterns
1. **useAuth0 Hook**: Custom hook (not Context API) - manages single auth client instance
2. **Functional Components**: All React components are functions, no classes
3. **Axios for Requests**: Direct axios calls in components, token passed per-request (not interceptor)

### Testing File
`src/test.py` exists but purpose unclear - check if it's for backend unit tests (unused currently).

## Cross-File Dependencies

**Critical Import Chains**:
- `App.jsx` imports `useAuth0()` from `hooks/useAuth0.jsx` 
- `ProtectedContent.jsx` calls `getToken()` from useAuth0 hook to authenticate API requests
- Backend JWT validation relies on Auth0 JWKS endpoint being accessible
- Frontend's redirect URI must exactly match Auth0 application settings

## Common Debugging Checklist

1. **Auth0 Config**: Verify `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` match Auth0 dashboard
2. **Database Connection**: Check PostgreSQL running: `psql -l` lists databases
3. **CORS**: Backend `allow_origins=["http://localhost:3002"]` must include frontend URL
4. **Token Fetch**: ProtectedContent component logs detailed token & request info with `[ProtectedContent]` prefix
5. **Port Conflicts**: Vite runs on 3002 (not 3000), Backend on 8000

## Notable Code Quirks

- **localStorage State Tracking**: useAuth0 stores Auth0 state in localStorage (unusual for SPAs, but enables page refresh resilience)
- **Dynamic Migration**: Backend auto-adds missing DB columns on startup
- **Token Storage**: Raw JWT tokens saved in DB for debugging (remove in production)
- **Japanese Comments**: Codebase heavily commented in Japanese - preserve when editing

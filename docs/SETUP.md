# Setup and architecture

## Local setup

1. Install Python 3.10+ and Docker Desktop.
2. From the repository root, start PostgreSQL with `docker compose up -d db`.
3. Create and activate a virtual environment, then run `pip install -r requirements.txt`.
4. Copy `.env.example` to `.env`, set `DATABASE_URL`, and generate separate random values (at least 32 characters) for `JWT_SECRET_KEY` and `EMAIL_HASH_SECRET`.
5. Start FastAPI with `python -m uvicorn backend.main:app --reload`.
6. Open <http://127.0.0.1:8000>. API docs: <http://127.0.0.1:8000/api/docs>.

The default connection is for local development. For another PostgreSQL server, set `DATABASE_URL` in `.env`; `.env.example` shows the expected format. Never put a database connection string in frontend JavaScript.

If local port 5432 is busy, set `FOODHUB_DB_PORT=5433` before starting Compose and update the port in `DATABASE_URL`.

## Architecture

- `backend/main.py` defines the FastAPI app, SQLAlchemy models, startup seed, and REST routes.
- `assets/js/db.js` adapts the app's existing `FH.db` interface to the FastAPI endpoints.
- `/api/auth/signup` and `/api/auth/login` issue expiring bearer tokens.
- `/api/carts` returns saved carts. Authenticated owners can create, update, and delete their own carts.
- `/api/carts/{id}/reviews` lists and adds food/hygiene reviews.
- PostgreSQL stores Argon2 password hashes and keyed HMAC-SHA256 email digests. It does not store account email in plaintext.
- Existing `vendor_email` and `author_email` columns are hashed and dropped at startup.
- The frontend polls for shared cart updates. If the backend is unavailable, it keeps the local demo cache active.

## Configuration

`assets/js/config.js` contains the optional public Mapbox token and map preferences. Do not place database credentials there. Set server secrets and `DATABASE_URL` in the backend environment.

Keep `.env` and its secrets backed up securely and out of source control. The browser stores the user's email for display and a bearer token in localStorage, but never stores the password. Use HTTPS on a public deployment.

## Included app features

Mapbox/Leaflet map, geolocation, directions, live vendor status, 1–5 star food and hygiene reviews, cart submission, QR codes, PWA installation, and the original spot discovery features.

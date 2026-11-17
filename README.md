# খাLaS

“Find the cart. Feed the street.” A Dhaka food discovery map for roadside carts and community verified spots.

The app uses a vanilla JavaScript frontend, FastAPI REST API, and PostgreSQL. Supabase is not part of the project.

## Run locally

Requirements: Python 3.10+ and Docker Desktop.

```sh
docker compose up -d db
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

Open <http://127.0.0.1:8000>. FastAPI serves the website and API. Interactive API documentation is at <http://127.0.0.1:8000/api/docs>.

The local database uses `postgresql+psycopg://foodhub:foodhub@localhost:5432/foodhub`. Set `DATABASE_URL` in `.env` to use another PostgreSQL server. The included database password is for local development only.

If port 5432 is already in use, set `FOODHUB_DB_PORT=5433` before `docker compose up -d db` and use port 5433 in `DATABASE_URL`.

## Backend

- FastAPI endpoints under `/api` provide cart reads/writes and review reads/writes.
- PostgreSQL stores carts, photos, status, food categories, review summaries, and individual reviews.
- Tables are created automatically at startup. An empty database receives the sample cart data.
- On first successful connection, locally cached carts missing from PostgreSQL are imported once.
- If the API is offline, the frontend falls back to its local demo cache.
- The browser uses REST polling for shared cart updates; local-only preferences and the existing demo sign-in remain in `localStorage`.

The email-only sign-in is a demonstration identity flow, not secure authentication. The write endpoints are intended for local development and need real authentication and authorization before public deployment.

## Features

- Mapbox map with Leaflet fallback, custom pins, and live open/closed status.
- Find Near Me, cart directions, delivery and booking details.
- 1–5 star food and hygiene reviews, plus the existing 1–10 map score.
- Crowdsourced cart creation, photo gallery, QR links, and PWA install support.
- Search, cuisine filters, community confirmations, and spot details.

See [docs/SETUP.md](docs/SETUP.md) for setup notes and architecture.

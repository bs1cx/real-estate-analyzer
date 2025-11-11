# Real Estate Analytics Platform

Fresh full-stack setup for analysing real estate listings with FastAPI, Next.js, and PostgreSQL/PostGIS.

## Structure

- `backend/` – FastAPI service exposing `/api/price-analysis`
- `frontend/` – Next.js 14 dashboard (app router + Tailwind)
- `data/` – Mock CSV dataset and seed script
- `docker-compose.yml` – local dev stack (frontend + backend + PostGIS)

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set environment variables in `frontend/.env.local` and `backend/.env` based on the provided `.env.example`.

### Seed Mock Data

```bash
python data/scraper/seed_mock_data.py --database-url postgresql+psycopg://postgres:password@localhost:5432/real_estate
```

### Docker

```bash
docker compose up --build
```

---

- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

# Grocery AI — AI Daily Meal Planner

A mobile-first app that turns **real supermarket flyer discounts** into **AI-generated
budget meal plans**. It downloads weekly flyers (PDF), extracts the discounted food
items with an LLM, ranks the best deals, and proposes breakfast / lunch / dinner
recipes built around what's on sale.

> **Status:** working prototype / early MVP. One end-to-end pipeline (flyer → deals →
> recipes) is live for Lidl & Mercator. The Restaurants page is still mock data. See
> [Project status](#project-status).

---

## Architecture

```
frontend/app   React 19 + Vite + TypeScript + Tailwind + shadcn/ui
               i18n (6 languages), Zustand store, Capacitor (Android/iOS)
                          │  HTTPS
                          ▼
backend         Flask + gunicorn  (deployed on Render)
               PDF flyer  ──►  Moonshot/Kimi OCR + LLM  ──►  ranked deals
                                                          ──►  Kimi recipe generation
               SQLite cache (deals) + in-memory cache (10 min)
```

### Backend modules

| File | Role |
|------|------|
| `mlx_server.py` | Flask app & HTTP entrypoint (see `Procfile`) |
| `config.py` | `PARSER_MODE` / `RECIPE_MODE` (`cloud` default, `local` for Ollama) |
| `mercator_kimi_parser.py` | Flyer PDF → product list (Kimi cloud or local Gemma) |
| `recipe_engine.py` | Discounted products → recipes (Kimi cloud or local Gemma) |
| `local_parser.py` | Local Ollama Gemma parser (used when `PARSER_MODE=local`) |
| `database.py` | SQLite deal cache |

### Backend API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /nearby-supermarkets` | Supported stores: `[{id, name}]` |
| `GET /supermarket-deals?store=<id>[&refresh=true]` | Parsed deals + AI menu for a store |

---

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Cloud mode (default) needs a Moonshot/Kimi key:
export MOONSHOT_API_KEY=sk-...
python mlx_server.py            # http://localhost:5001
```

Environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `MOONSHOT_API_KEY` | — | Moonshot/Kimi API key (required for `cloud` mode) |
| `PARSER_MODE` | `cloud` | `cloud` (Kimi) or `local` (Ollama Gemma) |
| `RECIPE_MODE` | `cloud` | `cloud` (Kimi) or `local` (Ollama Gemma) |

`local` mode expects an Ollama server on `http://localhost:11434` with `gemma3:4b`.

### Frontend

```bash
cd frontend/app
npm install
npm run dev                     # http://localhost:5173
```

Point the frontend at a different backend with a build-time variable:

```bash
echo "VITE_API_BASE_URL=http://localhost:5001" > .env.local
```

Defaults to the hosted backend if unset. See `frontend/app/BUILD_GUIDE.md` for the
Android/iOS (Capacitor) build steps.

---

## Project status

**Working**
- Flyer → deals → recipes pipeline for **Lidl** and **Mercator** (cloud LLM).
- Home page and Supermarket page render real backend data.
- Polished mobile UI, 6-language i18n, Capacitor mobile build config.

**Known gaps / next steps**
- Restaurants page is still mock data.
- Store coverage is limited to two chains with hardcoded flyer URLs.
- No automated tests / CI yet.

# Grocery AI — AI Daily Meal Planner

A mobile-first app that turns **real supermarket flyer discounts** into **AI-generated
budget meal plans**. It downloads weekly flyers (PDF), extracts the discounted food
items with an LLM, ranks the best deals, and proposes breakfast / lunch / dinner
recipes built around what's on sale.

> **Status:** working prototype / early MVP. The flyer → deals → recipes pipeline is
> live for Lidl & Mercator, and the Restaurants page uses real OpenStreetMap data. See
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
| `flyer_sources.py` | Resolves each store's **current** flyer PDF URL dynamically |
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
| `MOONSHOT_MODEL` | `kimi-k2-turbo-preview` | Chat model for cloud parsing/recipes. Override if your key lacks the default (e.g. `moonshot-v1-128k`, `kimi-k2.5`) — check `GET /v1/models`. |
| `PARSER_MODE` | `cloud` | `cloud` (Kimi) or `local` (Ollama Gemma) |
| `RECIPE_MODE` | `cloud` | `cloud` (Kimi) or `local` (Ollama Gemma) |
| `<STORE>_FLYER_URL` | — | Override the resolved flyer URL for a store, e.g. `LIDL_FLYER_URL`. Used as a fallback when a store has no working dynamic resolver. |

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
- Restaurants page uses real **OpenStreetMap** (Overpass API) data — free, no API key.
- Polished mobile UI, 6-language i18n, Capacitor mobile build config.

**Known gaps / next steps**
- Flyer URLs are resolved dynamically (`flyer_sources.py`): **Mercator** is fully
  dynamic (its catalogs page lists the current PDF). **Lidl** uses the Schwarz
  `leaflets.schwarz` platform, whose weekly PDF sits behind an undocumented API and
  isn't a stable public link, so it currently falls back to the `LIDL_FLYER_URL`
  override. Adding a new chain = adding a resolver to `flyer_sources.py`.
- OpenStreetMap has no ratings/reviews/price level, and `opening_hours` parsing is
  best-effort, so those fields can be empty in the Restaurants UI.
- No automated tests / CI yet.

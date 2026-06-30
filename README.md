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
- Flyer → deals → recipes pipeline (cloud LLM). Stores: **Lidl** and **Mercator**
  resolve their current flyer fully dynamically; **Spar** and **Hofer** are scraped
  from a third-party aggregator and read with a vision model (see below).
- **Location-aware stores**: `/nearby-supermarkets?lat=&lon=` reverse-geocodes the
  user's **country + region** (e.g. `it` / `Lombardy`), returns only chains that
  operate there (empty if uncovered) with the nearest physical branch + distance
  (best-effort via OSM). Home picks the nearest store for the daily menu instead of
  a hardcoded one. Coverage: **Slovenia** (Mercator, Spar, Hofer, Lidl) and **Italy**
  (Lidl national; **Conad/Coop/Carrefour region-varying** via the DoveConviene
  aggregator — the flyer follows the user's city, e.g. Milan and Naples get
  different Conad flyers, read with the vision model).
- **Per-dish cost & savings**: each recipe lists ingredients (on-sale highlighted),
  an estimated cost, and how much you save vs. normal prices.
- Restaurants page uses real **OpenStreetMap** (Overpass API) data — free, no API key.
- Polished mobile UI, 6-language i18n, Capacitor mobile build config.

**Known gaps / next steps**
- Flyer URLs are resolved dynamically (`flyer_sources.py`): **Mercator** is fully
  dynamic (its catalogs page lists the current PDF). **Lidl** uses the Schwarz
  `leaflets.schwarz` platform, whose weekly PDF sits behind an undocumented API and
  isn't a stable public link, but is fully resolved via that API. **Spar** and
  **Hofer** official sites bot-block server-side requests (HTTP 403, including from
  datacenter/deployment IPs), so their current flyer page images are scraped from the
  third-party `moj-letak.si` aggregator and read with the Moonshot **vision model**.
  This is best-effort and may break if that site changes; both honor `SPAR_FLYER_URL`
  / `HOFER_FLYER_URL` overrides. Adding a new chain = adding a resolver to
  `flyer_sources.py` (and its country coverage in `STORES`).
- Store coverage is currently Slovenia only; other countries return no stores until
  their chains + resolvers are added. Nearest-branch distance depends on public
  Overpass availability (best-effort).
- OpenStreetMap has no ratings/reviews/price level, and `opening_hours` parsing is
  best-effort, so those fields can be empty in the Restaurants UI.
- No automated tests / CI yet.

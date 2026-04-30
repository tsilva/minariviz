<div align="center">
  <img src="./logo.png" alt="minariviz" width="420" />

  **🔬 Explore, filter, and visualize Minari offline reinforcement learning datasets in your browser 📊**

  [Live Demo](https://minariviz.tsilva.eu/)
</div>

minariviz is a browser-based explorer for Minari offline reinforcement learning datasets. It helps researchers and practitioners search the catalog, filter by namespace, compare metadata, and inspect reward and episode statistics without jumping between dataset docs.

The Next.js frontend includes the static dataset catalog and charts. A separate FastAPI service powers the observation viewer by downloading Minari datasets on demand, reading local HDF5 files, and returning batched JPEG frames to the browser.

## Install

```bash
git clone https://github.com/tsilva/minariviz.git
cd minariviz
pnpm install
```

Start the frontend:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To use the observation viewer locally, start the API in another shell:

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Commands

```bash
pnpm dev       # start the Next.js development server
pnpm build     # build the frontend for production
pnpm start     # start the production Next.js server
pnpm lint      # run ESLint
```

```bash
cd api
uvicorn main:app --host 0.0.0.0 --port 8000  # start the FastAPI service
```

## Notes

- Use `pnpm` for JavaScript dependencies; the repo enforces it during `preinstall`.
- `NEXT_PUBLIC_API_URL` points the frontend to the API. It defaults to `http://localhost:8000`.
- The API downloads datasets through Minari and stores them under `~/.minari/datasets`.
- The observation viewer requires the Python API server. The static catalog, filtering, and charts run in the frontend.
- Optional analytics and monitoring keys are listed in `.env.example`: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`, and `SENTRY_ENVIRONMENT`.
- Vercel builds the Next.js frontend. `render.yaml` defines a Docker-backed Render service for the FastAPI API.

## Architecture

![minariviz architecture diagram](./architecture.png)

## License

[MIT](LICENSE)

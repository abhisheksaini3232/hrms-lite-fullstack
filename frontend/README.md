# Frontend (React + Vite)

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

## Environment

- `VITE_API_URL`
	- Local: `http://localhost:8000`
	- Production: your Render URL, e.g. `https://<your-service>.onrender.com`

Note:

- If `VITE_API_URL` is not set, the frontend falls back to the Render URL embedded in `src/api.js`.

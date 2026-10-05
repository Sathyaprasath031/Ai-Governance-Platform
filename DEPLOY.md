# Deployment Runbook

Production topology:

| Piece    | Host          | Notes                                            |
| -------- | ------------- | ------------------------------------------------ |
| Database | MongoDB Atlas | Free M0 cluster `cluster0.zlxlquv` (AWS ap-south-1) |
| API      | Render        | Web Service, root directory `backend`            |
| Web app  | Vercel        | Static Vite build, root directory `frontend`     |

Secrets live only in **git-ignored files** (`backend/atlas.env`, `backend/render.env`) and in the host dashboards. Never commit them.

---

## 1. MongoDB Atlas

### Network Access (project-scoped)
The API will be unreachable until the cluster accepts connections from Render's IPs.

1. Atlas → the project that owns `cluster0.zlxlquv.mongodb.net` → **Network Access**.
2. **Allow Access from Anywhere** adds `0.0.0.0/0` (IPv4). Do not hand-type `0.0.0.0` without `/0`.
3. Add `::/0` too if your network is IPv6 / NAT64.
4. Click **Confirm** and wait until each entry shows **Active** (not "Pending").

> Render's outbound IPs are not static on the free tier, so `0.0.0.0/0` is the practical choice. For a hardened setup, use Render's static egress IPs (paid) and allow only those.

### Database Access
- User `vsathyaprasath77_db_user`, authentication database `admin`.
- Role: **Read and write to any database**.
- Password must match `backend/atlas.env`; URL-encode any of `@ : / ? # [ ]`.

### Cluster
- Must be **Running**, not Paused (free M0 clusters auto-pause after inactivity).
- Do not delete/recreate it — that changes the shard hostnames and invalidates the URI.

### Connection string
```
mongodb+srv://<user>:<password>@cluster0.zlxlquv.mongodb.net/ai-governance?appName=Cluster0
```
Include the `/ai-governance` database name; without it Mongoose defaults to `test`.

---

## 2. Render — backend

- New **Web Service** → connect the GitHub repo → branch `main`.
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`
- Instance type: Free (sleeps after ~15 min idle; the first request after sleep is slow).

Environment variables (values are in `backend/render.env`):

| Key            | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| `MONGODB_URI`  | Atlas `mongodb+srv://…/ai-governance?…` URI                       |
| `JWT_SECRET`   | strong random value (generated with `crypto.randomBytes(48)`)     |
| `NODE_ENV`     | `production`                                                      |
| `CORS_ORIGINS` | the Vercel URL, e.g. `https://ai-governance.vercel.app`           |

`NODE_ENV=production` makes the server **refuse to start** if `JWT_SECRET` is missing, and stops the `dev-secret` fallback from ever being used in production.

Verify:
```
curl https://<render-app>.onrender.com/api/health
# {"status":"ok","service":"ai-governance","db":"connected", ...}
```

Seed the database once (locally, against Atlas):
```
cd backend
MONGODB_URI=$(sed -n 's/^MONGODB_URI=//p' atlas.env) npm run seed
```
> `seed.js` **deletes all documents** in every collection before inserting the demo dataset.

---

## 3. Vercel — frontend

- New Project → same repo → **Root Directory:** `frontend` (Vite is auto-detected).
- Environment variable:

| Key            | Value                                            |
| -------------- | ------------------------------------------------ |
| `VITE_API_URL` | `https://<render-app>.onrender.com` (no trailing slash) |

- `frontend/vercel.json` already rewrites all routes to `/index.html` so React Router deep links work.

After the first Vercel deploy, copy its URL into Render's `CORS_ORIGINS` and redeploy the backend.

---

## 4. Post-deploy verification

1. `GET /api/health` returns `db: "connected"`.
2. Open the Vercel URL, log in (`admin@gov.io`), load Models / Approvals / Audit.
3. Perform one write (e.g. update a compliance item) and confirm it persists after reload.
4. Confirm CORS still rejects unknown origins — a request from `https://evil-site.com` should not receive an `Access-Control-Allow-Origin` header.

---

## 5. Security checklist

- [ ] `JWT_SECRET` is a strong random value and set on Render.
- [ ] `NODE_ENV=production` on Render.
- [ ] `POST /api/auth/register` cannot self-assign `admin` (only `viewer` / `reviewer` / `auditor` / `model_owner`); admins grant elevated roles via `PATCH /api/auth/users/:id/role`.
- [ ] Demo passwords (`password123`) rotated or the demo users removed before public use.
- [ ] No `.env` / `atlas.env` / `render.env` file is tracked by git.

---

## 6. Local development

```
# backend
cd backend && npm install && npm run dev      # http://localhost:4010

# frontend
cd frontend && npm install && npm run dev     # http://localhost:5180 (proxies /api -> 4010)
```

Local development falls back to `mongodb://127.0.0.1:27017/ai-governance` when `MONGODB_URI` is unset.

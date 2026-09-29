# AI Governance Platform

## What is this project?

This is a web application where a company can **keep track of all its AI models in one place** — and make sure no model goes live until it has been properly reviewed and approved.

Think of it like an **airport security check, but for AI models**. Before a model "takes off" (goes live in production), it must pass through checkpoints:

- Is it registered?
- Has it been reviewed by the right people?
- Is all the required paperwork done?
- Is it being monitored after launch?

If any checkpoint fails, the system **blocks the model from going live**. That's the whole idea.

---

## Why did I build this?

Companies today use many AI models — for loan approvals, fraud detection, chatbots, etc. But there's a real problem:

- Nobody has a single list of "all the AI we use and how risky each one is"
- Models sometimes go live without anyone double-checking them
- If a regulator asks *"who approved this model and when?"* — there's no easy answer

This app solves that. It makes sure **every model follows the same process**, and it **records everything automatically**, so the company always has proof of who did what and when.

---

## How it works (the simple version)

1. **A new AI model is registered** and given a risk level: low, medium, high, or critical.
2. **A new version of the model is created** (like v2.1.0) with its details — accuracy, training data, fairness results.
3. **The owner submits it for review.**
4. **Reviewers approve it.** Important models need **two** different reviewers.
5. **The system checks the paperwork** — important models need more documents (like a bias assessment and legal sign-off) before they can go live.
6. **The model is deployed** to production.
7. **The system keeps watching it** — if accuracy drops or data drifts, it raises an alert.
8. **Everything that happened is written to an audit log** that cannot be changed.

If someone tries to skip a step — for example, deploying a critical model with no approvals — **the system says no**. The rules are enforced in the backend code, not just shown as warnings on the screen.

---

## Who uses it? (5 roles)

| Role | What they can do |
|---|---|
| **Admin** | Everything — manage users, change roles, see all data |
| **Model Owner** | Registers models, creates versions, submits them for review, deploys them |
| **Reviewer** | Approves or rejects model versions |
| **Auditor** | Can see the full history of everything that happened (read-only) |
| **Viewer** | Can look at models and approvals, but change nothing |

The app shows each person only what their role allows — and the backend checks this again for every request, so nobody can cheat it from the browser.

---

## Tech Stack (what it's built with)

### Frontend (what users see)
- **React** — builds the interface (pages, buttons, forms)
- **Vite** — runs the app during development and packages it for production
- **Tailwind CSS** — styles everything (the violet dark theme, glass cards)
- **React Router** — moves between pages (Dashboard, Registry, Approvals...)

### Backend (the brain)
- **Node.js + Express** — the server that receives requests and enforces all the rules
- **MongoDB** — the database where all data is stored (users, models, approvals, audit logs)
- **Mongoose** — a library that connects Express to MongoDB
- **JWT (JSON Web Tokens)** — proves who you are after you sign in
- **bcrypt** — securely encrypts passwords so even we can't read them

### One-line summary
> A React frontend talks to a Node/Express backend, which stores everything in MongoDB and enforces all governance rules before anything is saved or deployed.

---

## Project Structure

```
ai-governance/
├── backend/          → Node/Express server + MongoDB models
│   ├── models/       → database shapes (User, Model, Approval, etc.)
│   ├── routes/       → API endpoints (auth, models, approvals...)
│   ├── middleware/   → auth checks (JWT + role gates)
│   └── services/     → governance rules (compliance, audit)
├── frontend/         → React app
│   └── src/
│       ├── pages/    → Dashboard, Model Registry, Approvals, Audit Trail
│       ├── components/ → Navbar, badges, animated background
│       └── context/  → login state shared across the app
└── project_explanation.md → this file
```

---

## Running It Locally

You need Node.js and MongoDB running on your machine.

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env     # then open .env and set your MongoDB address + a secret
npm start                # server runs on http://localhost:4010

# 2. Frontend (open a second terminal)
cd frontend
npm install
npm run dev              # app runs on http://localhost:5180
```

Then open **http://localhost:5180** in your browser.

---

## Deployment Plan

| Part | Deployed on | Notes |
|---|---|---|
| Frontend | **Vercel** | Vercel builds and hosts the React app |
| Backend | **Render** | Runs the Node server 24/7 |
| Database | **MongoDB Atlas** | Cloud-hosted MongoDB (free tier works) |

Secrets (database address, JWT secret) are **never** stored in the code — they're set in the Vercel/Render dashboards as environment variables. The `.env` file is in `.gitignore` for this reason.

---

## What I'd improve next

- Stop letting new users pick their own role at signup (they should start as "viewer" and be promoted by an admin)
- Add "forgot password" support
- Add charts to the dashboard for trends over time

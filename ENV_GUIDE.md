# Environment Variable Configuration Guide

This guide describes the configuration settings required for both the frontend and backend of the Digital Credit Ledger Management System.

---

## 1. Backend Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory based on the following template:

```env
# ─── Server Configuration ──────────────────────────────────────────────────────
# The port number the Express API server will listen on.
PORT=5000

# Server environment configuration. Options: development, production
NODE_ENV=development

# ─── MongoDB Configuration ─────────────────────────────────────────────────────
# For Local Development (MongoDB Compass / Local Server):
MONGO_URI=mongodb://localhost:27017/digital_credit_ledger

# For Production (MongoDB Atlas Cloud Cluster):
# Replace <username>, <password>, and <cluster> with your Atlas cluster details.
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/digital_credit_ledger?retryWrites=true&w=majority

# ─── JWT Configuration ─────────────────────────────────────────────────────────
# A secret key used to sign and verify JSON Web Tokens. Use a long random string.
JWT_SECRET=supersecretjwtkey1234567890

# Token expiry duration (e.g., 7d = 7 days, 24h = 24 hours).
JWT_EXPIRES_IN=7d

# ─── CORS — Frontend URL ───────────────────────────────────────────────────────
# The URL of the frontend client allowed to communicate with the API.
# Local development:
CLIENT_URL=http://localhost:5173
# Production (replace with your deployed Vercel URL):
# CLIENT_URL=https://your-app-name.vercel.app

# ─── Rate Limiting ─────────────────────────────────────────────────────────────
# Time duration window in milliseconds for rate limiting auth requests (e.g., 900000 = 15 mins).
RATE_LIMIT_WINDOW_MS=900000

# The maximum number of authorization requests allowed per IP within the window.
RATE_LIMIT_MAX=20
```

---

## 2. Frontend Environment Variables (`frontend/.env`)

Create a `.env` file in the `frontend/` directory based on the following template:

```env
# The base URL pointing to the running backend Express API.
# Note: Vite requires environment variables to start with "VITE_" prefix to be exposed to the browser.
# Local Development:
VITE_API_URL=http://localhost:5000/api
# Production Deployment:
# VITE_API_URL=https://your-deployed-api.onrender.com/api
```

---

## 3. Database Migration and Atlas Setup

To switch from the local development database to MongoDB Atlas in production:

1. **Sign up / Log in** to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create a Database User**: Navigate to **Database Access** under Security. Click **Add New Database User**. Configure password authentication and set user privileges to **Read and write to any database**.
3. **Configure IP Access List**: Navigate to **Network Access** under Security. Click **Add IP Address**. For convenience in cloud deployments, choose **Allow Access From Anywhere** (`0.0.0.0/0`) or whitelist your specific deployment IP addresses (e.g., Render outbound IPs).
4. **Retrieve Connection String**: Click **Database** under Deployment. Click **Connect** on your cluster. Select **Drivers**. Copy the connection string.
5. **Update `.env`**: Set the `MONGO_URI` variable on your deployment platform (Render) to the copied string, replacing `<password>` with the password of the database user created in Step 2.
6. The backend application will automatically parse the URI and connect securely via SSL.

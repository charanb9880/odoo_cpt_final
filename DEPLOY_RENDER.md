# Deploying Odoo POS Cafe to Render

We have updated the repository's `render.yaml` Blueprint configuration file. Render will automatically detect this file and set up both the backend web service and the frontend static site with correct routing, CORS settings, and environment variables linked together.

Follow these steps to host your application on Render:

---

## 1. Prerequisites
Before you start, make sure you have:
1. Your **MongoDB Atlas URI** (from your `.env` file)
2. Your **Brevo API Key** (from your `.env` file)
3. A **JWT Secret** (any strong random text of your choice, e.g. `super_secret_cafe_jwt_key`)
4. A **Google Client ID** (optional, use your existing credentials or set to a placeholder value)

---

## 2. Deploy using Render Blueprint

1. Go to the [Render Dashboard](https://dashboard.render.com/) and sign in.
2. Click the **New** button in the top right corner and select **Blueprint**.
3. Link your GitHub account if you haven't already, then search for and select your repository: **`charanb9880/odoo_cpt_final`**.
4. In the Blueprint initialization page:
   * **Service Group Name**: Pick a name (e.g. `odoo-pos-cafe`).
   * **Branch**: Select `main`.
5. Render will automatically read the `render.yaml` configuration and prompt you for the required environment variables:
   * **`MONGO_URI`**: Paste your MongoDB connection string.
   * **`JWT_SECRET`**: Enter a random secret string.
   * **`GOOGLE_CLIENT_ID`**: Paste your client ID (or use a placeholder if you don't need Google Sign-In).
   * **`BREVO_API_KEY`**: Paste your Brevo key (`xkeysib-...`).
6. Click **Apply**.

---

## 3. Deployment Flow

Render will initiate two deployments:
1. **`pos-backend`** (Web Service):
   * Builds the backend server using TypeScript compiling.
   * Exposes port `5001`.
2. **`pos-frontend`** (Static Site):
   * Installs packages and builds Vite static assets.
   * Publishes the client directory's `/dist` folder.
   * Automatically references the generated backend service URL under `VITE_API_BASE_URL` so they communicate natively.

Once both deployments are marked as **`Live`**, you are fully hosted! You will get a custom URL like `https://pos-frontend-xxxx.onrender.com` that anyone can open to order and test.

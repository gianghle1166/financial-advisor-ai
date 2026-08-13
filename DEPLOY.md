# Deploy to GitHub & Vercel

## Step 1: Push to GitHub

### 1.1 Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repo (e.g. `financial-advisor-ai`)
3. Set it to **Private** (recommended, since it's a personal project)
4. Do NOT initialize with a README (you already have one)
5. Click **Create repository**

### 1.2 Connect your local project to GitHub

Open a terminal in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/financial-advisor-ai.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

> If prompted to log in, use your GitHub credentials or a [personal access token](https://github.com/settings/tokens).

---

## Step 2: Deploy to Vercel

### 2.1 Connect Vercel to your repo

1. Go to [vercel.com](https://vercel.com) and sign in (use "Continue with GitHub")
2. Click **Add New...** > **Project**
3. Find and select your `financial-advisor-ai` repository
4. Vercel will auto-detect it as a Next.js project — no config changes needed
5. Click **Deploy**
6. Wait for the build to finish (usually 1-2 minutes)

### 2.2 Get your live URL

Once deployed, Vercel gives you a URL like:
```
https://financial-advisor-ai-xxxxx.vercel.app
```

Your app is now live, but the AI features won't work yet — you need to add your API key.

---

## Step 3: Add your Google API key in Vercel

### 3.1 Open project settings

1. In your Vercel dashboard, click on your project
2. Go to **Settings** > **Environment Variables**

### 3.2 Add the key

| Field       | Value                        |
|-------------|------------------------------|
| Key         | `GOOGLE_API_KEY`             |
| Value       | Your actual API key (e.g. `AQ...`) |
| Environment | Select all: Production, Preview, Development |

3. Click **Save**

### 3.3 Redeploy to apply

Environment variables only take effect on new deployments:

1. Go to the **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Wait for it to finish

Your AI features (personalized advice + chat) are now live.

---

## Updating your code later

After making changes locally:

```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel automatically redeploys on every push to `main`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI advice shows generic/templated text | Check that `GOOGLE_API_KEY` is set in Vercel Environment Variables and you redeployed |
| Build fails on Vercel | Run `npm run build` locally first to catch errors |
| 503 errors in production | Gemini is temporarily overloaded — it auto-retries; usually resolves in minutes |
| Chat not working | Ensure the env var is set for all environments (Production + Preview) |

# Boardroom-AI Cloudflare Deployment & Zero-Trust Security Guide

This guide describes how to deploy the frontend to **Cloudflare Pages** and configure a secure **Cloudflare Tunnel (`cloudflared`)** for the backend. 

By using a tunnel, your backend runs locally or on a private virtual server with **zero open public ports**, completely shielding it from third-party port scanning, brute-forcing, and unauthorized penetration.

---

## 1. Hosting the Next.js Frontend on Cloudflare Pages

### Step 1: Build the Static Assets
Since we configured `output: 'export'` in `next.config.mjs`, Next.js will compile the application into a standalone folder named `out` containing only static HTML/CSS/JS assets.

Run the build command in the project root:
```bash
npm run build
```
Verify that the `out/` folder was successfully created.

### Step 2: Deploy to Cloudflare Pages
You can deploy the static assets directly via wrangler (Cloudflare CLI):
```bash
# Login to Cloudflare Account
npx wrangler login

# Deploy static folder to Pages
npx wrangler pages deploy ./out --project-name=boardroom-ai
```
This will compile and host your frontend on a secure global CDN at a `boardroom-ai.pages.dev` subdomain.

---

## 2. Shielding the Backend with Cloudflare Tunnel (`cloudflared`)

A Cloudflare Tunnel connects your local server (port `8000`) directly to Cloudflare's Edge using egress-only connections. The host firewall blocks *all* inbound traffic, making the server invisible to port scans.

### Step 1: Install the Cloudflare Tunnel Daemon
- **Windows**: Download the `.msi` package from the [Cloudflare Downloads page](https://github.com/cloudflare/cloudflared/releases) and install it.
- **Linux (Debian/Ubuntu)**:
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```

### Step 2: Authenticate cloudflared
Authenticate the CLI on your host machine:
```bash
cloudflared tunnel login
```
This opens a browser window. Select your Cloudflare domain zone to generate the credentials token key.

### Step 3: Create the Secure Tunnel
Create a new named tunnel (e.g. `boardroom-backend`):
```bash
cloudflared tunnel create boardroom-backend
```
*Take note of the Tunnel ID and credentials JSON file path displayed.*

### Step 4: Configure the Tunnel
Create a configuration file named `config.yml` in your `.cloudflared` directory (e.g. `C:\Users\Username\.cloudflared\config.yml` or `/home/user/.cloudflared/config.yml`):

```yaml
tunnel: <TUNNEL_ID_OR_NAME>
credentials-file: /path/to/credentials/json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

### Step 5: Route Subdomain Traffic
Map your DNS subdomain directly to the tunnel:
```bash
cloudflared tunnel route dns boardroom-backend api.yourdomain.com
```

### Step 6: Start the Tunnel (Egress Only)
Run the tunnel daemon:
```bash
cloudflared tunnel run boardroom-backend
```
The FastAPI backend is now securely reachable through the Cloudflare network at `https://api.yourdomain.com`. **No firewall ports need to be opened.**

---

## 3. Configuring Edge-Level WAF Authentication (Zero-Trust)

To ensure that **only you** or authorized stakeholders can access the API or admin panels:

1. Go to your **Cloudflare Dashboard** -> **Zero Trust** -> **Access** -> **Applications**.
2. Click **Add an Application** -> Select **Self-Hosted**.
3. Set the application URL to `api.yourdomain.com` (your backend tunnel address).
4. Configure an **Identity Provider** (e.g. One-time PIN to your corporate emails, Google Workspace OAuth, or an IP Range rule).
5. Save the policy.

Now, any request sent to `api.yourdomain.com` is authenticated at Cloudflare's Edge before traffic is routed to your server. Unauthenticated users are blocked automatically by Cloudflare, ensuring **zero penetration risk**.

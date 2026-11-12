# HomeHunt: Claude finds homes, HomeHunt keeps the shortlist
No AI inside: no AI SDKs, keys, or calls. Claude sends structured data over MCP.

## Deploy (about 10 min)
1. Supabase: new project, SQL editor, run `schema.sql`.
2. Copy the **transaction pooler** connection string (port 6543).
3. Push this folder to GitHub, import it in Netlify. Env vars: `DATABASE_URL`, `SITE_URL` (your Netlify URL).
4. Speed: set Netlify's Functions region to the same region as your Supabase project (Site config, Functions).
5. Open the site, click "Create my shortlist space", copy the MCP link.

## Connect to Claude
Claude.ai: Settings, Connectors, Add custom connector, paste `https://YOUR-SITE/api/mcp/<token>`.

## Reviewer access
The app needs no login: reviewers click "Create my shortlist space". Or share one account via `https://YOUR-SITE/login/<token>`.

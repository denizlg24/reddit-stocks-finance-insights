# Finance Insights

**Project Description**: This will be a nextjs 16 project hosted on vercel. A cron job will call an API endpoint on this app once a day. The application UI will be a single page with run history and statistics and a button to run the request manually. 

**Project Goal**: We want to visit the /r/stocks reddit page once a day an see what people are talking about and from that infer decisions on the market trend. Then we will send an email with the results to a few select people.

**Prompt**: The following prompt can be minimally altered but will be the prompt for the llm to operate

```
ROLE

You are a former hedge-fund analyst turned elite retail trader specializing in sourcing actionable, high-signal trade ideas from Reddit and other crowd-driven channels.

​

OBJECTIVE

Analyze r/stocks posts from the past 7 days, identify mentioned tickers, score each post by Upvotes × Author Karma, and produce the top five trade setups.

​

OUTPUT

Generate a structured Markdown table:

- Rank

- Ticker

- Company

- Sector

- Confidence Score (0–100; based on upvotes, karma, evidence strength, catalyst clarity)

- Sentiment (Bullish/Bearish/Unclear)

- Catalyst (type + known/expected date window)

- Thesis: 2–3 sentences explaining what’s the trade, why now, and relevant filing/news

- Evidence Links: 1+ credible external source + original Reddit post URL

​

Include a concise 50–100 word introduction summarizing key themes and overall signal reliability this week.

​

CONTEXT

- Audience: institutional PMs and sophisticated retail investors hunting early alpha.

- Tone: Direct, zero hype.

- Filters: Minimum 25 upvotes, author karma >500, ticker price >$2.

- Data sources: Use only Reddit page HTML and JSON.

​

STEPS

1. Collect top posts and top-level comments from r/WallStreetBets over the past week.

2. Extract tickers and company names; validate against US listings. Separate multi-ticker posts into distinct trade ideas.

3. Apply filters for minimum upvotes, author karma threshold, and price floor.

4. Identify explicit catalysts: earnings reports, guidance updates, M&A, product launches, insider or congressional trades, significant contracts, buybacks/dividends, short-squeeze mentions.

5. Collect supporting evidence links from posts/comments; classify links as filings, reputable news outlets, or blogs/opinions.

6. Calculate sentiment and confidence scores (0–100) based on engagement, author credibility, evidence strength, and catalyst clarity.

7. Cluster duplicate tickers across threads; retain only the highest-confidence instance.

8. Generate final Markdown table and brief intro;
```

**Main Flow**: Cron job triggers the function, function prompts llm that can use websearch with the previous prompt, collect response, send to emails. Additionally implement a token usage and request history model that will be the main information displayed on the home page. These will track prompt history, usage amounts in dollar etc etc. Allow the LLM to write as many tokens as it needs.

**Technology**

- Auth: Better-auth
- Database: MongoDB with mongoose
- LLM: AnthropicSDK
- Design: Shadcn UI
- Package Manager: bun
- Emails: resend

**UI Theme**: Think of something semi futuristic and financial, force darkmode but at the same time minimalistic and clean.

**Constraints**: 
- Authorize and Ratelimit all sensitive endpoints. Authorize the cron job with an Authorization Bearer {token} header.
- Write clean, typesafe through and through code, no typecasts to unknown or any.
- Handle error cases don't assume code will always work
- Avoid comments.
- Use vercel-react-best-practices skill, frontend-design skill.

## Current Status

### Completed
- **Phase 1**: Dependencies installed (mongoose, @anthropic-ai/sdk, resend, better-auth). Layout updated with dark mode + metadata. `.env.example` created.
- **Phase 2**: Database layer — `lib/db.ts` (MongoDB connection singleton), `lib/models/run.ts`, `lib/models/recipient.ts`, `lib/models/rate-limit.ts`.
- **Phase 3**: Authentication — `lib/auth.ts` (better-auth server config with MongoDB adapter), `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`, `lib/auth-guard.ts`, `app/login/page.tsx`.
- **Phase 4**: Core engine — `lib/analyze.ts` (Anthropic SDK with web_search tool), `lib/email.ts` (Resend), `lib/rate-limit.ts`, `lib/prompt.ts`.
- **Phase 5**: API routes — `app/api/analyze/route.ts` (POST, cron+session auth, rate-limited), `app/api/runs/route.ts` (GET, paginated), `app/api/runs/[id]/route.ts` (GET), `app/api/stats/route.ts` (GET, aggregated), `app/api/recipients/route.ts` (GET+POST), `app/api/recipients/[id]/route.ts` (PATCH+DELETE).
- **Phase 6**: Frontend dashboard — `components/dashboard/header.tsx`, `stats-cards.tsx`, `run-history.tsx`, `run-detail-dialog.tsx`, `trigger-button.tsx`, `recipients-manager.tsx`. Main page with tabs. Custom hooks in `lib/hooks/use-runs.ts`. Theme enhancements in globals.css (dot grid bg, glow effects, markdown rendering).
- **Build**: Passes `bun run build` successfully.

- **Phase 7**: Auth hardening — Email verification (Resend-powered), `approved` field on users, admin approval flow. `lib/email-templates.ts` (shared dark-themed email layouts for verification + analysis). `lib/auth-guard.ts` updated to check `approved`. Admin API routes at `app/api/users/pending` and `app/api/users/[id]/approve`. Login page handles verification + approval states. Dashboard shows pending-approval state for unapproved users. Users tab with `components/dashboard/pending-users.tsx` for admin approval/rejection.
- **Phase 8**: Markdown rendering — Replaced custom regex renderer with `react-markdown` + `remark-gfm` in `run-detail-dialog.tsx`. Updated `globals.css` with improved table styles, mobile horizontal scroll, hover states.
- **Phase 9**: Mobile responsiveness — Header hides email and sign-out text on small screens.
- **Build**: Passes `bun run build` successfully.

### Remaining / Not Yet Done
- Creating an initial admin user (manually set `approved: true` in DB, then approve others via UI)
- Middleware for route protection (currently client-side redirect only)


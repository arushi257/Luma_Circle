# LumaCircle · IITK (Next.js app)

OTP-gated access experience with an explicit admin-approval workflow built on Next.js 16 (app router), React 19, Tailwind CSS 4, and a Supabase-backed realtime community chat.

## Features completed

- OTP login flow locked to IITK addresses (`…@iitk.ac.in`) with 6-digit codes, 10-minute expiry, and dev-only debug code display for testing.
- Admin seeding from env (`ADMIN_EMAILS`, `ADMIN_DOMAIN`); every verified user starts as member unless seeded as admin.
- Member-first admin approval: members request admin access; existing admins list and approve pending requests from the dashboard.
- Simple in-memory stores for OTPs and users (stateless between restarts).
- Themed UI (light/dark toggle), OTP form states, and dashboard copy explaining protected admin controls.
- Dashboard modules (demo data): tone-checker “Sentinel Mirror”, community pulse feed, team matches, lab ratings, resume strength gauge, and market-value range calculator with CPI/skill inputs.
- Realtime community chat under `/safe-space`: sections (Team Match, MentorMesh, Lab Hub, Admin, Unlabeled), user-created chats, join-by-code, Supabase Realtime updates, text + attachment sending via Supabase Storage (`chat-uploads` bucket).

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Environment variables

Create `.env.local` (or use `env.example` as a template):

- `ADMIN_EMAILS` — optional, comma-separated list of admin emails to seed.
- `ADMIN_DOMAIN` — optional domain (e.g., `iitk.ac.in`) to auto-seed admins on verify.
- `OTP_SECRET` — shared secret for signing OTP cookies.
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anonymous key for client access.
- `SUPABASE_SERVICE_ROLE_KEY` — optional; use for server-side admin actions if added later.

## Supabase chat setup

1) Create a Supabase project; grab `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
2) Apply migration `supabase/migrations/20260102_chat.sql` (tables, open RLS policies, storage bucket `chat-uploads`).  
3) Confirm a public storage bucket named `chat-uploads` exists (migration inserts it).  
4) Start the app, verify via OTP, and open `/safe-space`. Create a chat, copy its invite code, and join from another browser tab to see realtime updates.

## User & admin flow

1) Enter IITK email → request OTP (`/api/auth/send-otp`).  
2) Submit the 6-digit code → verify (`/api/auth/verify-otp`).  
3) On success, you reach the dashboard:
   - Members can request admin access (one pending request at a time).
   - Admins can view and approve pending requests.

## API surface

- `POST /api/auth/send-otp` — `{ email }`; validates IITK domain, issues OTP (returns `debugCode` in non-prod).
- `POST /api/auth/verify-otp` — `{ email, code }`; verifies OTP, returns role and pending request status.
- `POST /api/users/request-admin` — `{ email }`; member flags an admin request.
- `POST /api/users/pending-approvals` — `{ adminEmail }`; admin-only listing of pending requests.
- `POST /api/users/approve` — `{ adminEmail, targetEmail }`; admin approves a pending request.

## Implementation notes

- OTPs and user records live in memory (`src/lib/otpStore.ts`, `src/lib/userStore.ts`); they reset on server restart and are not production-ready.
- OTP delivery is stubbed; hook up email/SMS before production. Debug codes surface only outside `production`.
- Regex guards enforce IITK emails for auth endpoints; admin endpoints re-check caller role server-side.
- Dashboard cards use mocked data and client-side heuristics (e.g., tone check, pay range); replace with real services/datasets for production.
- Chat relies on Supabase Realtime + Storage:
  - Schema and open policies: `supabase/migrations/20260102_chat.sql`
  - Storage bucket: `chat-uploads` (public)
  - Client: `src/lib/supabaseClient.ts`; chat helpers: `src/lib/chatService.ts`
  - UI: `src/app/safe-space/page.tsx`, components under `src/components/chat/`
  - Sessions use the OTP localStorage key `lc-session`; chat requires a verified session (redirects otherwise).

## Dashboard modules (current demo state)

- Sentinel Mirror: text-area tone check to flag apologetic/minimizing language before sending emails.
- Community Pulse: static anonymous feed of recent posts.
- Team Matches: recommended projects with overlap and availability labels.
- Lab Ratings: inclusivity/safety/comfort scores with CTA to add reviews.
- Resume Optimization: gauge with placeholder “power-verb” suggestions.
- Market Value: CPI + skill-level inputs compute a heuristic monthly range.

## Activity log

- OTP auth: enforced IITK-only emails, added 6-digit OTP issuance, 10‑minute TTL, and dev-only debug codes.
- In-memory state: introduced `src/lib/otpStore.ts`/`src/lib/userStore.ts` with admin seeding plus member request/approval metadata.
- API surface: created `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/users/request-admin`, `/api/users/pending-approvals`, `/api/users/approve` with role gating.
- Dashboard UI: built OTP flow, themed visuals, admin request UI, pending approvals list, tone checker, pulse feed, team match, lab ratings, resume gauge, market-range calculator.
- Supabase chat: added `/safe-space` UI, Supabase client/`chatService`, migration `supabase/migrations/20260102_chat.sql`, realtime chat with sections, create/join by code, text+attachments, storage bucket.
- Environment docs: summarized required env vars, Supabase migration, OTP secret, and chat onboarding steps.
- Documented Supabase + OTP environment variables, migration steps, and chat onboarding checklist.
- Added Supabase-backed realtime community chat (sections, create/join by code, messages, attachments), schema migration, and setup docs.
- Added dashboard demo modules (tone check, pulse, teams, labs, resume gauge, market range).
- Added in-memory user store with admin seeding via `ADMIN_EMAILS` / `ADMIN_DOMAIN`.
- Built OTP issuance/verification with IITK-only validation and debug exposure in dev.

## Shutting down the dev server

- Stop the running dev process with `Ctrl+C` in the terminal.
- If needed, find the pid (`ps aux | grep node`) and `kill <pid>`.

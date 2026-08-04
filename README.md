# Khubrat Link — Admin Console (Vue 3 + Vite)

A Vue 3 / Vite / Tailwind CSS rebuild of the supplied Khubrat HTML designs
(signup wizard + super-admin dashboard), wired to the **Authentication** and
**Companies** modules of the supplied OpenAPI spec only, as requested.

## 1. Getting started

```bash
npm install
cp .env.example .env   # already done for you — just edit the values below
npm run dev             # http://localhost:5173
```

Build for production:

```bash
npm run build           # outputs to /dist
npm run preview         # serve the production build locally
```

### Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the Laravel API, e.g. `https://api.khubratlink.com/api` |
| `VITE_FREE_PLAN_ID` | UUID sent as `plan_id` when a new workspace self-registers (see §4) |
| `VITE_FREE_PLAN_PAYMENT_STATUS` | Value sent as `payment_status` on the same call |

## 2. Project structure

```
src/
├── assets/            khubrat-logo.jpg, auth-bg.jpg, main.css (Tailwind + ported custom styles)
├── components/
│   ├── common/        BaseButton, BaseInput, BaseAlert, AppLogo, LoadingSpinner, ConfirmModal
│   ├── layout/         AuthLayout, AdminLayout, SidebarNav, DashboardHeader
│   └── dashboard/      StatCard, charts, CompaniesTable, CompanyDetailModal, FreezeReasonModal,
│                        RecentCompaniesList, SupportChatWidget
├── composables/
│   └── useTheme.js     local light/dark toggle (no API involved)
├── views/
│   ├── auth/           LoginView, ForgotPasswordView, ResetPasswordView, CompleteFirstLoginView
│   ├── onboarding/      CreateWorkspaceView (step 1), SetupAdminAccountView (step 2)
│   └── dashboard/       DashboardOverviewView, CompaniesListView, PackagesView*, SettingsView
├── router/index.js      routes + auth guards
├── stores/              auth.store.js, companies.store.js, onboarding.store.js  (Pinia)
├── services/            api.js (axios instance), auth.service.js, companies.service.js
└── utils/               validators.js, format.js, chart-setup.js
```

`*` `PackagesView` is a placeholder — see §3.

## 3. What's implemented vs. out of scope

Per your note, **only login operations and Khibrat-company management** are
wired to the real API:

**Implemented (Authentication tag)**
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/complete-first-login`

**Implemented (Companies tag)**
- `POST /api/companies/register` (self-service signup wizard)
- `GET /api/companies` (list, with client-side search/filter)
- `GET /api/companies/{company}` (detail modal)
- `DELETE /api/companies/{company}`
- `POST /api/companies/{company}/freeze`
- `POST /api/companies/{company}/activate`
- `GET /api/companies/stats` (dashboard overview)

**Intentionally not wired up** (present in the spec but out of scope): Company
Policies (leave types, salary rules, payroll currency, attendance/evaluation
policy, holidays), HR Managers, Subscription Plans, and Payments. The sidebar
nav item **"HR Packages Plan"** still exists (`PackagesView.vue`) so the
overall navigation from the original design stays intact, but its screen is a
placeholder rather than a fake integration — it can be built the same way as
`CompaniesListView.vue` once `/api/subscription-plans` is in scope.

The **Settings** tab keeps the parts of the original design that don't need
an API (theme toggle, the mock support chat widget) and shows the
auto-deletion period read-only, sourced from `/api/companies/stats`, since no
endpoint was documented for updating it.

## 4. Where the design and the API spec disagreed

You asked to prioritize the API when it conflicts with the screenshots while
keeping the visual theme. Here's every place that happened, and why:

1. **Signup is a two-step wizard, but only step 2 calls the API.**
   Step 1 (`CreateWorkspaceView`, "Create Your Free Workspace") collects
   `name` + `email` and only stores them in `onboarding.store.js`. Step 2
   (`SetupAdminAccountView`, "Let's set up your admin account") collects the
   rest and fires the single `POST /api/companies/register` call with the
   combined payload, matching the endpoint's actual request shape.

2. **"Industry" was replaced with "Company Address."**
   The register schema requires `address` but has no `industry` field, so
   the field was swapped rather than sent as dead data.

3. **The Password / Confirm Password fields were removed from signup.**
   `POST /api/companies/register` doesn't accept a password. Since the spec
   separately defines `/api/auth/complete-first-login` for a "mandatory
   password change on first login," the working assumption is that
   credentials are issued after registration (e.g. by email) and set for
   real on first sign-in. After a successful registration the app redirects
   to `/login` with a success banner instead of auto-launching a dashboard.

4. **`plan_id` and `payment_status` aren't collected in the UI.**
   Neither screenshot has a plan picker, and `/api/subscription-plans` is out
   of scope here, so both are sent as fixed values from `.env`
   (`VITE_FREE_PLAN_ID`, `VITE_FREE_PLAN_PAYMENT_STATUS`). Replace
   `VITE_FREE_PLAN_ID` with your real "Free" plan UUID before going live.

5. **`must_change_password` is a best guess.**
   The `login` response types `user` as a generic object, so the exact flag
   name used to force `/complete-first-login` isn't documented. `auth.store.js`
   checks `must_change_password`, `force_password_change`, and
   `is_first_login` defensively — confirm the real field with the backend
   and trim `needsPasswordReset()` in `src/stores/auth.store.js` accordingly.

6. **Company list/detail field names are inferred.**
   `GET /api/companies` and `GET /api/companies/{company}` don't document a
   response schema. Field access in `CompaniesTable.vue` and
   `CompanyDetailModal.vue` falls back across a few plausible names
   (`status`/`active`, `package`/`subscription.plan.name`, etc.) — tighten
   these once the real payload shape is confirmed.

7. **The freeze endpoint has no documented request body.**
   The original design prompts the admin for a reason before freezing an
   account, so `companies.service.js` still sends `{ reason }` — most
   Laravel controllers ignore unexpected fields, but double check this
   against the real backend.

8. **The decorative background** on the login/signup screens (small
   connected silhouette icons) was approximated using the supplied network
   photograph with a brand-blue overlay rather than hand-redrawn as SVG, to
   keep this within scope. Colors, blur, translucency, and card layout are
   unchanged from the source screenshots.

## 5. Auth flow summary

```
/login ───────────────► must_change_password? ──► /complete-first-login ──► /dashboard
   │
   ├─ /forgot-password ──► email sent ──► link ──► /reset-password?email=&token=
   │
   └─ "Create one" ──► /signup (step 1) ──► /signup/admin-account (step 2)
                             │                          │
                        stores name/email      POST /companies/register
                                                          │
                                                 /login?registered=true
```

Session (`token`, `user`, `company`) is persisted to `localStorage` and
restored on refresh in `main.js`. The axios instance in `services/api.js`
attaches the bearer token to every request and clears the session on a 401.

## 6. Notes

- Tailwind is configured via PostCSS (not the CDN build the original HTML
  used), with the exact brand colors (`khubrat.blue`, `khubrat.goldLight`,
  `khubrat.goldDark`) lifted from the source file.
- Font Awesome + Google Fonts (Open Sans) are loaded via CDN in `index.html`,
  matching the original.
- Charts use `chart.js` + `vue-chartjs` (installed as npm packages) instead
  of the original CDN `<script>` tag.
- `npm install` and `npm run build` were both verified to complete cleanly
  against this exact file set before delivery.

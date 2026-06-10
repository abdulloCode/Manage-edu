# Manage Edu — CRM Dashboard

Web-based CRM/dashboard for the Manage Edu education platform. Built with React + Vite, used by admins, managers, teachers and students to manage groups, payments, attendance, homework and reports.

## Tech stack

- **React 18** + **Vite** — UI and build tooling
- **React Router v6** — routing, with role-based protected routes (`ProtectedRoute`, `allowedRoles`)
- **Jotai** — lightweight state management (auth, theme, etc.)
- **Axios** — HTTP client with interceptor-based access-token refresh
- **Tailwind CSS** + **DaisyUI** — styling and UI components
- **Framer Motion** — animations
- **Lucide React** — icon set

## Getting started

```bash
npm install
npm run dev       # start local dev server (http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

## Project structure

```
src/
  api/          # axios instance + endpoint wrappers
  components/   # shared UI (Navbar, Sidebar, BottomNav, modals, etc.)
  context/      # React contexts (Auth, Theme, Lang)
  layouts/      # page layouts (DashboardLayout)
  lang/         # i18n dictionaries (uz, en)
  pages/        # route-level pages, grouped by role (admin, manager, teacher, student, user)
  store/        # jotai atoms
```

## Roles & routing

Routes are grouped by role and wrapped in `ProtectedRoute` with an `allowedRoles` list. Dynamic staff roles (`manager`, `supporter`, `assistant`, `staff`) get their navigation built from `pagesToAccess` returned by the API, mapped through `PAGE_COMPONENTS`/`PAGE_PATH`.

Page components are loaded with `React.lazy` + `Suspense` for route-level code splitting, keeping the initial bundle small.

## Authentication

Auth state lives in `AuthContext`/`store/auth` (jotai atoms). The access token is persisted to `localStorage` and refreshed transparently via an axios response interceptor (`callRefresh`). Logging out clears local storage and notifies the API (`/auth/logout`).

## Internationalization

UI strings are stored in `src/lang/uz.js` and `src/lang/en.js`, exposed through `useLang()`/`LangContext`. Add new keys to **both** files when introducing new user-facing text.

## Contributing

- Run `npm run lint` before committing.
- Keep commit messages descriptive (what changed and why), not just "fix" or "update".
- When adding a new page, prefer extracting shared table/modal/form UI into `components/` rather than duplicating markup.

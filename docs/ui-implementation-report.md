# RitualFin UI Implementation Report

## Design sources
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/login/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/painel_(dashboard)_-_com_dados/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/painel_(dashboard)_-_vazio/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/uploads/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/confirmar_(confirm_queue)_pedidos_de_confirmação/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/regras_(rules)_gerenciar_categorias/screen.png
- design/assets/uploads/stitch_painel_dashboard/stitch_painel_dashboard/configurações_(settings)_preferências_da_conta/screen.png

## Screen mapping
- Login -> /login -> apps/web/app/(auth)/login/page.tsx
- Dashboard (empty + with data) -> /painel -> apps/web/app/(app)/painel/page.tsx
- Uploads -> /uploads -> apps/web/app/(app)/uploads/page.tsx
- Confirm queue -> /confirmar -> apps/web/app/(app)/confirmar/page.tsx
- Rules -> /regras -> apps/web/app/(app)/regras/page.tsx
- Settings -> /configuracoes -> apps/web/app/(app)/configuracoes/page.tsx

## Screen descriptions
- Login: centered card, brand lockup, Google button, email + password fields, primary CTA, signup link, optional dev autologin button.
- Dashboard (empty): single hero card with illustration placeholder, CTA to upload, helper links to CSV model and how it works.
- Dashboard (with data): top bar with tabs + upload CTA, month selector, KPI cards, donut breakdown by category, recent transactions table, drilldown table, budget editor.
- Uploads: dropzone card with file selection and submit CTA, history table with status pills and counts.
- Confirm queue: KPI cards for pending, unclassified, conflicts; batch action panel with rule creation; table with tags, inline category select, and per-row save.
- Rules: rule creation form, filters row, rules table with badges for category and type.
- Settings: profile summary, export card (month selector + CTA), locale/currency selectors.

## UI kit inventory
- Tokens and layout: apps/web/styles/globals.css
- Button: apps/web/components/ui/Button.tsx
- Card: apps/web/components/ui/Card.tsx
- Badge: apps/web/components/ui/Badge.tsx
- Tag: apps/web/components/ui/Tag.tsx
- Input: apps/web/components/ui/Input.tsx
- Select: apps/web/components/ui/Select.tsx
- Table: apps/web/components/ui/Table.tsx
- Empty state: apps/web/components/ui/EmptyState.tsx
- Filter bar: apps/web/components/ui/FilterBar.tsx
- CTA panel: apps/web/components/ui/Cta.tsx
- Tabs: apps/web/components/ui/NavTabs.tsx

## Token summary
- Colors: primary #22c55e, primary-strong #16a34a, surfaces #ffffff / #f4f7f3, text #111418, border #e5ede6
- Radii: sm 8px, md 12px, lg 16px
- Shadow: 0 12px 24px rgba(17, 20, 24, 0.08)
- Font: Inter (loaded in apps/web/styles/globals.css)

## Feature checklist
- Navigation + sidebar: implemented
- Auth UI: implemented
- Dashboard empty state: implemented
- Dashboard data view: implemented (KPI, donut, tables, budgets)
- Upload flow UI: implemented
- Confirm queue UI: implemented
- Rules editor UI: implemented
- Settings UI + export: implemented
- Loading/empty/error states: implemented for data-heavy views (tables + cards)

## Data contracts used
- Tables: profiles, uploads, raw_mm_transactions, transactions, rules, budgets, audit_log
- Functions: mm-import, rules-export-md
- Filters: month range (payment_date), status, needs_review
- Actions: batch update of transactions, create rule, export markdown, export CSV

## Assumptions and gaps
- Tabs map to existing routes: Transacoes -> /confirmar, Orcamento -> /regras.
- Donut chart is CSS-based placeholder (no chart library yet).
- Upload page filter button is visual only (no advanced filters).
- Settings only exposes read-only locale/currency in v1.
- Icons are minimal (no external icon set beyond existing markup).

## Known follow-ups
- Optional: replace CSS donut with real chart component.
- Optional: add pagination to large tables.
- Optional: advanced filters and saved views.

## Professional UI brief (refined)
```
You are the UX + FE lead. Build a production-grade UI that matches the Stitch screens exactly and is fully functional. Use the existing Next.js App Router codebase and deliver reusable components, tokens, and page implementations. All screens must support loading, empty, error, and disabled states, and be keyboard accessible with visible focus styles.

Deliver:
1) UI kit (tokens + Button/Card/Badge/Tag/Input/Select/Table/Tabs/EmptyState/FilterBar/CTA)
2) Full page implementations for /login, /painel (empty + data), /uploads, /confirmar, /regras, /configuracoes
3) Data-driven behavior wired to Supabase tables and functions
4) Documentation: UI implementation report + verification log

Constraints:
- Use Inter font and the Stitch green palette.
- Avoid heavy UI libraries; prefer CSS + existing utilities.
- Align layout, spacing, and hierarchy to the Stitch HTML.
- Guard auth-required routes server-side and keep error copy neutral.

Quality:
- No broken flows.
- No silent errors.
- Responsive across desktop and mobile.
```

## Notes
- No dedicated UI subagent is available in this environment; work was executed directly in the repo.

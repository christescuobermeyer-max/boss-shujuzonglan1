# Mobile Boss Quick View Design

## Goal
Create a mobile-first Web page for the boss to quickly review key monthly operating data on a phone, while leaving the existing desktop/Tauri dashboard unchanged.

## User Decisions
- Use a new independent mobile Web route instead of changing the existing desktop dashboard.
- Route scope: `/mobile` for the quick dashboard and `/mobile/login` for password entry.
- Protect the mobile Web page with the same operational password configured for the desktop app.
- Add a daily repayment list to the mobile page.
- Make the page deployable on Vercel from the GitHub repository.

## Non-Goals
- Do not redesign the existing `/stats` desktop dashboard.
- Do not modify `desktop-tauri/` for this feature.
- Do not add a multi-user account system, roles, admin console, or public registration.
- Do not change MongoDB schemas or monthly statistics formulas.
- Do not write the password, MongoDB connection string, or any real secret into source, docs, tests, or fixtures.

## Architecture
The feature will live in the root Next.js Web app. The existing monthly statistics service remains the source of truth, and the mobile page consumes the same `StatsMonthlyPayload` shape already used by `MonthlyStatsDashboard`.

Authentication must be lightweight and server-side enforced. Use `proxy.ts` plus route-handler checks to protect every Web data surface that can expose internal statistics. Public Vercel deployment must not expose the existing `/stats` page or `/api/stats/monthly` endpoint without a valid mobile session.

`/mobile/login` submits a password to a server-side route, compares it with a server-only environment variable, and sets a signed HTTP-only cookie when valid. Vercel stores the mobile password, session signing secret, and `MONGODB_URI` as environment variables.

The mobile UI should use new mobile-specific components and CSS classes instead of trying to make every existing desktop grid fit a small viewport.

## Routes
- `/mobile/login`: mobile login screen.
- `/mobile`: boss quick view dashboard.
- `/api/mobile/login`: validates password and sets the session cookie.
- Existing `/api/stats/monthly`: reused for data loading and protected by the same Web session.
- Existing `/stats`: not redesigned, but protected by the same Web session when the root Web app is deployed publicly.

## Route Protection Rules
- `GET /mobile/login`: public; if a valid session exists, redirect to `/mobile`.
- `POST /api/mobile/login`: public; validates the submitted password and sets or refuses the session cookie.
- `/mobile` and any future `/mobile/*` child route: require a valid session; otherwise redirect to `/mobile/login`.
- `/stats`: require a valid session in the root Web app; visual behavior remains unchanged after login.
- `/api/stats/monthly`: require a valid session and return `401` with a generic error when unauthenticated.
- Static assets and framework internals must not be matched by the auth proxy.

## Environment Variables
- `MOBILE_DASHBOARD_PASSWORD`: required for `/mobile/login`; value should match the desktop app password.
- `MOBILE_SESSION_SECRET`: required to sign and verify the Web session cookie.
- `MONGODB_URI`: required by the existing monthly stats API.

The desktop app can continue using `TAURI_LOGIN_PASSWORD`. Deployment operators may set both `MOBILE_DASHBOARD_PASSWORD` and `TAURI_LOGIN_PASSWORD` to the same rotated secret value. The Web implementation must not depend on Tauri-specific code, must not read the desktop password from the client, and must not treat any desktop source-code fallback password as the source of truth.

## Session Cookie
- Cookie name: `mobile_dashboard_session`.
- Value: signed token containing issued-at and expiry data.
- Signature: HMAC or equivalent unforgeable signature using `MOBILE_SESSION_SECRET`.
- Attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, production `Secure`, finite max age.
- Expiry: default to 12 hours unless implementation plan chooses a shorter value.
- Invalid, tampered, expired, or unsigned cookies must be treated as unauthenticated.

## Mobile Page Content

### Header
- Brand text: `呈尚策划 · BOSS快看`
- Month picker.
- Update time.
- Clear loading and error state.

### First-Screen KPIs
Show four high-priority cards:
- 本月回款总金额
- 本月武汉回款总金额
- 月总店铺数
- 本月解约数

The first card should be visually dominant. The other three should be compact, readable, and usable without horizontal scrolling.

### Trend Section
Show two phone-sized charts:
- 每日回款趋势
- 每日开单趋势

Charts should use reduced labels and a stable height so the page does not jump while loading.

### Daily Repayment List
Place this section after the trend section and before rankings.

Each daily card shows:
- 日期
- 当日回款总额
- 美团回款
- 饿了么回款
- 武汉回款
- 当日抽点店铺数

Default behavior:
- Build rows from `buildDailySummaryRows`-compatible derived data.
- Sort rows by date descending in the mobile helper.
- Show the latest 7 active summary rows.
- Provide a `展开本月全部` action to show every day in the selected month.
- In this feature, "本月全部" means all active daily summary rows returned by the existing stats-derived data, not synthetic zero-value rows for every calendar day.
- Use vertical cards, not a horizontal table.

Data source:
- Build the cards from the existing daily summary rows derived from `StatsMonthlyPayload`.
- Treat `totalAmount` as the daily repayment total.
- Treat `meituanAmount`, `elemeAmount`, and `wuhanAmount` as the platform and city breakdown values.

### Ranking Section
Show compact top lists:
- 销售开单 Top
- 运营回款 Top
- 解约 Top

Use vertical list cards with rank, name, value, and a small progress indicator. Avoid desktop-style multi-column panels.

Data source:
- 销售开单 Top: sort `stats.salesShopTrend` by `count` descending and take top 5.
- 运营回款 Top: use the existing `buildOperatorAmountRanking` logic from the dashboard and take top 5.
- 解约 Top: use the existing `buildOperatorTerminationRanking(stats.operatorTerminationTrend)` logic and take top 5 by operator.

### Daily Brief
Show the latest 3 daily summary rows plus a compact exception badge derived from `salesInvalidSummary`. This section is secondary and must not push KPIs or the repayment list too far down the page.

## Visual Direction
- Mobile app-like, light business style.
- Keep the existing brand blue as the primary color.
- Use orange to highlight Wuhan-related values.
- Use green for repayment and positive money metrics.
- Prefer large readable numbers, compact labels, and clear section spacing.
- Avoid dense desktop grids, horizontal tables, or charts that require pinch zoom.
- Use responsive CSS with stable card dimensions and no overlapping text.

## Data Flow
1. User opens `/mobile`.
2. Server-side route protection checks the mobile session cookie.
3. If missing or invalid, redirect to `/mobile/login`.
4. After login, `/mobile` loads the selected month.
5. Client fetches authenticated `/api/stats/monthly?month=YYYY-MM`.
6. Mobile-specific helpers derive KPI, chart, repayment list, ranking, and brief data from `StatsMonthlyPayload`.

## Error Handling
- Invalid password: show `密码错误，请重新输入`.
- Missing password config on server: return `登录服务暂不可用`, without exposing environment details.
- Stats API failure: show `数据暂时无法加载，请稍后重试`.
- Unauthenticated stats API request: return HTTP `401` with a generic JSON error.
- Empty data: show empty-state cards rather than blank panels.
- Loading state: use skeleton cards sized like final content.

## Testing Strategy
- Unit-test mobile derivation helpers for KPI values, daily repayment rows, latest-7 behavior, expanded-month behavior, sorting, and empty input.
- Unit-test auth helpers for valid, missing, tampered, expired, and unsigned cookies without exposing the password.
- Unit-test or source-test `proxy.ts` matcher behavior for public login, protected `/mobile`, protected `/stats`, protected `/api/stats/monthly`, and excluded static assets.
- Route-handler tests must cover invalid password, missing server password config, authenticated stats request, and unauthenticated stats request.
- Add source/config tests that ensure the mobile password is read from `MOBILE_DASHBOARD_PASSWORD` and no literal desktop password is present in mobile code.
- Add mobile layout source tests for the presence of `/mobile`, `/mobile/login`, key copy, the daily repayment list, and the daily brief.
- Run existing root `npm run test:unit` after implementation.
- Run `npm run build` after implementation.
- Perform at least one phone-width visual verification at common mobile widths such as 390px and 430px, using browser screenshots or an equivalent viewport check.

## Deployment
Deploy the root Next.js app to Vercel from GitHub.

Vercel configuration requirements:
- Set `MONGODB_URI`.
- Set `MOBILE_DASHBOARD_PASSWORD` to the same password used by the desktop app.
- Set `MOBILE_SESSION_SECRET`.
- Keep secrets in Vercel environment variables only.
- Do not commit `.env.local`.

## Acceptance Criteria
- Opening `/mobile` on a phone-sized viewport shows a password-protected boss quick view.
- The existing desktop-style `/stats` dashboard still works after Web login and is not redesigned.
- Public deployment does not expose `/stats` or `/api/stats/monthly` without authentication.
- A valid password opens `/mobile`; an invalid password shows an error.
- Tampered, missing, or expired session cookies cannot access `/mobile`, `/stats`, or `/api/stats/monthly`.
- First screen clearly shows the four agreed KPIs.
- The page includes daily repayment trend, daily order trend, daily repayment list, rankings, and daily brief.
- The daily repayment list defaults to latest 7 days and can expand to the full selected month.
- The UI is readable on common mobile widths without horizontal page scrolling.
- Vercel deployment can be configured with environment variables, without committing real secrets.

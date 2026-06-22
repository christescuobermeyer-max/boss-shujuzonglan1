# Mobile Boss Quick View Design

## Goal
Create a mobile-first Web page for the boss to quickly review key monthly operating data on a phone, while leaving the existing desktop/Tauri dashboard unchanged.

## User Decisions
- Use a new independent mobile Web route instead of changing the existing desktop dashboard.
- Route scope: `/mobile` for the quick dashboard and `/mobile/login` for password entry.
- Protect the mobile Web page with the same password used by the desktop app.
- Add a daily repayment list to the mobile page.
- Make the page deployable on Vercel from the GitHub repository.

## Non-Goals
- Do not redesign the existing `/stats` desktop dashboard.
- Do not modify `desktop-tauri/` for this feature.
- Do not add a multi-user account system, roles, admin console, or public registration.
- Do not change MongoDB schemas or monthly statistics formulas.
- Do not write the password, MongoDB connection string, or any real secret into source, docs, tests, or fixtures.

## Architecture
The feature will live in the root Next.js Web app. The existing monthly statistics API remains the source of truth, and the mobile page consumes the same `StatsMonthlyPayload` shape already used by `MonthlyStatsDashboard`.

Authentication must be lightweight and server-side enforced. Use `proxy.ts` to protect `/mobile` and `/mobile/login` so unauthenticated visits are redirected before the page renders data. `/mobile/login` submits a password to a server-side route, compares it with a server-only environment variable, and sets an HTTP-only cookie when valid. Vercel stores the mobile password and `MONGODB_URI` as environment variables.

The mobile UI should use new mobile-specific components and CSS classes instead of trying to make every existing desktop grid fit a small viewport.

## Routes
- `/mobile/login`: mobile login screen.
- `/mobile`: boss quick view dashboard.
- `/api/mobile/login`: validates password and sets the session cookie.
- Existing `/api/stats/monthly`: reused for data loading.

## Environment Variables
- `MOBILE_DASHBOARD_PASSWORD`: required for `/mobile/login`; value should match the desktop app password.
- `MONGODB_URI`: required by the existing monthly stats API.

The desktop app can continue using `TAURI_LOGIN_PASSWORD`. Deployment operators may set both `MOBILE_DASHBOARD_PASSWORD` and `TAURI_LOGIN_PASSWORD` to the same value, but the Web implementation must not depend on Tauri-specific code or read the desktop password from the client.

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
- Show the latest 7 daily repayment rows.
- Provide a `展开本月全部` action to show every day in the selected month.
- Sort by date descending.
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
5. Client fetches `/api/stats/monthly?month=YYYY-MM`.
6. Mobile-specific helpers derive KPI, chart, repayment list, ranking, and brief data from `StatsMonthlyPayload`.

## Error Handling
- Invalid password: show `密码错误，请重新输入`.
- Missing password config on server: return `登录服务暂不可用`, without exposing environment details.
- Stats API failure: show `数据暂时无法加载，请稍后重试`.
- Empty data: show empty-state cards rather than blank panels.
- Loading state: use skeleton cards sized like final content.

## Testing Strategy
- Unit-test mobile derivation helpers for KPI values, daily repayment rows, latest-7 behavior, expanded-month behavior, sorting, and empty input.
- Unit-test auth helpers for cookie/session behavior without exposing the password.
- Add source/config tests that ensure the mobile password is read from `MOBILE_DASHBOARD_PASSWORD` and no literal desktop password is present in mobile code.
- Add mobile layout source tests for the presence of `/mobile`, `/mobile/login`, key copy, the daily repayment list, and the daily brief.
- Run existing root `npm run test:unit` after implementation.

## Deployment
Deploy the root Next.js app to Vercel from GitHub.

Vercel configuration requirements:
- Set `MONGODB_URI`.
- Set `MOBILE_DASHBOARD_PASSWORD` to the same password used by the desktop app.
- Keep secrets in Vercel environment variables only.
- Do not commit `.env.local`.

## Acceptance Criteria
- Opening `/mobile` on a phone-sized viewport shows a password-protected boss quick view.
- The existing desktop `/stats` dashboard still works and is not redesigned.
- A valid password opens `/mobile`; an invalid password shows an error.
- First screen clearly shows the four agreed KPIs.
- The page includes daily repayment trend, daily order trend, daily repayment list, rankings, and daily brief.
- The daily repayment list defaults to latest 7 days and can expand to the full selected month.
- The UI is readable on common mobile widths without horizontal page scrolling.
- Vercel deployment can be configured with environment variables, without committing real secrets.

# Mobile Aftersales Person Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `全部 / 梁智 / 朱雯雯 / 冯姗姗` client-side filters to the mobile “售后每日工作” section while preserving its date filter and leaving “运营接手店铺数” unchanged.

**Architecture:** Extend `lib/mobile-work-boards.ts` with a typed filter constant and a pure filtering helper that reuses the existing flattened, time-sorted records. Keep filter state inside `MobileAftersalesDailySection`, render an accessible four-column segmented control, and update only the aftersales CSS and tests.

**Tech Stack:** React 19, Next.js 16, TypeScript 5, Vitest 3, existing mobile CSS.

## Global Constraints

- Do not modify Hono routes, upstream API parameters, payload fields, or request timing.
- Do not modify “运营接手店铺数”, `MobileWorkflowProgressSection`, or workflow helpers.
- Preserve the existing aftersales date input and default-yesterday behavior.
- Preserve each record card’s fields and descending `createdAt` order.
- `全部` must return all records without truncation.
- Person filters must match the effective normalized `operatorName` exactly.
- Use test-first red-green cycles.

---

### Task 1: Add Pure Aftersales Person Filtering

**Files:**
- Modify: `lib/mobile-work-boards.ts`
- Modify: `tests/mobile-work-boards.test.ts`

**Interfaces:**
- Produces: `AFTERSALES_PERSON_FILTERS`, `AftersalesPersonFilter`, and `filterAftersalesRecords(payload, person)`.
- Consumed by: `MobileAftersalesDailySection` in Task 2.

- [ ] **Step 1: Write failing filtering tests**

Add imports:

```ts
import {
  AFTERSALES_PERSON_FILTERS,
  filterAftersalesRecords
} from "@/lib/mobile-work-boards";
```

Add a fixture with records for 梁智、朱雯雯、冯姗姗 and one record whose own name is empty but whose outer employee is 朱雯雯. Assert:

```ts
expect(AFTERSALES_PERSON_FILTERS.map((item) => item.label)).toEqual([
  "全部",
  "梁智",
  "朱雯雯",
  "冯姗姗"
]);
expect(filterAftersalesRecords(payload, "all")).toHaveLength(4);
expect(filterAftersalesRecords(payload, "梁智").map((item) => item.shopName)).toEqual([
  "梁智店"
]);
expect(filterAftersalesRecords(payload, "朱雯雯").map((item) => item.shopName)).toEqual([
  "继承人员店",
  "朱雯雯店"
]);
expect(filterAftersalesRecords(payload, "冯姗姗").map((item) => item.shopName)).toEqual([
  "冯姗姗店"
]);
```

Give `继承人员店` the latest `createdAt` so the expected order also verifies descending time sorting.

- [ ] **Step 2: Verify the tests fail for missing exports**

Run:

```powershell
npx vitest run tests/mobile-work-boards.test.ts
```

Expected: FAIL because `AFTERSALES_PERSON_FILTERS` and `filterAftersalesRecords` do not exist.

- [ ] **Step 3: Implement the typed filter API**

Add to `lib/mobile-work-boards.ts`:

```ts
export const AFTERSALES_PERSON_FILTERS = [
  { value: "all", label: "全部" },
  { value: "梁智", label: "梁智" },
  { value: "朱雯雯", label: "朱雯雯" },
  { value: "冯姗姗", label: "冯姗姗" }
] as const;

export type AftersalesPersonFilter =
  (typeof AFTERSALES_PERSON_FILTERS)[number]["value"];

export function filterAftersalesRecords(
  payload: AftersalesDailyRecordsPayload,
  person: AftersalesPersonFilter
) {
  const records = getRecentAftersalesRecords(payload);
  return person === "all"
    ? records
    : records.filter((record) => record.operatorName === person);
}
```

- [ ] **Step 4: Verify helper tests pass**

```powershell
npx vitest run tests/mobile-work-boards.test.ts
```

Expected: all helper tests pass.

- [ ] **Step 5: Commit the helper**

```powershell
git add lib/mobile-work-boards.ts tests/mobile-work-boards.test.ts
git commit -m "feat: add aftersales person filtering"
```

---

### Task 2: Add the Mobile Segmented Filter UI

**Files:**
- Modify: `components/mobile/mobile-boss-dashboard.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-work-board-layout.test.ts`

**Interfaces:**
- Consumes: `AFTERSALES_PERSON_FILTERS`, `AftersalesPersonFilter`, and `filterAftersalesRecords` from Task 1.
- Produces: an accessible four-option filter inside `MobileAftersalesDailySection`.

- [ ] **Step 1: Write failing source assertions**

Extend `tests/mobile-work-board-layout.test.ts`:

```ts
it("售后每日工作提供固定人员筛选且不修改运营工作板块", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
    "utf8"
  );
  expect(source).toContain("AFTERSALES_PERSON_FILTERS");
  expect(source).toContain("filterAftersalesRecords");
  expect(source).toContain('useState<AftersalesPersonFilter>("all")');
  expect(source).toContain('aria-pressed={selectedPerson === filter.value}');
  expect(source).toContain("该人员当日暂无售后记录");
  expect(source).toContain("MobileWorkflowProgressSection");
  expect(source).toContain("buildWorkflowProgressRows");
});
```

Also assert the stylesheet contains `.mobile-aftersales-person-filter` and `.mobile-aftersales-person-button`.

- [ ] **Step 2: Verify the UI test fails**

```powershell
npx vitest run tests/mobile-work-board-layout.test.ts
```

Expected: FAIL because the filter UI is not rendered.

- [ ] **Step 3: Update imports and local state**

Import:

```ts
AFTERSALES_PERSON_FILTERS,
filterAftersalesRecords,
type AftersalesPersonFilter,
```

Inside `MobileAftersalesDailySection`, add:

```ts
const [selectedPerson, setSelectedPerson] =
  useState<AftersalesPersonFilter>("all");
const filteredRecords = filterAftersalesRecords(daily, selectedPerson);
```

Remove `buildAftersalesEmployeeRows` usage and the existing employee summary grid. Do not change the parent dashboard state, date request effect, or workflow section.

- [ ] **Step 4: Render the segmented filter after the date input**

Add:

```tsx
<div className="mobile-aftersales-person-filter" aria-label="筛选售后人员">
  {AFTERSALES_PERSON_FILTERS.map((filter) => (
    <button
      type="button"
      className="mobile-aftersales-person-button"
      aria-pressed={selectedPerson === filter.value}
      onClick={() => setSelectedPerson(filter.value)}
      key={filter.value}
    >
      {filter.label}
    </button>
  ))}
</div>
```

Change the title count to `filteredRecords.length`. Render all `filteredRecords` with the existing `AftersalesRecordCard`. Use:

```tsx
<div className="mobile-empty">
  {selectedPerson === "all"
    ? "所选日期暂无售后记录"
    : "该人员当日暂无售后记录"}
</div>
```

- [ ] **Step 5: Add stable four-column mobile styles**

Add to `app/globals.css`:

```css
.mobile-aftersales-person-filter {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 12px;
}

.mobile-aftersales-person-button {
  min-width: 0;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  color: var(--text-muted);
  padding: 0 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.mobile-aftersales-person-button[aria-pressed="true"] {
  border-color: #000000;
  background: #000000;
  color: #ffffff;
}
```

- [ ] **Step 6: Run focused UI tests**

```powershell
npx vitest run tests/mobile-work-board-layout.test.ts tests/mobile-work-boards.test.ts
```

Expected: both files pass.

- [ ] **Step 7: Commit the UI**

```powershell
git add components/mobile/mobile-boss-dashboard.tsx app/globals.css tests/mobile-work-board-layout.test.ts
git commit -m "feat: filter mobile aftersales records by person"
```

---

### Task 3: Full Regression and Mobile Verification

**Files:**
- Verify only: active mobile source, tests, build output.

**Interfaces:**
- Consumes: completed helper and UI.
- Produces: evidence that the mobile page remains buildable and the workflow panel is unchanged.

- [ ] **Step 1: Run all tests**

```powershell
npm run test:unit
```

Expected: zero failed tests.

- [ ] **Step 2: Run TypeScript and builds**

```powershell
npm run typecheck
npm run build
```

Then from `server/boss-shuju`:

```powershell
npm run build
```

Expected: all commands exit `0`.

- [ ] **Step 3: Verify the workflow section was not changed**

```powershell
git diff HEAD~2 -- components/mobile/mobile-boss-dashboard.tsx | Select-String -Pattern "MobileWorkflowProgressSection|buildWorkflowProgressRows" -Context 3,3
```

Expected: no changed lines inside the workflow component or its rendering call.

- [ ] **Step 4: Verify 390px and 430px layouts**

Run the production server and use Playwright to inspect `/mobile` with an authenticated session when available. Confirm:

- four filter buttons remain on one line;
- selected state is visible;
- date input is unchanged;
- no horizontal scrolling;
- record cards do not overlap;
- browser console has zero new errors.

If an authenticated session is unavailable, verify the source/CSS tests and document that dashboard visual verification could not be completed locally.

- [ ] **Step 5: Final commit if verification required a tested correction**

Do not create an additional commit when all checks pass without changes.

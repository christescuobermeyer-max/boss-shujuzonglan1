# Mobile Aftersales Filter Shop Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the current date's deduplicated shop count above each mobile aftersales person filter label.

**Architecture:** Add a pure helper in `lib/mobile-work-boards.ts` that reuses normalized aftersales records and returns counts keyed by the existing filter values. Consume the counts inside `MobileAftersalesDailySection` and render each filter button as a stable two-line layout without changing requests, record filtering, or the workflow panel.

**Tech Stack:** React 19, Next.js 16, TypeScript 5, Vitest 3, existing mobile CSS.

## Global Constraints

- Do not modify API routes, request parameters, request timing, or backend code.
- Do not modify `MobileWorkflowProgressSection` or “运营接手店铺数”.
- Preserve the existing date filter, default-yesterday behavior, person filtering, record order, and empty states.
- Deduplicate shops by trimmed non-empty `merchantId`, falling back to trimmed non-empty `shopName`.
- Records without either identifier do not contribute to shop counts.
- `all` deduplicates globally across all operators.
- Keep all four buttons on one row at 390px and 430px widths.

---

### Task 1: Add Deduplicated Shop Count Helper

**Files:**
- Modify: `lib/mobile-work-boards.ts`
- Test: `tests/mobile-work-boards.test.ts`

**Interfaces:**
- Consumes: `AftersalesDailyRecordsPayload`, `AftersalesPersonFilter`, `AFTERSALES_PERSON_FILTERS`, and `filterAftersalesRecords(payload, person)`.
- Produces: `getAftersalesShopCounts(payload): Record<AftersalesPersonFilter, number>`.

- [ ] **Step 1: Write the failing helper test**

Import `getAftersalesShopCounts` and add a test payload containing:

- two 梁智 records with the same `merchantId`;
- one 朱雯雯 record sharing that `merchantId`, proving `all` deduplicates across people;
- two 冯姗姗 records with empty `merchantId` and the same trimmed `shopName`;
- one record with both identifiers empty.

Assert:

```ts
expect(getAftersalesShopCounts(payload)).toEqual({
  all: 2,
  梁智: 1,
  朱雯雯: 1,
  冯姗姗: 1
});
```

- [ ] **Step 2: Run the helper test and verify RED**

Run:

```powershell
npx vitest run tests/mobile-work-boards.test.ts
```

Expected: FAIL because `getAftersalesShopCounts` is not exported.

- [ ] **Step 3: Implement the minimal counting helper**

Add:

```ts
export type AftersalesShopCounts = Record<AftersalesPersonFilter, number>;

function getAftersalesShopKey(record: AftersalesRecord) {
  const merchantId = String(record.merchantId ?? "").trim();
  if (merchantId) return `merchant:${merchantId}`;

  const shopName = String(record.shopName ?? "").trim();
  return shopName ? `name:${shopName}` : "";
}

function countUniqueAftersalesShops(records: AftersalesRecord[]) {
  return new Set(records.map(getAftersalesShopKey).filter(Boolean)).size;
}

export function getAftersalesShopCounts(
  payload: AftersalesDailyRecordsPayload
): AftersalesShopCounts {
  return Object.fromEntries(
    AFTERSALES_PERSON_FILTERS.map(({ value }) => [
      value,
      countUniqueAftersalesShops(filterAftersalesRecords(payload, value))
    ])
  ) as AftersalesShopCounts;
}
```

- [ ] **Step 4: Run the helper test and verify GREEN**

Run:

```powershell
npx vitest run tests/mobile-work-boards.test.ts
```

Expected: all tests in the file pass.

---

### Task 2: Render Counts Above Filter Names

**Files:**
- Modify: `components/mobile/mobile-boss-dashboard.tsx`
- Modify: `app/globals.css`
- Test: `tests/mobile-work-board-layout.test.ts`

**Interfaces:**
- Consumes: `getAftersalesShopCounts(daily)` and `AftersalesShopCounts` behavior from Task 1.
- Produces: `.mobile-aftersales-person-count` and `.mobile-aftersales-person-label` elements inside each existing filter button.

- [ ] **Step 1: Write the failing layout assertions**

Add assertions:

```ts
expect(source).toContain("getAftersalesShopCounts");
expect(source).toContain("shopCounts[filter.value]");
expect(source).toContain('className="mobile-aftersales-person-count"');
expect(source).toContain('className="mobile-aftersales-person-label"');
expect(styles).toContain(".mobile-aftersales-person-count");
expect(styles).toContain(".mobile-aftersales-person-label");
```

- [ ] **Step 2: Run the layout test and verify RED**

Run:

```powershell
npx vitest run tests/mobile-work-board-layout.test.ts
```

Expected: FAIL because the count helper and two-line elements are not used.

- [ ] **Step 3: Update the mobile component**

Import `getAftersalesShopCounts`. Inside `MobileAftersalesDailySection`, derive:

```ts
const shopCounts = getAftersalesShopCounts(daily);
```

Replace the button label with:

```tsx
<span className="mobile-aftersales-person-count">
  {formatMobileCount(shopCounts[filter.value])}店
</span>
<span className="mobile-aftersales-person-label">{filter.label}</span>
```

Keep the existing button click handler, `aria-pressed`, key, and four-column container unchanged.

- [ ] **Step 4: Add stable two-line button styles**

Update the button and add:

```css
.mobile-aftersales-person-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  height: 50px;
}

.mobile-aftersales-person-count {
  max-width: 100%;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-aftersales-person-label {
  max-width: 100%;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

Retain the existing border, colors, padding, selected state, and `white-space: nowrap` behavior.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
npx vitest run tests/mobile-work-board-layout.test.ts tests/mobile-work-boards.test.ts
```

Expected: both test files pass.

---

### Task 3: Regression Verification And Delivery

**Files:**
- Verify: all changed source and test files.

**Interfaces:**
- Consumes: completed helper and UI.
- Produces: a verified commit on `main` pushed to `origin/main`.

- [ ] **Step 1: Run all unit tests**

```powershell
npm run test:unit
```

Expected: zero failed tests.

- [ ] **Step 2: Run type checking and production build**

```powershell
npm run typecheck
npm run build
```

Expected: both commands exit `0`.

- [ ] **Step 3: Check scope and formatting**

```powershell
git diff --check
git diff -- components/mobile/mobile-boss-dashboard.tsx | Select-String -Pattern "MobileWorkflowProgressSection|buildWorkflowProgressRows" -Context 2,2
```

Expected: no formatting errors and no changed lines inside the workflow component.

- [ ] **Step 4: Commit the implementation**

```powershell
git add lib/mobile-work-boards.ts tests/mobile-work-boards.test.ts components/mobile/mobile-boss-dashboard.tsx app/globals.css tests/mobile-work-board-layout.test.ts
git commit -m "feat: show shop counts in aftersales filters"
```

- [ ] **Step 5: Push main**

```powershell
git push origin main
```

Expected: the implementation and its design/plan commits are present on `origin/main`.

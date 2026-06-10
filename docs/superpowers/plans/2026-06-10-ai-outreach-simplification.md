# AI Outreach Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace template/profile-based outreach drafting with a source-email rewrite flow and simplify Settings to API configuration only.

**Architecture:** Keep compatibility tables and old IPC handlers, but remove them from active UI and the new draft generation path. The renderer sends `{ advisorId, sourceEmail }`; the main process loads advisor context, builds rewrite prompts, calls the configured OpenAI-compatible API, and stores `EmailDraft`.

**Tech Stack:** Electron main/preload IPC, React 18, Zustand store, Prisma/SQLite, Vitest.

---

### Task 1: Prompt Utility And Store Contract

**Files:**
- Modify: `src/lib/aiOutreach.ts`
- Modify: `src/lib/aiOutreach.test.ts`
- Modify: `src/stores/appStore.ts`
- Modify: `src/stores/appStore.aiOutreach.test.ts`
- Modify: `electron/preload/index.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: Write failing prompt utility test**

Add a test in `src/lib/aiOutreach.test.ts` that calls `buildEmailDraftMessages` with `sourceEmail: '原始套磁信正文'` and expects the joined prompt to include the source email, advisor insight, and no `邮件模板` / `我的背景` labels.

- [ ] **Step 2: Run prompt test and verify failure**

Run: `npx vitest run src/lib/aiOutreach.test.ts`

Expected: FAIL because `buildEmailDraftMessages` does not accept `sourceEmail` yet.

- [ ] **Step 3: Update prompt utility**

Change `buildEmailDraftMessages` input to use `sourceEmail: string` instead of `profile` and `template`. Prompt requirements: preserve true facts from pasted email, personalize with advisor context and insight, do not fabricate, output strict JSON.

- [ ] **Step 4: Run prompt test and verify pass**

Run: `npx vitest run src/lib/aiOutreach.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing store contract test**

Update `src/stores/appStore.aiOutreach.test.ts` so `generateEmailDraft` is called with `{ advisorId: 'a1', sourceEmail: '原信' }` and expects `window.api.emailDraft.generate` to receive that object.

- [ ] **Step 6: Run store test and verify failure**

Run: `npx vitest run src/stores/appStore.aiOutreach.test.ts`

Expected: FAIL due type/contract mismatch if old `templateId` assumptions remain.

- [ ] **Step 7: Update renderer/preload/env types**

Change `EmailDraft.generate` request types in `src/stores/appStore.ts`, `electron/preload/index.ts`, and `src/env.d.ts` to `{ advisorId: string; sourceEmail: string }`.

- [ ] **Step 8: Run store test and verify pass**

Run: `npx vitest run src/stores/appStore.aiOutreach.test.ts`

Expected: PASS.

### Task 2: Main Process Draft Generation

**Files:**
- Modify: `electron/main/index.ts`

- [ ] **Step 1: Inspect existing handler**

Read `emailDraft:generate` and identify all dependencies on `PersonalProfile`, `EmailTemplate`, `templateId`, and fallback template.

- [ ] **Step 2: Replace handler contract**

Update `emailDraft:generate` to read `sourceEmail`, reject blank input, load advisor with institution and insight, call `buildEmailDraftMessages({ advisor, institution, sourceEmail, insight, systemPrompt })`, and save `templateId: null`.

- [ ] **Step 3: Preserve compatibility**

Do not remove `EmailTemplate`, `EmailVariable`, `PersonalProfile`, backup, import, or clear handlers.

- [ ] **Step 4: Typecheck main path**

Run: `npx tsc -b`

Expected: exit 0, or only pre-existing unrelated project-reference warnings if already present.

### Task 3: AI Outreach Assistant UI

**Files:**
- Modify: `src/components/features/AiOutreachAssistant.tsx`
- Modify: `src/components/features/AiOutreachWorkspace.tsx`

- [ ] **Step 1: Remove template loading**

Delete `EmailTemplate` import, `emailTemplates`, `loadEmailTemplates`, template state, and template loading effects from `AiOutreachAssistant`.

- [ ] **Step 2: Add source email input**

Add local state `sourceEmail`. In the draft section, replace the template select with a textarea labeled for pasting the existing outreach email.

- [ ] **Step 3: Update generate action**

Validate `sourceEmail.trim()` before calling the store. Call `generateEmailDraft({ advisorId: advisor.id, sourceEmail: sourceEmail.trim() })`.

- [ ] **Step 4: Update visible copy**

Adjust helper text to encourage generating advisor insight first and to explain that the pasted email is the factual basis.

- [ ] **Step 5: Run focused tests**

Run: `npx vitest run src/lib/aiOutreach.test.ts src/stores/appStore.aiOutreach.test.ts`

Expected: PASS.

### Task 4: Navigation And Settings Simplification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/features/Settings.tsx`
- Modify: `src/stores/appStore.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: Remove Email Templates route from UI**

Remove `EmailTemplates` import and the `templates` route case from `src/App.tsx`. Remove `templates` from `View` unions used by `src/stores/appStore.ts` and `src/components/layout/Sidebar.tsx`. Remove the sidebar item and unused `Mail` icon import.

- [ ] **Step 2: Simplify Settings imports and state**

In `Settings.tsx`, remove theme/color/update/data/contact/personal-profile imports, state, effects, and handlers. Keep only mounted handling if needed, `aiConfig`, `loadAiConfig`, `saveAiConfig`, `testAiConfig`, `aiForm`, `aiSaving`, and `aiTesting`.

- [ ] **Step 3: Simplify Settings render**

Render the page title and one card for AI API configuration. Keep Base URL, model, API Key, system prompt, save button, and test button. Remove Temperature and Max Tokens from visible UI; save defaults internally as `0.4` and `2000`.

- [ ] **Step 4: Keep compatibility types only where needed**

Do not remove backup or old IPC types unless the compiler reports unused local imports. Leave old table-backed APIs in preload/env if keeping them avoids larger compatibility churn.

- [ ] **Step 5: Run full verification**

Run:

```powershell
npx vitest run
npx tsc -b
```

Expected: tests pass and typecheck exits 0, or any failure is investigated and fixed before completion.

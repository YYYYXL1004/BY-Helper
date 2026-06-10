# AI Outreach Simplification Design

## Goal

Simplify the outreach workflow around the user's actual process:

1. Pick a target advisor.
2. Add public advisor URLs and generate an advisor insight.
3. Paste an existing outreach email.
4. Ask AI to rewrite that email for the selected advisor.
5. Save the result as an email draft that can be copied or marked sent.

## Scope

### Remove From Active UI

- Remove the Email Templates navigation item.
- Stop rendering the Email Templates page from the main app router.
- Remove template selection from the AI outreach assistant.
- Remove personal background input from Settings.
- Simplify Settings to only show AI API configuration.
- Remove Settings UI for theme selection, color theme, data import/export, data clearing, update controls, and contact information.

### Keep For Compatibility

- Keep existing `EmailTemplate`, `EmailVariable`, and `PersonalProfile` database tables.
- Keep existing backup/import compatibility for old data.
- Keep old IPC handlers unless removing them is required to satisfy type or lint constraints.
- Keep existing `EmailDraft` persistence so generated drafts continue to appear under each advisor.

## New Draft Generation Flow

The AI outreach assistant dialog keeps the advisor source and advisor insight sections. The draft generation section changes to:

- A textarea for the user's existing outreach email.
- A generate button.
- The latest generated draft display, copy action, and mark-sent action.

`emailDraft:generate` accepts:

```ts
{
  advisorId: string
  sourceEmail: string
}
```

It no longer requires a saved personal profile or email template.

## Prompt Behavior

The draft prompt should ask the model to:

- Treat the pasted email as the user's true background and writing baseline.
- Preserve true factual claims from the pasted email.
- Personalize the new email using advisor metadata and generated advisor insight.
- Avoid fabricating papers, admissions slots, achievements, or experience.
- Return strict JSON with `subject`, `content`, `rationale`, and `checklist`.

If advisor insight is missing, draft generation can still run using advisor and institution metadata, but the UI should encourage generating advisor insight first.

## Data Flow

- Renderer sends `advisorId` and `sourceEmail` through `window.api.emailDraft.generate`.
- Main process loads advisor, institution, and optional advisor insight.
- Main process builds rewrite messages and calls the configured OpenAI-compatible API.
- Main process parses JSON, stores a new `EmailDraft`, refreshes institutions through the store, and returns the draft.

## Error Handling

- Empty pasted email is rejected in the UI and main process.
- Missing AI config keeps the existing settings-page error path.
- Invalid AI JSON keeps the existing parse failure behavior.
- Missing advisor returns the existing advisor-not-found error.

## Tests

- Update AI prompt utility tests to cover source-email rewrite messages.
- Update store tests so `generateEmailDraft` forwards `sourceEmail`.
- Update AI outreach component tests if existing coverage references template selection.
- Run the focused test suite and TypeScript typecheck after implementation.

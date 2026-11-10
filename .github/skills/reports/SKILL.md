---
name: reports
description: 'Build and maintain Angular inventory reports using product, purchase, and sales APIs. Use when creating report tables, searchable summaries, filters, or pagination.'
argument-hint: 'Describe the report data and filters'
user-invocable: true
disable-model-invocation: false
---

# Reports

## When to Use

Use this skill for inventory reporting work in the Angular frontend, including combined product, purchase, and sales views.

## Procedure

1. Load report data through `ApiService`; do not call `HttpClient` directly from report components.
2. Flatten invoice items when a table needs one searchable row per invoice or product transaction.
3. Keep report filtering and pagination client-side unless the APIs provide server-side paging.
4. Include loading, empty, and API-error states.
5. Reset pagination to page one when the search term or record type changes.
6. Keep totals and formatted dates within the component; keep API mappings in the component or service.
7. Add the route and sidebar navigation for standalone report components.
8. Build the Angular application and fix TypeScript or template errors.

## Project Conventions

- Reports are standalone Angular components under `frontend/src/app/components/`.
- Component metadata uses `templateUrl` and `styleUrl` when component-specific styles are needed.
- API calls subscribe through RxJS and use explicit change detection only when required by the existing component pattern.
- Preserve the existing INR currency and date formatting conventions.

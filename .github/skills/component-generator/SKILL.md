---
name: component-generator
description: 'Generate Angular standalone components with the default inventory workspace page structure, route, sidebar menu, and navbar integration. Use when creating any new frontend component or page.'
argument-hint: 'Component name, route, menu label, and page purpose'
user-invocable: true
disable-model-invocation: false
---

# Component Generator

## When to Use

Use this skill whenever a new Angular frontend component/page must be created in the paint shop inventory application.

## Generate the Component

1. Derive defaults from the requested name:
   - Angular class: `FeatureNameComponent`
   - Component file: `feature-name.component.ts`
   - Template file: `feature-name.component.html`
   - CSS file: `feature-name.component.css`
   - Route: `/feature-name`
   - Sidebar label: readable feature name
2. Put feature components in `frontend/src/app/components/`.
3. Use a standalone Angular component with external template and CSS files.
4. Import required modules explicitly, such as `CommonModule`, `FormsModule`, or `RouterLink`.
5. Use `templateUrl` and `styleUrl` relative to the component folder.
6. Create a default page using the application conventions:

```html
<section class="page-heading">
  <div>
    <p class="eyebrow">SECTION</p>
    <h2>Page title</h2>
    <p class="muted">Page description.</p>
  </div>
</section>

<section class="panel">
  <h3>Page content</h3>
  <p class="muted">Default page content.</p>
</section>
```

## Integrate the Application Shell

The side menu and top navigation belong to the root shell in `frontend/src/app/app.component.ts`; do not duplicate them inside every generated page.

1. Add a lazy route to `frontend/src/app/app.routes.ts`:

```typescript
{ path: 'feature-name', loadComponent: () => import('./components/feature-name.component').then(m => m.FeatureNameComponent) },
```

2. Add a matching sidebar link to `app.component.ts`:

```html
<a routerLink="/feature-name" routerLinkActive="active">▤ <span>Feature name</span></a>
```

3. Keep the route name and sidebar link synchronized.
4. Preserve the existing API connection status shown by the topbar.
5. Add unique navigation icon and accessible link text.

## Component Template

Start with [component.ts](./assets/component.ts.template), [component.html](./assets/component.html.template), and [component.css](./assets/component.css.template), then replace all placeholders.

## Validation

1. Confirm the route imports the generated component.
2. Confirm the sidebar route points to the same URL.
3. Confirm template and stylesheet paths exist.
4. Confirm component class, selector, and file names follow Angular conventions.
5. Run `npm.cmd run build` from the frontend folder.
6. Fix TypeScript template, route, or navigation errors before completing.

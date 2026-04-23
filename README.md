# @cx-rd/ui-kit

## Documentation

- [Component docs](./docs/components/README.md)
- [Changelog](./CHANGELOG.md)
- [Release process](./RELEASE.md)
- [Architecture notes](./ARCHITECTURE.md)
- [AI generation guide](./AI_GENERATION_GUIDE.md)

## Installation

### 1. Registry Setup

Add the GitHub Packages registry and authentication token to your `.npmrc` before installing the package:

```ini
@cx-rd:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_CLASSIC_TOKEN
```

### 2. Peer Dependencies

This library requires Angular CDK in the consuming project:

```bash
npm install @angular/cdk@21
npm install @cx-rd/ui-kit
```

### 3. Style Integration

Import the library's unified style entry point in your global `styles.scss`:

```scss
@import '@cx-rd/ui-kit/styles/ui-kit';
```

This single import includes:
- Essential CDK overlay styles
- UI-kit design tokens
- Isolated overlay panel configurations

## Component Docs

- [Toast](./docs/components/toast.md): programmatic toast service and viewport stack
- [SelectList](./docs/components/select-list.md): single or multi selection with static or async data
- [DataTable](./docs/components/data-table.md): sortable, selectable, paginated data tables
- [Paginator](./docs/components/paginator.md): standalone pagination controls
- [Stepper](./docs/components/stepper.md): progress steps with selectable current-step animations
- [Timeline](./docs/components/timeline.md): event history, audit trails, and activity feeds

## Overlay Naming Convention

To avoid style pollution, UI-kit uses a `tp-ui-*` prefix for body-appended elements. If you create custom overlays using our tokens, please use:
- `tp-ui-overlay-pane`
- `tp-ui-backdrop`

## Design Tokens

The library provides SCSS variables to maintain consistency. You can override these before importing `ui-kit.scss`:

```scss
$tp-color-primary: #ea580c;
$tp-radius-md: 4px;

@import '@cx-rd/ui-kit/styles/ui-kit';
```

Available modules:
- Colors: `$tp-color-primary`, `$tp-color-secondary`, and related palette tokens
- Radius: `$tp-radius-xs` to `$tp-radius-full`
- Shadows: `$tp-shadow-sm` to `$tp-shadow-xl`
- Spacing: `$tp-spacing-xs` to `$tp-spacing-3xl`
- Responsive Sidebar: collapsible with body-appended flyouts
- Z-Index Tokens: range-based layering from 0 to 1500+
- Unified Layout: `MainLayout` integration

## Known Limitations

- Overlays such as flyouts and modals are appended to the `body` level to escape local stacking contexts.

# @shared/ui-kit

Standardized UI component library for Twilight Kepler projects.

## Installation

### 1. Peer Dependencies
This library requires **Angular CDK**. Ensure it is installed in your project:
```bash
npm install @angular/cdk@19
```

### 2. Style Integration
Import the library's unified style entry point in your global `styles.scss`:
```scss
@import '@shared/ui-kit/styles/ui-kit';
```
This single import includes:
- Essential CDK Overlay styles.
- UI-kit design tokens.
- Isolated overlay panel configurations.

## Overlay Naming Convention
To avoid style pollution, UI-kit uses a `tp-ui-*` prefix for body-appended elements. If you create custom overlays using our tokens, please use:
- **Panel Class**: `tp-ui-overlay-pane`
- **Backdrop Class**: `tp-ui-backdrop`

## Design Tokens
The library provides SCSS variables to maintain consistency. You can override these before importing `ui-kit.scss`:
```scss
// Override example
$tp-color-primary: #ea580c; 
$tp-radius-md: 4px;

@import '@shared/ui-kit/styles/ui-kit';
```

### Available Modules:
- **Colors**: `$tp-color-primary`, `$tp-color-secondary`, etc.
- **Radius**: `$tp-radius-xs` to `$tp-radius-full`.
- **Shadows**: `$tp-shadow-sm` to `$tp-shadow-xl`.
- **Spacing**: `$tp-spacing-xs` to `$tp-spacing-3xl`.
- **Responsive Sidebar**: Collapsible with body-appended flyouts (CDK).
- **Z-Index Tokens**: Range-based layering (0-1500+).
- **Unified Layout**: MainLayout integration.

## Known Limitations
- Overlays (Flyouts, Modals) are appended to the `body` level to escape local stacking contexts.

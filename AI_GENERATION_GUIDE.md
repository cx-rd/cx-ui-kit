# AI Generation Rules (LLM Prompting Guide)

This guide provides explicit instructions for LLMs generating code within the `@shared/ui-kit` library.

---

## Rule 1: Page Generation Target
When creating a "New Screen", ALWAYS place the output in `projects/shared/ui-kit/src/lib/templates/`.

## Rule 2: Component Naming
LLMs MUST use the following naming convention to ensure consistency:
- Templates: Name as `XxxPageComponent` (e.g., `SettingsPageComponent`).
- The directory should be kebab-case: `settings-page`.

## Rule 3: Routing Metadata
Every new Template MUST include a `XXX_ROUTE` constant in its `index.ts` file. 
Example:
```typescript
// index.ts
export * from './your.component';
export const YOUR_SCREEN_ROUTE = 'your-path';
```

## Rule 4: Module Imports
- DO NOT import from deep internal paths. 
- USE the layer barrels when possible (within the lib).
- ALWAYS import shared models from `../../core/models`.
- ALWAYS import shared pipes from `../../core/pipes`.

## Rule 5: Style Consistency
- COMPONENT SCSS must start with: `@import '../../core/styles/tokens/index';`.
- USE the predefined tokens (e.g., `$tp-color-primary`, `$tp-spacing-md`).
- ENSURE the layout is responsive but responsive logic should prioritize CSS Flex/Grid over JS logic.

## Rule 6: Unidirectional Dependency
- **TEMPLATES** can import anything.
- **LAYOUTS** can import from `components` and `core`.
- **COMPONENTS** can ONLY import from `core`.
- **CORE** can import NOTHING from other layers.

---

### Failure to follow these rules will result in architectural debt and broken builds.

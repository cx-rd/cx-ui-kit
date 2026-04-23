# Changelog

All notable changes to `@cx-rd/ui-kit` are documented in this file.

This changelog follows a simple release-oriented format:
- record only consumer-facing package changes
- group entries by released version
- keep unreleased work under `Unreleased` until the next publish

## [Unreleased]

### Added
- Added the standalone `StepperComponent` with horizontal and vertical progress layouts, selectable steps, explicit step states, and configurable `pulse`, `orbit`, `glow`, and `none` current-step animations.
- Added the standalone `DialogComponent` and exported it from the public components entrypoint.
- Added centered modal dialog behavior with configurable title and close controls, backdrop and Escape dismissal options, and open/close transition handling.

### Breaking
- Removed the `indeterminate` field from `DataTableSelectionChange` payloads.
- Removed `SelectListComponent` inline panel mode support, including the `panelMode="inline"` path and related inline-only placement behavior.

### Changed
- Simplified `DataTableComponent` bulk-selection behavior by removing the indeterminate header checkbox state.
- Refined `DataTableComponent` sort indicators with clearer SVG-based ascending and descending icons.
- Refined the default `ToastComponent` visual theme with lighter translucent surfaces, updated borders, and softer glass treatment.
- Updated `StepperComponent` connector progress so completed connector lines animate their filled length instead of switching color instantly.
- Updated `StepperComponent` current marker sizing so the active step scales up and smoothly returns to its default size when another step becomes active.
- Smoothed `StepperComponent` marker and connector transition timing with a shared motion curve.
- Updated collapsed toast stack styling so depth effects are applied more cleanly to the rendered toast cards.

### Fixed
- Fixed `DataTableComponent` footer corner rounding so the footer inherits the table surface radius consistently.
- Updated `SelectListComponent` so the open panel closes when the user clicks outside the panel area.

## [21.1.0] - 2026-04-20

### Added
- Added the standalone `DataTableComponent` with client/manual sorting, client/manual pagination, row selection, page-size controls, range summaries, and templated header/cell rendering.
- Added the standalone `PaginatorComponent` for reusable pagination controls.
- Added public `DataTable` model exports for table columns, sort state, page change payloads, and selection payloads.
- Added inline panel support to `SelectListComponent` through `panelMode` and `inlinePanelPlacement` for embedded layouts that should not render into the global overlay container.

### Changed
- Expanded public exports to include `DataTableComponent`, `PaginatorComponent`, and related `DataTable` model types.
- Updated `SelectListComponent` and related models to use generic typed options, selection payloads, compare functions, and async loader contracts.
- Improved `SelectListComponent` panel lifecycle with animated open/close behavior, smarter inline placement resolution, and inline outside-click dismissal.

### Fixed
- Updated `SelectListComponent` overlay rendering to use the UI-kit overlay pane class consistently.
- Aligned the global CDK overlay container z-index with the UI-kit overlay layer tokens.

## [21.0.1] - 2026-04-17

### Fixed
- Fixed stylesheet index ordering for `@use` imports.

## [21.0.0] - 2026-04-17

### Added
- Added the `SelectList` component on the Angular 21 release line.

### Changed
- Started the Angular 21 package line.
- Updated peer dependency requirements to Angular 21 packages.
- Carried the existing component and template set forward to the Angular 21 line.

## [19.1.0] - 2026-04-16

### Added
- Added the `SelectList` component on the Angular 19 release line.

### Changed
- Published the Angular 19 feature release line before the Angular 21 migration.

## [0.0.5] - 2026-04-13

### Added
- Added the toast component and toast viewport for transient notifications.

## [0.0.4] - 2026-03-13

### Added
- Published the first tagged package release for `@cx-rd/ui-kit`.

### Changed
- Updated the settings page and sidebar details.
- Standardized the package name to `@cx-rd/ui-kit`.

## [0.0.3] - 2026-03-13

### Changed
- Prepared the package for GitHub-hosted distribution.
- Added repository metadata and GitHub Packages publish configuration.
- Continued the Angular 19 line with settings page and sidebar updates.

## [0.0.2] - Historical release

### Changed
- Backfilled a previously published Angular 19 package version.
- Detailed release metadata was not preserved in the current local git history.

## [0.0.1] - 2026-03-12

### Added
- Introduced the initial Angular 19 package baseline.

### Changed
- Renamed the package from `@shared/ui-kit` to `@cx-rd/ui-kit` while still on the first release line.

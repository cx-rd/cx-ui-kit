# Release Process

This document describes the current manual release flow for `@cx-rd/ui-kit`.

## Working Directories

- Git repository: `projects/cx-rd/ui-kit`
- Angular workspace root: `c:\PJ\skills_and_ui-kit_maintence`
- Publish output: `dist/cx-rd/ui-kit`

Use the workspace root for Angular build commands, and use the package directory for git tagging and package metadata edits.

## Versioning Rules

Use Angular-line versioning rather than strict semantic versioning.

- `patch`: bug fixes, regressions, style fixes, and other small corrections
- `minor`: every non-patch package change within the current Angular major line, including new components, API adjustments, refactors, and other consumer-facing updates
- `major`: Angular major upgrades only, such as moving the package from Angular 21 to Angular 22

This means a release can still contain breaking package changes while staying on the same Angular major line. When that happens, document the break very clearly in `CHANGELOG.md` and the GitHub Release notes.

## One-Time Cleanup

The repository already has tags for `v0.0.4` and `v0.0.5`.

The current package version `21.0.1` is documented in `CHANGELOG.md`, but there is no matching git tag yet. If `21.0.1` has already been published, create the missing tag once from `projects/cx-rd/ui-kit`:

```bash
git tag -a v21.0.1 ea42f98 -m "21.0.1"
git push origin v21.0.1
```

Do this only once, and only if that release is already the intended published state.

Historical policy:
- Versions before `21.0.1` are maintained in `CHANGELOG.md` as historical release records.
- Do not backfill old tags or GitHub Releases unless there is a specific operational need.
- Use the full release process in this document for `21.0.1` and all later versions.

## Standard Release Flow

### 1. Start from the correct branch

Release from the branch that owns the version line.

Examples:
- `v21` for Angular 21 maintenance releases
- `main` for the next active development line if that becomes your release branch later

Check status before changing anything:

```bash
git status
git branch --show-current
```

### 2. Decide the next version

Choose the next version before editing files.

Examples:
- `21.0.1` -> `21.0.2` for a bug fix
- `21.0.1` -> `21.1.0` for any other change on the Angular 21 line, including features, API updates, or breaking changes
- `21.0.1` -> `22.0.0` only when upgrading the package to Angular 22

### 3. Update release metadata

Edit these files in `projects/cx-rd/ui-kit`:

- `package.json`
- `CHANGELOG.md`

Release checklist for the edit:
- change `package.json` version to the target release
- move the relevant notes from `Unreleased` into a new version section
- keep entries focused on consumer-facing behavior
- omit internal-only chores unless they affect consumers

### 4. Build the library

Run the library build from the Angular workspace root:

```bash
npm run build -- @cx-rd/ui-kit
```

This produces the publishable package in `dist/cx-rd/ui-kit`.

### 5. Validate the package contents

From the workspace root, inspect the generated package metadata:

```bash
Get-Content dist/cx-rd/ui-kit/package.json
```

Optional dry run from `dist/cx-rd/ui-kit`:

```bash
npm pack --dry-run
```

Use this to confirm the version and published files look correct before a real publish.

### 6. Commit the release metadata

From `projects/cx-rd/ui-kit`, create a release commit:

```bash
git add package.json CHANGELOG.md
git commit -m "release: v21.0.2"
```

Replace `v21.0.2` with the actual release version.

### 7. Create the release tag locally

Still in `projects/cx-rd/ui-kit`:

```bash
git tag -a v21.0.2 -m "21.0.2"
```

Keep the git tag and package version aligned.

### 8. Publish the built package

From `dist/cx-rd/ui-kit`:

```bash
npm publish
```

Notes:
- authentication for GitHub Packages must already exist in your `.npmrc`
- do not edit files inside `dist/cx-rd/ui-kit` manually
- if publish fails, fix the issue before pushing the tag upstream

### 9. Push the branch and tag

After a successful publish, push both the branch and the new tag from `projects/cx-rd/ui-kit`:

```bash
git push origin v21
git push origin v21.0.2
```

Adjust the branch name when releasing from another branch.

### 10. Create the GitHub Release

In GitHub:

- create a Release from tag `v21.0.2`
- use the version title `v21.0.2`
- paste the matching `CHANGELOG.md` section into the release notes

This is what gives each GitHub version page a clean release summary instead of forcing consumers to read raw commits.

## After the Release

After the version is published:

- add new work back under the `Unreleased` section in `CHANGELOG.md`
- continue normal development
- do not retroactively edit an already published release section unless the notes are factually wrong

## Practical Rules

- One version number, one changelog section, one git tag, one GitHub Release
- Keep the tag format consistent: `v<version>`
- Keep commit history technical, but keep changelog entries consumer-oriented
- If a change would force consumers to update code, call it out explicitly in the changelog
- Reserve `major` for Angular major line changes only
- If a `minor` release contains a breaking package change, label it clearly as breaking in both the changelog and GitHub Release

# Contributing to Diwas World Explorer

Thank you for helping improve this portfolio world. Contributions should preserve the **Postcard Archipelago** visual direction: sea-glass water, parchment routes, coral discovery signals, navy ink, and field-guide language.

## Before You Begin

1. Open an issue before a larger gameplay or visual change so the route remains coherent.
2. Fork the repository and create a focused branch, such as `feat/courier-satchel` or `fix/hand-calibration`.
3. Keep third-party assets out of the source tree unless their license and attribution are documented.

## Local Workflow

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
```

Use the `?demo` query mode to reach a deterministic playable route while testing. For example, `/?demo&level=code-city&mode=3d` opens Code City directly.

## Pull Request Checklist

- [ ] The feature works with mouse/touch and keyboard routes.
- [ ] Optional camera features have a non-camera fallback.
- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] New on-screen copy uses clear, field-guide language.
- [ ] New models, sounds, or images include an attribution and compatible license.
- [ ] The change has been checked at a mobile viewport.

## Design Notes

The world should feel **crafted, collectable, and navigable**. When deciding between a generic dashboard pattern and an expedition artifact, choose the artifact: paper, ink, stamp, compass, route, or field note.

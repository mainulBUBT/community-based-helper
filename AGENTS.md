<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project docs

Start with `docs/index.md`: plan, current blockers, feature tracker and rules. Each feature has its own file in `docs/features/`; update its checklist and the tracker when you finish work.

## Coding Style & Architecture Principles for Agents

1. **Follow Existing Style & Architecture:** Always follow the existing project structure (`src/components`, `src/services`, `src/utils`, `src/i18n`, etc.). Never reinvent patterns or introduce alien frameworks/libraries when a native pattern already exists.
2. **Extend Existing Code First:** If a utility, hook, or component already exists, extend it instead of duplicating code.
3. **Keep Files Clean & Maintainable:** Avoid unnecessary comments. Use meaningful naming, single-responsibility functions, and adhere to strict TypeScript types.
4. **I18n & Natural Language:** All user-facing strings must be in `src/i18n/bn.ts` and `en.ts`. Use natural Bangla phrasing.
5. **Quality Gate:** Always verify code with `npm run typecheck`, `npm run lint`, and `npm run build` after making modifications.


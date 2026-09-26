File in this folder is located in root folder. You are not allowed to read or modify anything that is not in this folder

## Package Manager & Runtime Rules

- NEVER use `python`, `node`, `npm`, or `npx` commands for any purpose (code exploration, formatting, checking, running
  scripts, etc.).
- Always use `pnpm` as the package manager.
- Do not install any packages
- To format code, run: `pnpm run format:fix`.
- Do not create temporary folders outside this folder
- If building project is required for the task, dont do it yourself. Tell user to do it manually
- Do not create .pnpm-store, you don't need it for anything.

## Clarifying Questions

- Always ask clarifying questions when requirements are ambiguous or underspecified before starting implementation, to
  improve understanding and avoid misunderstandings.

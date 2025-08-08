## Referral Network

A TypeScript Node.js project with Jest for testing, ESLint (flat config) for linting, and Prettier for formatting.

### Language & Setup

- **Language**: TypeScript (5.9)
- **Runtime**: Node.js (>= 18 recommended)
- **Module system**: ESM
- **Package manager**: pnpm (10.14.0)
- **Linter**: ESLint (9)
- **Formatter**: Prettier (3)
- **Test runner**: Jest 29 (via `ts-jest`)

Commands

```sh
# 0) Install pnpm (recommended via Corepack)
corepack enable && corepack prepare pnpm@10.14.0 --activate
# Fallback (if Corepack is unavailable): npm install -g pnpm@10.14.0

# 1) Install dependencies
pnpm install

# 2) Type-check the project
pnpm run typecheck

# 3) Compile TypeScript (emit to dist/)
pnpm exec tsc -p tsconfig.json

# Optional: lint and format
pnpm run lint
pnpm run format
```

### Running Tests

```sh
pnpm run test
```

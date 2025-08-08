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

### Requirements, Constraints, and Assumptions

**User**

1. Has an unique identity.
3. Can refer other users.
4. Cannot refer self.
5. Can be referred by one user only.

**Referral Network**

1. Can add new users.
2. Can query for existing users' details.
3. Can get direct referrals of a given user.
4. Can add directed, referral links from referrer to another user.
4. Can delete users.
   - Assumption: Referrals will not be able to see their referrer once the referrer is deleted.
5. Should be acyclic.
   - Reject any operation which creates a cycle.

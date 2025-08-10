# Referral Network

A TypeScript Node.js project with Jest for testing, ESLint (flat config) for linting, and Prettier for formatting.

## Language & Setup

- **Language**: TypeScript (5.9)
- **Runtime**: Node.js (>= 18 recommended)
- **Module system**: ESM
- **Package manager**: pnpm (10.14.0)
- **Linter**: ESLint (9)
- **Formatter**: Prettier (3)
- **Test runner**: Jest 29 (via `ts-jest`)

### Commands

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

## Running Tests

```sh
pnpm run test
```

## Requirements, Constraints, and Assumptions

**User**

1. Has an unique identity.
2. Can refer other users.
3. Cannot refer self.
4. Can be referred by one user only.

**Referral Network**

1. Can add new users.
2. Can query for existing users' details.
3. Can get direct referrals of a given user.
4. Can add directed, referral links from referrer to another user.
5. Can delete users.
   - Assumption: Referrals will not have a referrer once the original referrer is deleted.
6. Should be acyclic.
   - Reject any operation which creates a cycle.

## Design Choices

### Core Data Structure: Forest

The core of our referral network is modeled as a forest—a collection of disjoint trees. This choice was
made after analyzing the requirements and constraints, as it provides a model that is both efficient and
conceptually simple.

<img src="assets/referral-network-example.png" alt="Referral network tree example" height="500">

### Rationale

Choosing forest as the data structure was based upon these three constraints derived from the requirements:

1. **Unique Referrer:** An user can be referred by at most one other user. Considering user as a node in the
   graph, this means each node has a maximum of one incoming edge.
2. **Acyclic Relationships:** The network must prevent referral loops (e.g., A refers B, B refers C, and C
   refers A). The graph must be acyclic.
3. **Directed Relationships:** Referrals are unidirectional, flowing from a referrer to a candidate. This
   implies a directed graph.

Forest satisfies all these constraints and is easier to visualize/reason about. Each separate tree in the
forest represents a distinct referral chain, with its root being a user who was not referred by anyone within
the system.

Another benefit that forest gives us is the efficiency and speed in running algorithms like cycle detection.
With forest, cycle detection is reduced to finding path to root, which is significantly more efficient than
achieving the same with BFS, DFS, etc.

### API Design

#### ReferralNetwork

The `ReferralNetwork` models a directed acyclic forest. Create an instance and use the methods below to manage users and links.

```ts
import { ReferralNetwork } from './src/ReferralNetwork';

const network = new ReferralNetwork();
```

**Methods:**

- **`registerUser(id?: ID, referrerId?: ID): void`**
  - Registers a new user. If `id` is omitted, a random UUID is generated internally.
  - Throws error if:
    - `referrerId` is provided but does not exist.
    - An user with the same ID as input ID already exists.
  - Time Complexity: O(1) (with or without `referrerId` in current implementation)
  - Space Complexity: O(1) auxiliary

- **`getUserDetails(id: ID): UserDetails`**
  - Returns a snapshot of the user's details.
  - Throws error if an user with input ID does not exist.
  - Time: O(1)
  - Space: O(1) auxiliary

- **`getDirectReferrals(id: ID): ID[]`**
  - Returns the list of direct referral IDs for the given user.
  - Throws error if an user with input ID does not exist.
  - Time: O(out-degree) (creates an array from the referrals ID set)
  - Space: O(out-degree) for the returned array

- **`linkUserToReferrer(referrerId: ID, userId: ID): void`**
  - Links an existing `userId` to `referrerId` and prevents cycles via an ancestor check.
  - Throws error if:
    - Referrer with ID `referrerId` does not exist
    - User with ID `userId` does not exist.
    - User already has a referrer.
    - When the link would introduce a cycle.
  - Time: O(depth) (walks up the referrer chain to prevent cycles)
  - Space: O(1) auxiliary

- **`deleteUser(id: ID): void`**
  - Deletes a user. Their direct referrals (if any) remain in the network with `referrerId` set to `null`.
  - Throws error if an user with input ID does not exist.
  - Time: O(out-degree) (iterates direct referrals to nullify their `referrerId`)
  - Space: O(1) auxiliary

- **`getTotalReferralCount(id: ID): number`**
  - Returns the total number of referrals (direct + indirect) under the given user.
  - Throws error if the user with input ID does not exist.
  - Time: O(reach(id)) — visits each descendant once
  - Space: O(height) recursion stack

- **`getTopReferrersByReach(k: number): UserWithScore[]`**
  - Returns the top `k` users by total referral count (descendants) with their score equal to total reach. If
    `k` exceeds the number of
    users, returns all users ordered by reach.
  - Time: O(U + E + U log k) — memoized tree walks plus heap maintenance
    (U = total users, E = total edges / referral links)
  - Space: O(U + k) auxiliary plus O(height) recursion stack

- **`getUniqueReachExpansion(): UserWithScore[]`**
  - Returns referrers who, together, cover the maximum number of unique candidates, each with their score
    equal to total reach (direct + indirect referrals). Only users who have referred at least one candidate
    are included. Users are ranked by score in descending order.
  - Only root users are considered; non-root referrers are excluded.
  - Time: O(U + E + R log R) — scans all users to find roots, computes total descendants per root, then sorts
    qualifying roots (U = total users, E = total edges / referral links, R = number of qualifying roots)
  - Space: O(R) auxiliary plus O(height) recursion stack

- **`getFlowCentrality(): UserWithScore[]`**
  - Returns all users with a flow-centrality score, sorted by score in descending order. Higher scores indicate
    users lie more on shortest paths between pairs of users.
  - Time: O(U + E + U log U) — single DFS per tree to compute depth and descendant counts, then sort all users
    (U = total users, E = total edges / referral links)
  - Space: O(U) auxiliary plus O(height) recursion stack

**Example:**

**1. Network Management Operations:**

```ts
const network = new ReferralNetwork();

// Add a root referrer
network.registerUser('A');

// Add referred users
network.registerUser('B', 'A'); // Registers B with A as its referrer
network.registerUser('C', 'A'); // Registers C with A as its referrer

// Link an existing user to a referrer
network.registerUser('D');
network.linkUserToReferrer('A', 'D'); // Links A as the referrer of D

// Query
const a = network.getUserDetails('A'); // { id: 'A', referrerId: null }
const aDirect = network.getDirectReferrals('A'); // ['B','C','D']

// Delete
network.deleteUser('C'); // 'C' is removed; its referrals (if any) become roots
```

**2. Metrics:**

```ts
const network = new ReferralNetwork();

// Build a small tree
//      A
//     / \
//    B   C
//   / \   \
//  D   E   F
network.registerUser('A');
network.registerUser('B', 'A');
network.registerUser('C', 'A');
network.registerUser('D', 'B');
network.registerUser('E', 'B');
network.registerUser('F', 'C');

// getTotalReferralCount(id)
// A has descendants: B, C, D, E, F => 5
// B has descendants: D, E => 2
// C has descendant:  F => 1
// Leaves (D, E, F) have 0
console.log(network.getTotalReferralCount('A')); // 5
console.log(network.getTotalReferralCount('B')); // 2
console.log(network.getTotalReferralCount('C')); // 1
console.log(network.getTotalReferralCount('D')); // 0

// getTopReferrersByReach(k)
// Ranked by total descendants (desc): A(5), B(2), C(1), D(0), E(0), F(0)
console.log(network.getTopReferrersByReach(3));
// Output: [ { id: 'A', score: 5 }, { id: 'B', score: 2 }, { id: 'C', score: 1 } ]

console.log(network.getTopReferrersByReach(10));
// Output: [ { id: 'A', score: 5 }, { id: 'B', score: 2 }, { id: 'C', score: 1 }, { id: 'D', score: 0 }, ... ]

network.registerUser('X');
network.registerUser('Y', 'X');
network.registerUser('Z', 'Y');

// getUniqueReachExpansion()
// Current Network:
//      A        X
//     / \       |
//    B   C      Y
//   / \   \     |
//  D   E   F    Z
// Among root users, return those with non-zero total reach, sorted by reach (desc).
console.log(network.getUniqueReachExpansion());
// Output: [ { id: 'A', score: 5 }, { id: 'X', score: 2 } ]

// getFlowCentrality()
console.log(network.getFlowCentrality());
// Output: [ { id: 'B', score: 2 }, { id: 'C', score: 1 }, { id: 'Y', score: 1 }, ... ]
// (Order may vary due to ties)
```

#### NetworkGrowthSimulation

The `NetworkGrowthSimulation` is a small, deterministic expectation model to forecast how the network might
grow over time.

**Model assumptions:**

- Initialized with 100 active referrers (can be configured).
- Default referral capacity per user is 10 (can be configured).
- Each time step is one whole day; a new referral becomes an active referrer starting the next day.
- Each active referrer produces a successful referral with probability `p` per day (in expectation).
- No referrer exceeds a lifetime capacity of referrals; contributions saturate at
  `REFERRAL_CAPACITY_PER_USER`.

**Methods:**

- **`simulate(p: number, days: number): number[]`**
  - Returns an array of numbers, where the element at index i is the cumulative total expected
    referrals at the end of day i.
  - Parameters:
    - `p` represents the probability of a successful referral that can be made by a referrer per day.
    - `days` represents the number of days to simulate.
  - Throws error if:
    - `p` is not within the range of [0, 1].
    - `days` is negative.
  - Time: O(days × capacity) - capacity refers to referral capacity per user (defaults to 10)
  - Space: O(capacity)

- **`daysToTarget(p: number, targetTotal: number): number`**
  - Returns the minimum number of days required for the cumulative expected referrals to meet or exceed
    `targetTotal`.
  - Returns `Infinity` if the target is considered practically unreachable (e.g., `p === 0`).
  - Parameters:
    - `p`: probability of a successful referral per referrer per day, in [0, 1].
    - `targetTotal`: non-negative integer target for cumulative referrals.
  - Throws error if:
    - `p` is not within [0, 1].
    - `targetTotal` is negative or not an integer.
  - Time: O(days to target × capacity) - capacity refers to referral capacity per user (defaults to 10)
  - Space: O(capacity)

```ts
import { NetworkGrowthSimulation } from './src/NetworkGrowthSimulation';

// constructor(initialReferrerCount?: number, referrerCapacityPerUser?: number)
// Defaults: 100 initial referrers, capacity 10 per user
const sim = new NetworkGrowthSimulation();

// simulate(p: number, days: number): number[]
// Returns cumulative expected referrals by the end of each day (length = days)
const cumulative = sim.simulate(0.2, 7);
console.log(cumulative);
// Output: [20, 44, ...]

// daysToTarget(p: number, targetTotal: number): number
// Minimum number of days needed to reach or exceed the target in expectation
const daysNeeded = sim.daysToTarget(0.2, 1000);
console.log(daysNeeded);
// Output: 14
```

## Influencer Metrics

- **Top Referrers by Reach**
  - Identifies individuals with the largest total number of downstream referrals.
  - **Business Scenario:** Useful for mass-marketing announcements where the goal is maximum distribution
    of the news. This metric would help find referrers who can spread the message to the largest possible
    audience, irrespective of overlaps.

- **Unique reach expansion**
  - Identifies group of influencrs who collectively have the maximum number of unique users.
  - **Business Scenario:** Useful for budget-constrained campaigns. This metric would help select a small,
    efficient group of influencers who reach distinct audiences. This helps maximizing return on investment
    by ensuring multiple people reaching to the same potential lead are not paid.

- **Flow centrality**
  - Identifies the critical users that act as brokers or bridges holding the network together.
  - **Business Scenario:** Useful for identifying moderators who are highly engaged/connected. These users
    are the best source of feedback from multiple users, as they are connected to all of them.

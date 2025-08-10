# Referral Network

This repository contains a TypeScript implementation for a referral network, featuring functionalities for
graph management, influencer analysis, and growth simulation. The project is built with Node.js, tested with
Jest, linted with ESLint, and formatted with Prettier.

## Table of Contents

- [Time Estimation](#time-estimation)
- [Language and Setup](#language-and-setup)
  - [Commands](#commands)
- [Running Tests](#running-tests)
- [Design Choices](#design-choices)
  - [Core Data Structure: Forest](#core-data-structure-forest)
  - [Constraints and Assumptions](#constraints-and-assumptions)
- [API Documentation](#api-documentation)
  - [`ReferralNetwork`](#referralnetwork)
  - [`NetworkGrowthSimulation`](#networkgrowthsimulation)
  - [`ReferralBonusOptimizer`](#referralbonusoptimizer)
- [Influencer Metrics Comparison](#influencer-metrics-comparison)

## Time Estimation

**Total Approximate Time Spent:** 18-20 hours

## Language and Setup

- **Language**: TypeScript (5.9)
- **Runtime**: Node.js (>= 18 recommended)
- **Package manager**: pnpm (10.14.0)
- **Test runner**: Jest 29 (via `ts-jest`)
- **Linting and Formatting**: ESLint and Prettier

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

To execute the complete test suite, run the following command:

```sh
pnpm run test
```

## Design Choices

### Core Data Structure: Forest

The core of our referral network is modeled as a forest—a collection of disjoint trees. This choice was
made after analyzing the requirements and constraints, as it provides a model that is both efficient and
conceptually simple.

<img src="assets/referral-network-example.png" alt="Referral network tree example" height="400">

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

### Constraints and Assumptions

- **No Self-Referrals:** A user cannot refer themselves. This is enforced at the point of adding a referral
  link. 
- **Unique Referrer:** A user can only be referred by one other user. 
- **Acyclic Graph:** Any operation that would introduce a cycle is rejected. 
- **User Deletion:** An assumption was made that if a referrer is deleted, their direct referrals are not
  deleted. Instead, they become root users (their `referrerId` is set to `null`).

## API Documentation

### `ReferralNetwork`

Manages users and their referral relationships.

```ts
import { ReferralNetwork } from './src/ReferralNetwork';

const network = new ReferralNetwork();
```

#### Methods

- **`registerUser(id?: ID, referrerId?: ID): void`**
  - Registers a new user. If `id` is omitted, a random UUID is generated internally.
  - Throws error if:
    - `referrerId` is provided but does not exist.
    - An user with the same ID as input ID already exists.
  - Time Complexity: O(1)
  - Space Complexity: O(1) auxiliary

- **`getUserDetails(id: ID): Omit<UserDetails, 'referrals'>`**
  - Returns a snapshot of the user's details (self ID and referrer ID).
  - Throws error if an user with input ID does not exist.
  - Time Complexity: O(1)
  - Space Complexity: O(1) auxiliary

- **`getDirectReferrals(id: ID): ID[]`**
  - Returns the list of direct referral IDs for the given user.
  - Throws error if an user with input ID does not exist.
  - Time Complexity: O(out-degree) (creates an array from the referrals ID set)
  - Space Complexity: O(out-degree) for the returned array

- **`linkUserToReferrer(referrerId: ID, userId: ID): void`**
  - Links an existing `userId` to `referrerId` and prevents cycles via an ancestor check.
  - Throws error if:
    - Referrer with ID `referrerId` does not exist
    - User with ID `userId` does not exist.
    - User already has a referrer.
    - When the link would introduce a cycle.
  - Time Complexity: O(depth) (walks up the referrer chain to prevent cycles)
  - Space Complexity: O(1) auxiliary

- **`deleteUser(id: ID): void`**
  - Deletes a user. Their direct referrals (if any) remain in the network with `referrerId` set to `null`.
  - Throws error if an user with input ID does not exist.
  - Time Complexity: O(out-degree) (iterates direct referrals to nullify their `referrerId`)
  - Space Complexity: O(1) auxiliary

- **`getTotalReferralCount(id: ID): number`**
  - Returns the total number of referrals (direct + indirect) under the given user.
  - Throws error if the user with input ID does not exist.
  - Time Complexity: O( reach(user) ) — visits each descendant once
  - Space Complexity: O(height) recursion stack

- **`getTopReferrersByReach(k: number): UserWithScore[]`**
  - Returns the top `k` users by total referral count (descendants) with their score equal to total reach. If
    `k` exceeds the number of
    users, returns all users ordered by reach.
  - Time Complexity: O(U + E + U log k) — memoized tree walks plus heap maintenance
    (U = total users, E = total edges / referral links)
  - Space Complexity: O(U + k) auxiliary plus O(height) recursion stack

- **`getUniqueReachExpansion(): UserWithScore[]`**
  - Returns referrers who, together, cover the maximum number of unique candidates, each with their score
    equal to total reach (direct + indirect referrals). Only users who have referred at least one candidate
    are included. Users are ranked by score in descending order.
  - Only root users are considered; non-root referrers are excluded.
  - Time Complexity: O(U + E + R log R) — scans all users to find roots, computes total descendants per root,
    then sorts qualifying roots
    (U = total users, E = total edges / referral links, R = number of qualifying roots)
  - Space Complexity: O(R) auxiliary plus O(height) recursion stack

- **`getFlowCentrality(): UserWithScore[]`**
  - Returns all users with a flow-centrality score, sorted by score in descending order. Higher scores indicate
    users lie more on shortest paths between pairs of users.
  - Time Complexity: O(U + E + U log U) — single DFS per tree to compute depth and descendant counts, then sort all users
    (U = total users, E = total edges / referral links)
  - Space Complexity: O(U) auxiliary plus O(height) recursion stack

#### Example

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

### `NetworkGrowthSimulation`

A small, deterministic expectation model that forecasts network growth over time based on probabilistic
referrals.

```ts
import { NetworkGrowthSimulation } from './src/NetworkGrowthSimulation';

// constructor(initialReferrerCount?: number, referrerCapacityPerUser?: number)
// Defaults:
// - 100 for initial referrers
// - 10 for capacity per user
const simulator = new NetworkGrowthSimulation();
```

#### Model Assumptions

- Initialized with 100 active referrers (can be configured).
- Default referral capacity per user is 10 (can be configured).
- Each time step is one whole day; a new referral becomes an active referrer starting the next day.
- Each active referrer produces a successful referral with probability `p` per day (in expectation).
- No referrer exceeds a lifetime capacity of referrals; contributions saturate at
  `REFERRAL_CAPACITY_PER_USER`.

#### Methods

- **`simulate(p: number, days: number): number[]`**
  - Returns an array of numbers, where the element at index i is the cumulative total expected
    referrals at the end of day i.
  - Parameters:
    - `p` represents the probability of a successful referral that can be made by a referrer per day.
    - `days` represents the number of days to simulate.
  - Throws error if:
    - `p` is not within the range of [0, 1].
    - `days` is negative.
  - Time Complexity: O(days * capacity) - capacity refers to referral capacity per user (defaults to 10)
  - Space Complexity: O(capacity)

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
  - Time Complexity: O(days to target * capacity) - capacity refers to referral capacity per user
    (defaults to 10)
  - Space Complexity: O(capacity)

#### Example

```ts
import { NetworkGrowthSimulation } from './src/NetworkGrowthSimulation';

// constructor(initialReferrerCount?: number, referrerCapacityPerUser?: number)
// Defaults: 100 initial referrers, capacity 10 per user
const simulator = new NetworkGrowthSimulation();

// simulate(p: number, days: number): number[]
// Returns cumulative expected referrals by the end of each day (length = days)
const cumulative = simulator.simulate(0.2, 7);
console.log(cumulative);
// Output: [20, 44, ...]

// daysToTarget(p: number, targetTotal: number): number
// Minimum number of days needed to reach or exceed the target in expectation
const daysNeeded = simulator.daysToTarget(0.2, 1000);
console.log(daysNeeded);
// Output: 14
```

### `ReferralBonusOptimizer`

Finds the minimum bonus required to achieve a hiring target within a set timeframe.

```ts
import { NetworkGrowthSimulation } from './src/NetworkGrowthSimulation';
import { ReferralBonusOptimizer } from './src/ReferralBonusOptimizer';

const sim = new NetworkGrowthSimulation();

// Optional: customize max bonus and increment ($10 default)
const optimizer = new ReferralBonusOptimizer(sim, /* maxBonus = 1_000_000, bonusIncrement = 10 */);
```

#### Methods

- **`getMinBonusForTarget(days: number, targetHires: number, adoptionProbFn: (bonus: number) => number, eps: number): number | null`**
  - Returns:
    - Minimum bonus (rounded up to the nearest multiple of `bonusIncrement`) required to achieve `targetHires`
      in `days`.
    - `null` if the target is unachievable with the maximum bonus ()
  - Parameters:
    - **`days`**: non-negative integer number of days.
    - **`targetHires`**: no of hires expected through referrals.
    - **`adoptionProbFn`**: monotonically non-decreasing function mapping `bonus` to probability `p` in [0, 1].
    - **`eps`**: A precision parameter. **Note**: This parameter is not used in the final implementation. The
                 optimization is achieved by performing a binary search on discrete bonus values
                 (e.g., multiples of $10), which doesnot require a floating-point tolerance parameter like `eps`.
  - Time Complexity:
    - Simplified: O(days) assuming max bonus, bonus increments, and referral capacity per user are constant
    - If none of the above are constant: O(log(M/I) * C * D)
      (M = Max bonus, I = Bonus increment, C = referral capacity per user, D = days)
    - This function performs a binary search over the possible bonus amounts. That has a time complexity of
      O(log(M / I)) (M = Max bonus, I = Bonus increment)
    - For every iteration of binary search, `simulator.simulate(...)` is called. That has a time complexity of
      O(days) if referral capacity is assumed constant (defaults to 10). Otherwise, O(days * capacity).

#### Behavior and Assumptions

- Assumes `adoptionProbFn(bonus)` is monotonically non-decreasing.
- Always returns a multiple of `bonusIncrement`.
- Rounds up when an exact amount is not aligned to `bonusIncrement`.
- Returns `null` if even `maxBonus` cannot reach the target within `days`.
- Edge cases:
  - If `days === 0` and `targetHires > 0`, returns `null`.
  - If `targetHires <= 0`, returns `0` (no bonus needed).

**Example:**

```ts
import { NetworkGrowthSimulation } from './src/NetworkGrowthSimulation';
import { ReferralBonusOptimizer } from './src/ReferralBonusOptimizer';

const sim = new NetworkGrowthSimulation();
const optimizer = new ReferralBonusOptimizer(sim);

// Linear adoption: p = min(1, bonus / 1000)
const adoptionProb = (bonus: number) => Math.min(1, bonus / 1000);

// Find minimum bonus to reach 500 hires in 7 days
const minBonus = optimizer.getMinBonusForTarget(7, 500, adoptionProb, 1e-3);
console.log(minBonus); 
// Output: 180 (example)
```

## Influencer Metrics Comparison

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
  - Identifies the critical users that act as brokers or bridges holding the network together. Ultimately
    measures how critical an user is to connecting different parts of the network.
  - **Business Scenario:** Useful for identifying moderators who are highly engaged/connected. These users
    are the best source of feedback from multiple users, as they are connected to all of them.

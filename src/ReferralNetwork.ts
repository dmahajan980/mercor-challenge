import { ReferralNetworkOperations, User, MinHeap, ReferralMetrics } from './entities';
import type { ID, UserDetails, UserWithScore } from './types';

/**
 * A referral network implementation.
 * @implements {ReferralNetworkOperations}
 * @implements {ReferralMetrics}
 */
class ReferralNetwork implements ReferralNetworkOperations, ReferralMetrics {
  /**
   * A map of users in the referral network.
   * The key is the user's ID, and the value is the user class instance.
   */
  private _users: Map<ID, User> = new Map();

  /** @inheritdoc */
  getUserDetails(id: ID): Omit<UserDetails, 'referrals'> {
    const details = this._getUser(id);
    return {
      id: details.id,
      referrerId: details.referrerId,
    };
  }

  /** @inheritdoc */
  registerUser(id?: ID, referrerId?: ID): void {
    // Check if the referrer exists
    if (referrerId && !this._getUser(referrerId, { readSilently: true })) {
      throw new Error(`Referrer ${referrerId} not found`);
    }

    // Check if the user already exists
    if (id && this._getUser(id, { readSilently: true })) {
      throw new Error(`User ${id} already exists`);
    }

    // Check if the user is trying to be a referrer of itself.
    if (id === referrerId) {
      throw new Error(`User ${id} cannot be a referrer of itself`);
    }

    // Create the user within the network
    const user = new User(id, referrerId);
    this._users.set(user.id, user);

    // Link the user and referrer
    if (referrerId) {
      const referrer = this._getUser(referrerId);
      referrer.addReferral(user.id);
      user.referrerId = referrerId;
    }
  }

  /** @inheritdoc */
  getDirectReferrals(id: ID): ID[] {
    const user = this._getUser(id);
    return Array.from(user.referrals);
  }

  /** @inheritdoc */
  linkUserToReferrer(referrerId: ID, userId: ID): void {
    const referrer = this._getUser(referrerId, { readSilently: true });
    if (!referrer) {
      throw new Error(`Referrer ${referrerId} not found`);
    }

    // Get the user to link to the referrer
    const user = this._getUser(userId);

    // Check if the user already has a referrer
    if (user.referrerId) {
      throw new Error(`User ${userId} already has a referrer`);
    }

    // Check if there exists a path from the user to the referrer. This is to prevent cycles
    // that would be created by linking the user to the referrer.
    if (this._hasPath(userId, referrerId)) {
      throw new Error(`Linking user ${userId} to referrer ${referrerId} would create a cycle`);
    }

    // Add the user to the referrer's referrals
    referrer.addReferral(user.id);

    // Set the user's referrer to the referrer
    user.referrerId = referrerId;
  }

  /** @inheritdoc */
  deleteUser(id: ID): void {
    const user = this._getUser(id);

    // Remove the user from the referrals of the users that the user has referred
    user.referrals.forEach((referralId) => {
      const referralUser = this._getUser(referralId, { readSilently: true });
      if (referralUser) {
        referralUser.referrerId = null;
      }
    });

    // Remove the user from the referrer's referrals
    if (user.referrerId) {
      const referrer = this._getUser(user.referrerId);
      referrer.removeReferral(id);
    }

    // Delete the user from the network
    this._users.delete(id);
  }

  /** @inheritdoc */
  getTotalReferralCount(id: ID): number {
    const user = this._getUser(id);

    let count = user.referrals.size;
    for (const referralId of user.referrals) {
      // Add the total referral count of the referred users.
      count += this.getTotalReferralCount(referralId);
    }

    return count;
  }

  /** @inheritdoc */
  getTopReferrersByReach(k: number): UserWithScore[] {
    // Maintains a min heap of the top k referrers by total referral count.
    const topReferrers = new MinHeap<UserWithScore>((a, b) => a.score - b.score);

    // Helper function to compute the reach of a user.
    const reachCountCache = new Map<ID, number>();
    const computeReach = (id: ID): number => {
      // Check if the reach is already cached.
      if (reachCountCache.has(id)) {
        return reachCountCache.get(id)!;
      }

      const user = this._getUser(id);

      let reach = user.referrals.size;
      for (const referralId of user.referrals) {
        reach += computeReach(referralId);
      }

      // Cache the reach.
      reachCountCache.set(id, reach);

      // Add the reach to the top referrers heap.
      topReferrers.add({ id, score: reach });

      // If the heap is full, remove the smallest element.
      if (topReferrers.size > k) {
        topReferrers.remove();
      }

      return reach;
    };

    // Iterate over all users and compute their reach.
    for (const user of this._users.values()) {
      computeReach(user.id);
    }

    // Return the top k referrers with scores.
    const size = Math.min(k, topReferrers.size);
    const topReferrersArray: UserWithScore[] = new Array(size);
    let index = size - 1;
    while (topReferrers.size > 0) {
      const top = topReferrers.peek();
      topReferrersArray[index--] = top;
      topReferrers.remove();
    }

    return topReferrersArray;
  }

  /** @inheritdoc */
  getUniqueReachExpansion(): UserWithScore[] {
    // Users qualifying for unique reach are the ones that do not have a referrer.
    // At the same time, they must not have zero referrals.

    const uniqueReach: UserWithScore[] = [];
    for (const user of this._users.values()) {
      if (!user.referrerId) {
        const reach = this.getTotalReferralCount(user.id);
        if (reach > 0) {
          uniqueReach.push({ id: user.id, score: reach });
        }
      }
    }

    // Sort the users by reach in descending order.
    uniqueReach.sort((a, b) => b.score - a.score);

    return uniqueReach;
  }

  /** @inheritdoc */
  getFlowCentrality(): UserWithScore[] {
    /**
     * Intuition:
     *
     * Given the network is a forest, there can be at most one path between any two users.
     * Since there can be only one path between any two users, the shortest path is the only
     * one that exists.
     *
     * Flow centrality identifies the users that lie more on the most shortest paths between
     * any two users. The more the number of paths through an element, the higher its flow
     * centrality score.
     *
     * As links are directed and each user can have only one referrer, the number of paths
     * through an user is the product of the depth of the user from the root and the number of
     * descendants of the user.
     *
     * Flow Centrality Score (U) = Depth(U) * Descendants(U)
     */

    if (this._users.size === 0) return [];

    const userDepthFromRoot = new Map<ID, number>();
    const userDescendantsCount = new Map<ID, number>();

    // Compute depth and total descendants for each node in one pass
    const computeDepthAndDescendantsCount = (id: ID, depth: number): number => {
      userDepthFromRoot.set(id, depth);

      const user = this._getUser(id);
      let totalDescendants = 0;
      for (const childId of user.referrals) {
        // Count child itself plus child's descendants
        totalDescendants += 1 + computeDepthAndDescendantsCount(childId, depth + 1);
      }

      userDescendantsCount.set(id, totalDescendants);
      return totalDescendants;
    };

    for (const user of this._users.values()) {
      // Skip non-root users.
      if (user.referrerId) continue;

      // Compute depth and total descendants for the user.
      computeDepthAndDescendantsCount(user.id, 0);
    }

    // Compute flow centrality score = depth(v) * descendants(v)
    const usersWithScore: UserWithScore[] = [];
    for (const [id, depth] of userDepthFromRoot.entries()) {
      const descendants = userDescendantsCount.get(id) ?? 0;
      const score = depth * descendants;
      usersWithScore.push({ id, score });
    }

    // Sort by score (desc). Ties are allowed in any order.
    usersWithScore.sort((a, b) => b.score - a.score);

    return usersWithScore;
  }

  /**
   * Detects if there is a path from one user to another in the referral network/graph.
   *
   * @param {ID} from - The ID of the user to start from.
   * @param {ID} to - The ID of the user to end at.
   * @returns {boolean} True if there is a path from the start user to the end user, false otherwise.
   * @throws {Error} If the start user is not found.
   * @throws {Error} If the end user is not found.
   */
  private _hasPath(from: ID, to: ID): boolean {
    // Check if the start user has a path to the end user using path to root analogy.
    let pointer: ID | null = to;
    while (!!pointer) {
      // If the pointer matches the root, there is a path.
      if (pointer === from) return true;

      const user: User = this._getUser(pointer);

      // Move the pointer one level up in the tree.
      pointer = user.referrerId;
    }

    return false;
  }

  /**
   * Gets a user from the referral network.
   *
   * @param {ID} id - The ID of the user to get.
   * @returns {User} The user object.
   * @throws {Error} If the user is not found and `readSilently` is false.
   */
  private _getUser(id: ID): User;
  private _getUser(id: ID, options: { readSilently: boolean }): User | null;
  private _getUser(id: ID, options = { readSilently: false }): User | null {
    const user = this._users.get(id);
    if (!user) {
      if (options.readSilently) return null;
      throw new Error(`User ${id} not found`);
    }

    return user;
  }
}

export { ReferralNetwork };

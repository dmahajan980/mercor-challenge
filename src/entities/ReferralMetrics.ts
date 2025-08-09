import type { ID, UserWithScore } from '../types';

/**
 * The metrics that a referral network must implement.
 * @abstract
 */
abstract class ReferralMetrics {
  /**
   * Gets the total referral count for a user. This includes both direct and indirect referrals.
   *
   * @param {ID} id - The ID of the user to get the total referral count for.
   * @returns {number} The total referral count for the user.
   * @throws {Error} If the user is not found.
   */
  abstract getTotalReferralCount(id: ID): number;

  /**
   * Gets the top k referrers by total referral count.
   *
   * @param {number} k - The number of referrers to get.
   * @returns {ID[]} The IDs of the top k referrers.
   */
  abstract getTopReferrersByReach(k: number): ID[];

  /**
   * Gets the list of referrers that have referred the maximum number of unique users. Excludes
   * users who have no referrals since this utility is involved in identifying influencers within
   * the network.
   *
   * @returns {UserWithScore[]} The referrers with their unique reach score.
   */
  abstract getUniqueReachExpansion(): UserWithScore[];

  /**
   * Gets the list of brokers or users who belong to most critical intersections in the network.
   * Removal of these users would most likely cause the network to fragment into multiple
   * disconnected components.
   *
   * @returns {UserWithScore[]} The users/brokers.
   */
  abstract getFlowCentrality(): UserWithScore[];
}

export { ReferralMetrics };

import type { ID } from '../types';

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
}

export { ReferralMetrics };

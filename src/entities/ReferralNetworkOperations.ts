import type { ID, UserDetails } from '../types';

/**
 * The operations that a referral network must implement.
 * @abstract
 */
abstract class ReferralNetworkOperations {
  /**
   * Gets an user's details from the referral network.
   *
   * @param {ID} id - The ID of the user.
   * @returns {Omit<UserDetails, 'referrals'>} The user details object (without referrals info).
   * @throws {Error} If the user is not found.
   *
   * @see {@link UserDetails} for the user details object.
   */
  abstract getUserDetails(id: ID): Omit<UserDetails, 'referrals'>;

  /**
   * Registers a new user in the referral network.
   *
   * @param {ID} id - The ID of the user. If not provided, a random ID will be generated.
   * @param {ID} referrerId - The ID of the user's referrer. If not provided, the user will be a root user.
   * @throws {Error} If the referrer is not found.
   * @throws {Error} If the user already exists.
   * @throws {Error} If the user is trying to be a referrer of itself.
   */
  abstract registerUser(id?: ID, referrerId?: ID): void;

  /**
   * Gets the direct referrals for a user.
   *
   * @param {ID} id - The ID of the user.
   * @returns {ID[]} The IDs of the user's direct referrals.
   * @throws {Error} If the user is not found.
   */
  abstract getDirectReferrals(id: ID): ID[];

  /**
   * Links a user to a referrer.
   *
   * @param {ID} referrerId - The ID of the referrer.
   * @param {ID} userId - The ID of the user to link to the referrer.
   * @throws {Error} If the referrer is not found.
   * @throws {Error} If the user is not found.
   * @throws {Error} If the user already has a referrer.
   * @throws {Error} If the link would create a cycle.
   */
  abstract linkUserToReferrer(referrerId: ID, userId: ID): void;

  /**
   * Deletes a user from the referral network.
   *
   * @param {ID} id - The ID of the user to delete.
   * @throws {Error} If the user is not found.
   */
  abstract deleteUser(id: ID): void;
}

export { ReferralNetworkOperations };

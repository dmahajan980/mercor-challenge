import { User, UserDetails } from './entities/User';
import { ID } from './types';

class ReferralNetwork {
  /**
   * A map of users in the referral network.
   * The key is the user's ID, and the value is the user details object.
   */
  private _users: Map<ID, User> = new Map();

  /**
   * Gets an user's details from the referral network.
   *
   * @param {ID} id - The ID of the user to get.
   * @returns {UserDetails | null} The user details object, or null if the user is not found.
   *
   * @see {@link UserDetails} for the user details object.
   */
  public getUserDetails(id: ID): UserDetails | null {
    // TODO: Implement this
    return null;
  }

  /**
   * Registers a new user in the referral network.
   *
   * @param {ID} id - The ID of the user. If not provided, a random ID will be generated.
   * @param {ID} referrerId - The ID of the user's referrer. If not provided, the user will be a root user.
   */
  public registerUser(id?: ID, referrerId?: ID): void {
    // TODO: Implement this
  }

  /**
   * Gets the direct referrals for a user.
   *
   * @param {ID} id - The ID of the user.
   * @returns {ID[]} The IDs of the user's direct referrals.
   */
  public getDirectReferrals(id: ID): ID[] {
    // TODO: Implement this
    return [];
  }

  /**
   * Links a user to a referrer.
   *
   * @param {ID} referrerId - The ID of the referrer.
   * @param {ID} userId - The ID of the user to link to the referrer.
   */
  public linkUserToReferrer(referrerId: ID, userId: ID): void {
    // TODO: Implement this
  }

  /**
   * Deletes an user from the referral network.
   *
   * @param {ID} id - The ID of the user to delete.
   */
  public deleteUser(id: ID): void {
    // TODO: Implement this
  }
}

export { ReferralNetwork };

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
   * @returns {Omit<UserDetails, 'referrals'>} The user details object (without referrals info).
   * @throws {Error} If the user is not found.
   *
   * @see {@link UserDetails} for the user details object.
   */
  public getUserDetails(id: ID): Omit<UserDetails, 'referrals'> {
    const details = this._getUser(id);
    return {
      id: details.id,
      referrerId: details.referrerId,
    };
  }

  /**
   * Registers a new user in the referral network.
   *
   * @param {ID} id - The ID of the user. If not provided, a random ID will be generated.
   * @param {ID} referrerId - The ID of the user's referrer. If not provided, the user will be a root user.
   * @throws {Error} If the referrer is not found.
   * @throws {Error} If the user already exists.
   * @throws {Error} If the user is trying to be a referrer of itself.
   */
  public registerUser(id?: ID, referrerId?: ID): void {
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

  /**
   * Gets the direct referrals for a user.
   *
   * @param {ID} id - The ID of the user.
   * @returns {ID[]} The IDs of the user's direct referrals.
   * @throws {Error} If the user is not found.
   */
  public getDirectReferrals(id: ID): ID[] {
    const user = this._getUser(id);
    return Array.from(user.referrals);
  }

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
  public linkUserToReferrer(referrerId: ID, userId: ID): void {
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

  /**
   * Deletes an user from the referral network.
   *
   * @param {ID} id - The ID of the user to delete.
   * @throws {Error} If the user is not found.
   */
  public deleteUser(id: ID): void {
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

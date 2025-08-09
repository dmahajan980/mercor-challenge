import { ID, UserDetails } from '../types';

/** @see {@link UserDetails} for the user details object. */
class User implements UserDetails {
  private _id: ID;
  public get id() {
    return this._id;
  }

  private _referrerId: ID | null;
  public get referrerId() {
    return this._referrerId;
  }
  public set referrerId(referrerId: ID | null) {
    this._referrerId = referrerId;
  }

  private _referrals: Set<ID>;
  public get referrals() {
    return this._referrals;
  }

  /**
   * Creates a new user in the referral network.
   *
   * @param id - The ID of the user. If not provided, a random ID will be generated.
   * @param referrerId - The ID of the user's referrer. If not provided, the user will be a root user.
   */
  constructor(id?: ID, referrerId?: ID) {
    this._id = id ?? crypto.randomUUID();
    this._referrerId = referrerId ?? null;
    this._referrals = new Set();
  }

  /**
   * Adds a new user to the referral network.
   *
   * Note: This does not check if the user is a valid referral of the current user. It is the
   * responsibility of the caller to ensure that the user is a valid referral.
   *
   * @param userId - The ID of the user to add to the referral network.
   */
  public addReferral(userId: ID) {
    this._referrals.add(userId);
  }

  /**
   * Removes a user from the referral network.
   *
   * @param userId - The ID of the user to remove from the referral network.
   */
  public removeReferral(userId: ID) {
    this._referrals.delete(userId);
  }
}

export { User };

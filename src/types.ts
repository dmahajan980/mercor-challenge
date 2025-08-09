type ID = string;

/** The details of an user in the referral network. */
interface UserDetails {
  /** The unique identifier for the user. */
  readonly id: ID;

  /**
   * The unique identifier for the user's referrer.
   * This will be undefined if the user is the root user, or if the user has not been referred.
   */
  readonly referrerId: ID | null;

  /** The unique identifiers for the users that the user has referred. */
  readonly referrals: Set<ID>;
}

/** The reach of an user in the referral network. */
interface UserReach {
  /** The ID of the user. */
  id: ID;

  /** The reach of the user, i.e. the total number of direct and indirect referrals. */
  reach: number;
}

/** The score of an user in the referral network based on a metric. */
interface UserWithScore {
  /** The ID of the user. */
  id: ID;

  /** The score of the user. */
  score: number;
}

export type { ID, UserDetails, UserReach, UserWithScore };

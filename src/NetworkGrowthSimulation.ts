/**
 * Abstract model for simulating referral-network growth over time.
 *
 * Model assumptions (deterministic expectation model):
 * - Time evolves in whole days. A new referral becomes a referrer starting the next day.
 * - On each day, each active referrer produces a successful referral with probability p.
 * - Expected contributions saturate at the lifetime capacity (no referrer exceeds
 *   `REFERRAL_CAPACITY_PER_USER` total referrals in expectation).
 */
class NetworkGrowthSimulation {
  /** The number of referrers to start with. */
  public readonly INITIAL_REFERRERS: number;

  /** The maximum number of successful referrals a user can make. */
  public readonly REFERRAL_CAPACITY_PER_USER: number;

  /**
   * Creates a new network growth simulation.
   *
   * @param {number} initialReferrerCount - The number of referrers to start with. Defaults to 100.
   * @param {number} referrerCapacityPerUser - The maximum number of successful referrals a user can make.
   *                                           Defaults to 10.
   */
  constructor(initialReferrerCount?: number, referrerCapacityPerUser?: number) {
    this.INITIAL_REFERRERS = initialReferrerCount ?? 100;
    this.REFERRAL_CAPACITY_PER_USER = referrerCapacityPerUser ?? 10;
  }

  /**
   * Runs the simulation for a given success probability per referrer per day and number of days.
   *
   * @param {number} p - The probability of a successful referral per referrer per day.
   * @param {number} days - The number of days to simulate.
   * @returns {number[]} An array of cumulative expected referrals by the end of each day.
   * @throws {Error} If `p` is not in [0, 1] or `days` is not a non-negative integer.
   * @throws {Error} If `days` is negative.
   */
  public simulate(p: number, days: number): number[] {
    // Validate inputs.
    if (p < 0 || p > 1) {
      throw new Error('Probability p must be between 0 and 1.');
    }

    if (days < 0 || !Number.isInteger(days)) {
      throw new Error('Days must be a non-negative integer.');
    }

    // If days is 0, return an empty array.
    if (days === 0) return [];

    // `referrersByCapacity[c]` stores the expected number of referrers who have `c` referrals left to make.
    // Index 0 is for inactive users.
    let referrersByCapacity = new Array(this.REFERRAL_CAPACITY_PER_USER + 1).fill(0);
    referrersByCapacity[this.REFERRAL_CAPACITY_PER_USER] = this.INITIAL_REFERRERS;

    let cumulativeReferrals = 0;
    const dailyCumulativeReferrals: number[] = [];

    for (let currentDay = 0; currentDay < days; currentDay++) {
      const nextDayReferrersByCapacity = new Array(this.REFERRAL_CAPACITY_PER_USER + 1).fill(0);
      let todaysNewReferrals = 0;

      // Calculate new referrals and transitions for each capacity bucket.
      for (
        let userReferralCapacity = 1;
        userReferralCapacity <= this.REFERRAL_CAPACITY_PER_USER;
        userReferralCapacity++
      ) {
        const referrersWithCurrCapacity = referrersByCapacity[userReferralCapacity];
        if (referrersWithCurrCapacity === 0) continue;

        const successfulReferrals = referrersWithCurrCapacity * p;
        const unsuccessfulReferrals = referrersWithCurrCapacity * (1 - p);

        todaysNewReferrals += successfulReferrals;

        // Referrers who made a successful referral move to the `userReferralCapacity - 1` capacity bucket.
        nextDayReferrersByCapacity[userReferralCapacity - 1] += successfulReferrals;

        // Referrers who did not make a referral stay in the same bucket.
        nextDayReferrersByCapacity[userReferralCapacity] += unsuccessfulReferrals;
      }

      // The newly referred people become active referrers with full capacity.
      nextDayReferrersByCapacity[this.REFERRAL_CAPACITY_PER_USER] += todaysNewReferrals;

      // Update state for the next day.
      referrersByCapacity = nextDayReferrersByCapacity;
      cumulativeReferrals += todaysNewReferrals;
      dailyCumulativeReferrals.push(cumulativeReferrals);
    }

    return dailyCumulativeReferrals;
  }
}

export { NetworkGrowthSimulation };

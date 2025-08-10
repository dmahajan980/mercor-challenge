/**
 * The operations that a simulation must implement.
 * @abstract
 */
abstract class SimulationOperations {
  /**
   * Runs the simulation for a given success probability per referrer per day and number of days.
   *
   * @param {number} p - The probability of a successful referral per referrer per day.
   * @param {number} days - The number of days to simulate.
   * @returns {number[]} An array of cumulative expected referrals by the end of each day.
   * @throws {Error} If `p` is not in [0, 1] or `days` is not a non-negative integer.
   * @throws {Error} If `days` is negative.
   */
  abstract simulate(p: number, days: number): number[];

  /**
   * Computes the minimum number of days required for the cumulative expected referrals to
   * meet or exceed `targetTotal`.
   *
   * @param {number} p - The probability of a successful referral per referrer per day.
   * @param {number} targetTotal - The target number of cumulative referrals.
   * @returns {number} The minimum number of days required. If the target is considered practically
   *                   unreachable, returns `Infinity`.
   * @throws {Error} If `p` is not in [0, 1].
   * @throws {Error} If `targetTotal` is not a non-negative integer.
   */
  abstract daysToTarget(p: number, targetTotal: number): number;
}

export { SimulationOperations };

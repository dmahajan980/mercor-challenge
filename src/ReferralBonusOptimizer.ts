import { SimulationOperations } from './entities';

class ReferralBonusOptimizer {
  private readonly simulator: SimulationOperations;

  public readonly MAX_BONUS: number;
  public readonly BONUS_INCREMENT: number;

  /**
   * Creates a new referral bonus optimizer.
   * @param simulator - The simulator to use for the optimization.
   */
  constructor(simulator: SimulationOperations, maxBonus?: number, bonusIncrement?: number) {
    this.simulator = simulator;
    this.MAX_BONUS = maxBonus ?? 1_000_000;
    this.BONUS_INCREMENT = bonusIncrement ?? 10;
  }

  /**
   * Optimizes the referral bonus for a given number of days and target hires.
   * @param {number} days - The number of days to reach the target.
   * @param {number} targetHires - The target number of hires.
   * @param {function(number): number} adoptionProbabilityFunction - The function
   * that returns the probability of a user adopting the product.
   * @param {number} eps - Unsure of what this is and what it does. Included as requested
   *                       in the function signature.
   * @returns The optimized referral bonus.
   */
  getMinBonusForTarget(
    days: number,
    targetHires: number,
    adoptionProbabilityFunction: (bonus: number) => number,
    eps: number,
  ): number | null {
    if (days < 0 || targetHires <= 0) return 0;
    if (days === 0) return null;

    // First, check if the target is achievable even with the maximum practical bonus.
    let maxProb = adoptionProbabilityFunction(this.MAX_BONUS);
    let maxHiresArr = this.simulator.simulate(maxProb, days);
    let maxPossibleHires = maxHiresArr[maxHiresArr.length - 1] ?? 0;

    // If the target is not achievable, we need to increase the bonus.
    if (maxPossibleHires < targetHires) return null;

    // Find the minimum bonus that achieves the target using binary search.
    let bonusLowerBound = 0;
    let bonusUpperBound = this.MAX_BONUS;
    let minAchievableBonus = this.MAX_BONUS;

    while (bonusLowerBound <= bonusUpperBound) {
      // Find the midpoint bonus, ensuring it's always a multiple of 10.
      const midBonus =
        Math.floor((bonusLowerBound + bonusUpperBound) / 2 / this.BONUS_INCREMENT) *
        this.BONUS_INCREMENT;

      const p = adoptionProbabilityFunction(midBonus);
      const dailyHires = this.simulator.simulate(p, days);
      const totalHires = dailyHires[dailyHires.length - 1] ?? 0;

      // If the bonus is sufficient, store it and try to find an even lower one.
      if (totalHires >= targetHires) {
        minAchievableBonus = midBonus;
        bonusUpperBound = midBonus - this.BONUS_INCREMENT;
      } else {
        // If the bonus is not sufficient, offer more.
        bonusLowerBound = midBonus + this.BONUS_INCREMENT;
      }
    }

    return minAchievableBonus;
  }
}

export { ReferralBonusOptimizer };

import { NetworkGrowthSimulation } from '../src/NetworkGrowthSimulation';
import { ReferralBonusOptimizer } from '../src/ReferralBonusOptimizer';

describe('Referral Bonus Optimizer', () => {
  const MAX_BONUS = 100_000;

  const simulator = new NetworkGrowthSimulation();
  const optimizer = new ReferralBonusOptimizer(simulator, MAX_BONUS);

  // Monotonic adoption functions used in tests
  const linearAdoption100 = (bonus: number) => Math.min(1, bonus / 100);
  const linearAdoption1000 = (bonus: number) => Math.min(1, bonus / 1000);
  const linearWithInterceptAdpotion100 = (bonus: number) => Math.min(1, 0.05 + bonus / 100);

  it('should return 0 if target hires is 0', () => {
    expect(optimizer.getMinBonusForTarget(1, 0, linearAdoption100, 1e-3)).toBe(0);
  });

  it('should return 0 if target hires is negative', () => {
    expect(optimizer.getMinBonusForTarget(0, -100, linearAdoption100, 1e-3)).toBe(0);
  });

  it('should return null if days are 0 and target is positive', () => {
    expect(optimizer.getMinBonusForTarget(0, 100, linearAdoption100, 1e-3)).toBe(null);
  });

  it('should return null if target is unachievable even at very large bonus', () => {
    const days = 1;
    const target = 101; // Max expected hires in 1 day is 100 (p = 1)

    const bonus = 1_000_000;
    const optimizer = new ReferralBonusOptimizer(simulator, bonus);

    const res = optimizer.getMinBonusForTarget(days, target, linearAdoption100, 1e-3);
    expect(res).toBeNull();
  });

  it('should only return multiples of the bonus increment ($10)', () => {
    const res = optimizer.getMinBonusForTarget(1, 5, linearAdoption100, 1e-3);
    expect(res).not.toBeNull();
    expect(res! % 10).toBe(0);

    const res2 = optimizer.getMinBonusForTarget(1, 15, linearAdoption100, 1e-3);
    expect(res2).not.toBeNull();
    expect(res2! % 10).toBe(0);

    const res3 = optimizer.getMinBonusForTarget(1, 25, linearAdoption100, 1e-3);
    expect(res3).not.toBeNull();
    expect(res3! % 10).toBe(0);
  });

  it('should return exact multiple of $10 when target is a multiple of 10', () => {
    // For days=1, total = 100 * p = 100 * (bonus/100) = bonus
    // So target 50 -> min bonus 50
    const res = optimizer.getMinBonusForTarget(1, 50, linearAdoption100, 1e-3);
    expect(res).toBe(50);
  });

  it('should return 0 if the target is achievable with no bonus', () => {
    // With linearWithInterceptAdpotion100:
    // Bonus = 0 => p = 0.05
    // Hence, day 1 hires = 100 * 0.05 = 5
    const res = optimizer.getMinBonusForTarget(1, 5, linearWithInterceptAdpotion100, 1e-3);
    expect(res).toBe(0);
  });

  it('should round up to nearest $10 when required', () => {
    // Target 55 -> bonus must be >= 55, but bonuses are in $10 increments => 60
    const res = optimizer.getMinBonusForTarget(1, 55, linearAdoption100, 1e-3);
    expect(res).toBe(60);
  });

  it('should require non-decreasing bonuses for increasing targets (monotonicity)', () => {
    const days = 3;
    const t1 = 80;
    const t2 = 200;

    const b1 = optimizer.getMinBonusForTarget(days, t1, linearAdoption1000, 1e-3) ?? Infinity;
    const b2 = optimizer.getMinBonusForTarget(days, t2, linearAdoption1000, 1e-3) ?? Infinity;

    expect(b2).toBeGreaterThanOrEqual(b1);
  });
});
import { NetworkGrowthSimulation } from '../src/NetworkGrowthSimulation';

describe('Netowrk Growth Simulation', () => {
  const simulation = new NetworkGrowthSimulation();

  describe('Simulate', () => {
    it('should throw when p is not in range [0, 1]', () => {
      expect(() => simulation.simulate(-0.1, 1)).toThrow();
      expect(() => simulation.simulate(1.1, 1)).toThrow();
    });

    it('should throw for non-integer days', () => {
      expect(() => simulation.simulate(0.1, 1.2)).toThrow();
    });

    it('should throw when days is negative', () => {
      expect(() => simulation.simulate(0.1, -1)).toThrow();
    });

    it('should simulate for correct number of days', () => {
      const results = simulation.simulate(0.1, 10);
      expect(results).toHaveLength(10);
    });

    it('should return all zeros when probability is 0', () => {
      const results = simulation.simulate(0, 100);
      expect(results).toHaveLength(100);
      expect(results.every((val) => val === 0)).toBe(true);
    });

    it('should return an empty array when days is 0', () => {
      const results = simulation.simulate(0.2, 0);
      expect(results).toHaveLength(0);
      expect(results).toEqual([]);
    });

    it('should model rapid growth correctly when probability is 1', () => {
      const results = simulation.simulate(1, 5);
      expect(results).toHaveLength(5);

      expect(results[0]).toBeCloseTo(100);
      expect(results[1]).toBeCloseTo(300);
      expect(results[4]).toBeGreaterThan(1000);
    });

    it('should correctly simulate for a single day', () => {
      const results = simulation.simulate(0.5, 1);
      expect(results).toHaveLength(1);
      expect(results[0]).toBeCloseTo(50);
    });

    it('should simulate increasing cumulative referrals', () => {
      const results = simulation.simulate(0.1, 10);
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThan(results[i - 1]);
      }
    });

    it('should return correct cumulative referrals for a basic scenario', () => {
      // Day 1: 10 referrals; Day 2: +21; ... while capacity remains.
      const results = simulation.simulate(0.1, 3);
      expect(results).toHaveLength(3);
      expect(results[0]).toBeCloseTo(10);
      expect(results[1]).toBeCloseTo(21);
      expect(results[2]).toBeGreaterThan(33);
    });

    it('should show a decelerating growth rate over a long period', () => {
      const days = 500;
      const results = simulation.simulate(0.2, days);
      expect(results).toHaveLength(days);

      // Calculate daily new referrals
      const dailyNewReferrals = [results[0]];
      for (let i = results.length - 1; i > 0; i--) {
        dailyNewReferrals.push(results[i] - results[i - 1]);
      }

      // Growth rate in the first 10 days should be higher than in the last 10 days
      const initialGrowth = dailyNewReferrals.slice(0, 10).reduce((a, b) => a + b, 0);
      const lateGrowth = dailyNewReferrals.slice(days - 10, days).reduce((a, b) => a + b, 0);

      expect(initialGrowth).toBeGreaterThan(lateGrowth);
    });
  });

  describe('Days to Target', () => {
    it('should throw when p is not in range [0, 1]', () => {
      expect(() => simulation.daysToTarget(-0.1, 10)).toThrow();
      expect(() => simulation.daysToTarget(1.1, 10)).toThrow();
    });

    it('should throw when targetTotal is not a non-negative integer', () => {
      expect(() => simulation.daysToTarget(0.1, -10)).toThrow();
      expect(() => simulation.daysToTarget(0.1, Number.NaN)).toThrow();
    });

    it('should return 0 when targetTotal is 0', () => {
      expect(simulation.daysToTarget(0.5, 0)).toBe(0);
    });

    it('should return Infinity when p = 0 with positive targetTotal', () => {
      expect(simulation.daysToTarget(0, 1)).toBe(Infinity);
    });

    it('should return the correct number of days for a basic target', () => {
      const days = simulation.daysToTarget(0.1, 100);

      // Progression: 10, 21, 33.1, 46.41, 61.053, 77.1583, 94.87413, 114.361553, 135.7977083, 159.37747913
      expect(days).toBe(8);
    });

    it('should return 1 day if the target is met on the first day', () => {
      const days = simulation.daysToTarget(0.5, 50);
      expect(days).toBe(1);
    });

    it('should return the correct number of days to reach the target', () => {
      const p = 0.2;
      const target = 500;

      const days = simulation.daysToTarget(p, target);
      expect(days).not.toBe(Infinity);

      const arr = simulation.simulate(p, days);
      const prev = days > 0 ? (simulation.simulate(p, days - 1).at(-1) ?? 0) : 0; // simulate one day less to get the previous day's total
      expect(arr.at(-1)).toBeGreaterThanOrEqual(target);
      expect(prev).toBeLessThan(target);
    });

    it('should return smaller or equal days to hit the same target for larger p', () => {
      const target = 2000;
      const d1 = simulation.daysToTarget(0.1, target);
      const d2 = simulation.daysToTarget(0.3, target);
      const d3 = simulation.daysToTarget(0.7, target);
      expect(d2).toBeLessThanOrEqual(d1);
      expect(d3).toBeLessThanOrEqual(d2);
    });

    it('should calculate days correctly for rapid growth (p=1)', () => {
      const days = simulation.daysToTarget(1, 1000);
      expect(days).toBe(4);
    });

    it('should handle a very large target total', () => {
      const days = simulation.daysToTarget(0.01, 10_000_000);
      expect(days).toBeGreaterThan(1000);
    });

    it('should return Infinity when target is practically unreachable', () => {
      const days = simulation.daysToTarget(0.000001, 1_000_000_000_000_000_000);
      expect(days).toBe(Infinity);
    });
  });
});

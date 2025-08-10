import { NetworkGrowthSimulation } from '../src/NetworkGrowthSimulation';

describe('Netowrk Growth Simulation', () => {
  let simulation: NetworkGrowthSimulation;

  beforeEach(() => {
    simulation = new NetworkGrowthSimulation();
  });

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
});

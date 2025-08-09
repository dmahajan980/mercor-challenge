import { ReferralNetwork } from '../src/ReferralNetwork';

describe('ReferralNetwork - Full Network Reach', () => {
  // Graph:
  //                  A
  //                /  \
  //               B    C
  //              / \    \\\
  //             D  E    F G J
  //                 \    \
  //                  H    I
  let network: ReferralNetwork;
  beforeEach(() => {
    network = new ReferralNetwork();
    network.registerUser('A');
    network.registerUser('B', 'A');
    network.registerUser('C', 'A');
    network.registerUser('D', 'B');
    network.registerUser('E', 'B');
    network.registerUser('H', 'E');
    network.registerUser('F', 'C');
    network.registerUser('G', 'C');
    network.registerUser('I', 'F');
    network.registerUser('J', 'C');
  });

  describe('Total referral count', () => {
    it('returns 0 for a leaf user', () => {
      // J is a leaf (no referrals)
      const total = network.getTotalReferralCount('J');
      expect(total).toBe(0);
    });

    it('counts both direct and indirect referrals via BFS (or equivalent traversal)', () => {
      // Expected totals:
      // A: B,C,D,E,H,F,G,I,J => 9
      // B: D,E,H => 3
      // C: F,G,I,J => 4
      // D:   => 0
      // E: H => 1
      // F: I => 1
      // G:   => 0
      // H:   => 0
      // I:   => 0
      // J:   => 0
      expect(network.getTotalReferralCount('A')).toBe(9);
      expect(network.getTotalReferralCount('B')).toBe(3);
      expect(network.getTotalReferralCount('C')).toBe(4);
      expect(network.getTotalReferralCount('D')).toBe(0);
      expect(network.getTotalReferralCount('E')).toBe(1);
      expect(network.getTotalReferralCount('F')).toBe(1);
      expect(network.getTotalReferralCount('G')).toBe(0);
      expect(network.getTotalReferralCount('H')).toBe(0);
      expect(network.getTotalReferralCount('I')).toBe(0);
      expect(network.getTotalReferralCount('J')).toBe(0);
    });

    it('throws when querying a non-existent user', () => {
      expect(() => network.getTotalReferralCount('NOPE')).toThrow();
    });

    it('computes the total referral count for a linear network', () => {
        const net = new ReferralNetwork();
        // A -> B -> C -> D -> E
        net.registerUser('A');
        net.registerUser('B', 'A');
        net.registerUser('C', 'B');
        net.registerUser('D', 'C');
        net.registerUser('E', 'D');

        expect(net.getTotalReferralCount('A')).toBe(4);
        expect(net.getTotalReferralCount('B')).toBe(3);
        expect(net.getTotalReferralCount('C')).toBe(2);
        expect(net.getTotalReferralCount('D')).toBe(1);
        expect(net.getTotalReferralCount('E')).toBe(0);
    });

    it('computes the total referral count across disjoint components', () => {
        const net = new ReferralNetwork();
        // Component 1: A -> (B -> D, C -> E)
        net.registerUser('A');
        net.registerUser('B', 'A');
        net.registerUser('C', 'A');

        // Component 2: X -> (Y, Z)
        net.registerUser('X');
        net.registerUser('Y', 'X');
        net.registerUser('Z', 'X');

        expect(net.getTotalReferralCount('A')).toBe(2);
        expect(net.getTotalReferralCount('B')).toBe(0);
        expect(net.getTotalReferralCount('C')).toBe(0);
        expect(net.getTotalReferralCount('X')).toBe(2);
        expect(net.getTotalReferralCount('Y')).toBe(0);
        expect(net.getTotalReferralCount('Z')).toBe(0);
    });

    it('updates the total referral count after deletions', () => {
        const net = new ReferralNetwork();
        net.registerUser('A');
        net.registerUser('B', 'A');
        net.registerUser('C', 'A');

        expect(net.getTotalReferralCount('A')).toBe(2);
        expect(net.getTotalReferralCount('B')).toBe(0);
        expect(net.getTotalReferralCount('C')).toBe(0);

        net.deleteUser('B');

        expect(net.getTotalReferralCount('A')).toBe(1);
        expect(net.getTotalReferralCount('C')).toBe(0);
        expect(() => net.getTotalReferralCount('B')).toThrow();
    });
  });

  describe('Top referrers by reach', () => {
    it('returns the top k referrers ordered by total referral count (desc)', () => {
      const top3 = network.getTopReferrersByReach(3);
      expect(top3).toEqual(['A', 'C', 'B']);
    });

    it('returns an empty list when k = 0', () => {
      const top0 = network.getTopReferrersByReach(0);
      expect(top0).toEqual([]);
    });

    it('returns all users if k exceeds the number of users, still ordered by reach', () => {
      const result = network.getTopReferrersByReach(100);

      // Expect at least the first three to match the known ranking
      expect(result.slice(0, 3)).toEqual(['A', 'C', 'B']);

      // And include all created users
      expect(result).toEqual(
        expect.arrayContaining(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']),
      );
    });

    it('computes the top referrers by reach for a linear network', () => {
      const net = new ReferralNetwork();
      // A -> B -> C -> D -> E
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'B');
      net.registerUser('D', 'C');
      net.registerUser('E', 'D');

      expect(net.getTopReferrersByReach(5)).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('computes the top referrers by reach for a network with disjoint components', () => {
      const net = new ReferralNetwork();
      // Component 1: A -> (B -> D, C -> E)
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');

      // Component 2: X -> (Y, Z)
      net.registerUser('X');
      net.registerUser('Y', 'X');
      net.registerUser('Z', 'X');

      expect(net.getTopReferrersByReach(2)).toEqual(expect.arrayContaining(['A', 'X']));
    });

    it('includes a correct top set when ties occur (order among ties is not asserted)', () => {
      const net = new ReferralNetwork();
      // A -> (B -> D, C -> E) yields tie between B and C (both reach 1)
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');
      net.registerUser('E', 'C');

      const topTwo = net.getTopReferrersByReach(2);

      // First should be A uniquely
      expect(topTwo[0]).toBe('A');

      // Second should be either B or C due to a tie
      expect(['B', 'C']).toContain(topTwo[1]);
    });

    it('updates the top referrers by reach after deletions', () => {
      const net = new ReferralNetwork();
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');

      const topTwo = net.getTopReferrersByReach(2);
      expect(topTwo[0]).toBe('A');
      expect(topTwo[1]).toBe('B');

      net.deleteUser('B');

      expect(net.getTopReferrersByReach(2)).toHaveLength(2);
      expect(net.getTopReferrersByReach(2)[0]).toBe('A');
      expect(['D', 'C']).toContain(net.getTopReferrersByReach(2)[1]);
      expect(net.getTopReferrersByReach(1)).toHaveLength(1);
      expect(net.getTopReferrersByReach(1)[0]).toBe('A');

      net.deleteUser('C');

      expect(net.getTopReferrersByReach(2)).toEqual(expect.arrayContaining(['A', 'D']));
    });
  });
});

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

  describe('Total Referral Count', () => {
    it('should return 0 for a leaf user', () => {
      // J is a leaf (no referrals)
      const total = network.getTotalReferralCount('J');
      expect(total).toBe(0);
    });

    it('should count both direct and indirect referrals', () => {
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

    it('should throw when querying a non-existent user', () => {
      expect(() => network.getTotalReferralCount('NOPE')).toThrow();
    });

    it('should correctly compute the total referral count for a linear network', () => {
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

    it('should correctly compute the total referral count across disjoint components', () => {
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

    it('should correctly compute the total referral count after deletion', () => {
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

  describe('Top Referrers by Reach', () => {
    it('should return the same number of referrers as k', () => {
      const top3 = network.getTopReferrersByReach(3);
      expect(top3).toHaveLength(3);
    });

    it('should return the top k referrers ordered by reach (desc)', () => {
      const top3 = network.getTopReferrersByReach(3);
      expect(top3).toHaveLength(3);
      expect(top3).toEqual([
        { id: 'A', score: 9 },
        { id: 'C', score: 4 },
        { id: 'B', score: 3 },
      ]);
    });

    it('should return an empty list when k = 0', () => {
      const top0 = network.getTopReferrersByReach(0);
      expect(top0).toHaveLength(0);
      expect(top0).toEqual([]);
    });

    it('should return all users if k exceeds the number of users, still ordered by reach', () => {
      const result = network.getTopReferrersByReach(100);
      expect(result).toHaveLength(10);

      // Expect at least the first three to match the known ranking
      expect(result.slice(0, 3)).toEqual([
        { id: 'A', score: 9 },
        { id: 'C', score: 4 },
        { id: 'B', score: 3 },
      ]);

      expect(result.slice(3)).toEqual(
        expect.arrayContaining([
          { id: 'E', score: 1 },
          { id: 'F', score: 1 },
        ]),
      );

      expect(result.slice(3)).toEqual(
        expect.arrayContaining([
          { id: 'D', score: 0 },
          { id: 'G', score: 0 },
          { id: 'H', score: 0 },
          { id: 'I', score: 0 },
          { id: 'J', score: 0 },
        ]),
      );
    });

    it('should correctly compute the top referrers by reach for a linear network', () => {
      const net = new ReferralNetwork();
      // A -> B -> C -> D -> E
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'B');
      net.registerUser('D', 'C');
      net.registerUser('E', 'D');

      expect(net.getTopReferrersByReach(5)).toEqual([
        { id: 'A', score: 4 },
        { id: 'B', score: 3 },
        { id: 'C', score: 2 },
        { id: 'D', score: 1 },
        { id: 'E', score: 0 },
      ]);
    });

    it('should correctly compute the top referrers by reach for a network with disjoint components', () => {
      const net = new ReferralNetwork();
      // Component 1: A -> B, C
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');

      // Component 2: X -> (Y, Z)
      net.registerUser('X');
      net.registerUser('Y', 'X');
      net.registerUser('Z', 'X');

      const top2 = net.getTopReferrersByReach(2);
      expect(top2).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 2 },
          { id: 'X', score: 2 },
        ]),
      );
    });

    it('should include a correct top set when ties occur (order among ties is not asserted)', () => {
      const net = new ReferralNetwork();
      // A -> (B -> D, C -> E) yields tie between B and C (both reach 1)
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');
      net.registerUser('E', 'C');

      const topThree = net.getTopReferrersByReach(3);

      // First should be A uniquely
      expect(topThree[0]).toEqual({ id: 'A', score: 4 });

      // Second should be either B or C due to a tie
      expect(topThree.slice(1)).toEqual(
        expect.arrayContaining([
          { id: 'B', score: 1 },
          { id: 'C', score: 1 },
        ]),
      );
    });

    it('should correctly compute the top referrers by reach after deletion', () => {
      const net = new ReferralNetwork();
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');

      const topTwo = net.getTopReferrersByReach(2);
      expect(topTwo).toEqual([
        { id: 'A', score: 3 },
        { id: 'B', score: 1 },
      ]);

      net.deleteUser('B');

      const topTwoAfterDeletion = net.getTopReferrersByReach(2);
      expect(topTwoAfterDeletion).toHaveLength(2);
      expect(topTwoAfterDeletion).toEqual([
        { id: 'A', score: 1 },
        { id: 'D', score: 0 },
      ]);
    });
  });
});

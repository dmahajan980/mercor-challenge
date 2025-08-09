import { ReferralNetwork } from '../src/ReferralNetwork';

describe('ReferralNetwork - Identify Influencers', () => {
  describe('Unique Reach Expansion', () => {
    it('does not return any users for an empty network', () => {
      const net = new ReferralNetwork();
      expect(net.getUniqueReachExpansion()).toEqual([]);
    });

    it('does not select users with no referrals', () => {
      const net = new ReferralNetwork();
      net.registerUser('A');

      // A has no downstream candidates; contributes nothing
      expect(net.getUniqueReachExpansion()).toEqual([]);
    });

    it('selects only one referrer in a single, linear network', () => {
      const net = new ReferralNetwork();

      // A -> B
      net.registerUser('A');
      net.registerUser('B', 'A');

      expect(net.getUniqueReachExpansion()).toEqual(['A']);
    });

    it('greedily chooses referrers to maximize new unique coverage in a simple tree network', () => {
      const net = new ReferralNetwork();
      //      A
      //     / \
      //    B   C
      //   /  \   \
      //  D    E   F
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');
      net.registerUser('E', 'B');
      net.registerUser('F', 'C');

      // Downstream sets:
      // A: {B,C,D,E,F} size 5
      // B: {D,E} size 2
      // C: {F} size 1
      // Leaves: {} size 0
      // Greedy ordering: A first (max gain 5). After A, no one adds new coverage (gain 0).
      expect(net.getUniqueReachExpansion()).toEqual(['A']);
    });

    it('handles disjoint components by selecting a covering set across components', () => {
      const net = new ReferralNetwork();
      // Component 1: A -> (B -> D, C)
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('D', 'B');

      // Component 2: X -> (Y -> Z)
      net.registerUser('X');
      net.registerUser('Y', 'X');
      net.registerUser('Z', 'Y');

      // Downstream:
      // A: {B,C,D}
      // B: {D}
      // C: {}
      // D: {}
      // X: {Y,Z}
      // Y: {Z}
      // Z: {}
      // Greedy picks A (gain 3), then X (gain 2). Others add 0 new.
      expect(net.getUniqueReachExpansion()).toEqual(['A', 'X']);
    });

    it('resolves overlapping coverage by picking the users that add most uncovered candidates', () => {
      const net = new ReferralNetwork();
      // Build overlap via two roots each with some depth
      //    A           X
      //   / \          |
      //  B   C         Y
      //     / \        |
      //    E   F       Z
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');
      net.registerUser('E', 'C');
      net.registerUser('F', 'C');

      // A: {B,C,E,F} size 4
      // B: {}
      // C: {E,F} size 2
      // E: {}
      // F: {}
      expect(net.getUniqueReachExpansion()).toEqual(['A']);

      net.registerUser('X');
      net.registerUser('Y', 'X');
      net.registerUser('Z', 'Y');

      // A: {B,C,E,F} size 4
      // C: {E,F} size 2
      // X: {Y,Z} size 2
      // Greedy: pick A first (gain 4). Then X adds 2 new. Order becomes ['A','X'].
      expect(net.getUniqueReachExpansion()).toEqual(['A', 'X']);
    });

    it('does not include users that add zero new candidates', () => {
      const net = new ReferralNetwork();
      //      A
      //     / \
      //    B   C
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');

      const result = net.getUniqueReachExpansion();

      // Only A contributes new downstream coverage. Others contribute 0.
      expect(result).toEqual(['A']);
      expect(result).not.toContain('B');
      expect(result).not.toContain('C');
    });
  });
});

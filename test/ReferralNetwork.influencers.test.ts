import { ReferralNetwork } from '../src/ReferralNetwork';

describe('ReferralNetwork - Identify Influencers', () => {
  describe('Unique Reach Expansion', () => {
    it('should not return any users for an empty network', () => {
      const net = new ReferralNetwork();
      expect(net.getUniqueReachExpansion()).toEqual([]);
    });

    it('should not select users with no referrals', () => {
      const net = new ReferralNetwork();
      net.registerUser('A');

      // A has no downstream candidates; contributes nothing
      expect(net.getUniqueReachExpansion()).toEqual([]);
    });

    it('should select only one referrer in a single, linear network', () => {
      const net = new ReferralNetwork();

      // A -> B
      net.registerUser('A');
      net.registerUser('B', 'A');

      expect(net.getUniqueReachExpansion()).toHaveLength(1);
      expect(net.getUniqueReachExpansion()).toEqual([{ id: 'A', score: 1 }]);
    });

    it('should greedily choose referrers to maximize new unique coverage in a simple tree network', () => {
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
      const result = net.getUniqueReachExpansion();
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ id: 'A', score: 5 }]);
    });

    it('should handle disjoint components by selecting a covering set across components', () => {
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
      const result = net.getUniqueReachExpansion();
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: 'A', score: 3 },
        { id: 'X', score: 2 },
      ]);
    });

    it('should resolve overlapping coverage by picking the users that add most uncovered candidates', () => {
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
      const result = net.getUniqueReachExpansion();
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ id: 'A', score: 4 }]);

      net.registerUser('X');
      net.registerUser('Y', 'X');
      net.registerUser('Z', 'Y');

      // A: {B,C,E,F} size 4
      // C: {E,F} size 2
      // X: {Y,Z} size 2
      // Greedy: pick A first (gain 4). Then X adds 2 new. Order becomes ['A','X'].
      const resultPostAddition = net.getUniqueReachExpansion();
      expect(resultPostAddition).toHaveLength(2);
      expect(resultPostAddition).toEqual([
        { id: 'A', score: 4 },
        { id: 'X', score: 2 },
      ]);
    });

    it('should not include users that add zero new candidates', () => {
      const net = new ReferralNetwork();
      //      A
      //     / \
      //    B   C
      net.registerUser('A');
      net.registerUser('B', 'A');
      net.registerUser('C', 'A');

      const result = net.getUniqueReachExpansion();

      // Only A contributes new downstream coverage. Others contribute 0.
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ id: 'A', score: 2 }]);
    });
  });

  describe('Flow Centrality', () => {
    let network: ReferralNetwork;

    beforeEach(() => {
      network = new ReferralNetwork();
    });

    it('should correctly calculate scores for a simple linear chain', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'B');
      network.registerUser('D', 'C');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(4);
      expect(actualScores.slice(0, 2)).toEqual(
        expect.arrayContaining([
          { id: 'B', score: 2 },
          { id: 'C', score: 2 },
        ]),
      );
      expect(actualScores.slice(2)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'D', score: 0 },
        ]),
      );
    });

    test('should correctly calculate scores for a simple tree network', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      network.registerUser('D', 'A');

      expect(network.getFlowCentrality()).toHaveLength(4);
      expect(network.getFlowCentrality()).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'B', score: 0 },
          { id: 'C', score: 0 },
          { id: 'D', score: 0 },
        ]),
      );
    });

    test('should return an empty array for an empty network', () => {
      expect(network.getFlowCentrality()).toHaveLength(0);
      expect(network.getFlowCentrality()).toEqual([]);
    });

    test('should return a score of 0 for a single-user network', () => {
      network.registerUser('A');
      expect(network.getFlowCentrality()).toHaveLength(1);
      expect(network.getFlowCentrality()).toEqual([{ id: 'A', score: 0 }]);
    });

    test('should calculate scores independently for disconnected components', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('X');
      network.registerUser('Y', 'X');
      network.registerUser('Z', 'Y');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(5);
      expect(actualScores.slice(0, 1)).toEqual(expect.arrayContaining([{ id: 'Y', score: 1 }]));
      expect(actualScores.slice(1)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'B', score: 0 },
          { id: 'X', score: 0 },
          { id: 'Z', score: 0 },
        ]),
      );
    });

    test('should correctly calculate scores for a deep, asymmetrical tree', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'B');
      network.registerUser('D', 'B');
      network.registerUser('E', 'C');
      network.registerUser('F', 'D');
      network.registerUser('G', 'D');
      network.registerUser('H', 'G');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(8);
      expect(actualScores.slice(0, 2)).toEqual(
        expect.arrayContaining([
          { id: 'B', score: 6 },
          { id: 'D', score: 6 },
        ]),
      );
      expect(actualScores.slice(2, 4)).toEqual(
        expect.arrayContaining([
          { id: 'G', score: 3 },
          { id: 'C', score: 2 },
        ]),
      );
      expect(actualScores.slice(4)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'E', score: 0 },
          { id: 'F', score: 0 },
          { id: 'H', score: 0 },
        ]),
      );
    });

    test('should give all nodes a score of 0 if they are all roots', () => {
      network.registerUser('A');
      network.registerUser('B');
      network.registerUser('C');

      expect(network.getFlowCentrality()).toHaveLength(3);
      expect(network.getFlowCentrality()).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'B', score: 0 },
          { id: 'C', score: 0 },
        ]),
      );
    });

    test('should give all nodes a score of 0 in a star network', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      network.registerUser('D', 'A');
      network.registerUser('E', 'A');

      expect(network.getFlowCentrality()).toHaveLength(5);
      expect(network.getFlowCentrality()).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'B', score: 0 },
          { id: 'C', score: 0 },
          { id: 'D', score: 0 },
          { id: 'E', score: 0 },
        ]),
      );
    });

    test('should correctly calculate scores for a balanced-ish tree', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      network.registerUser('D', 'B');
      network.registerUser('E', 'B');
      network.registerUser('F', 'C');
      network.registerUser('G', 'C');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(7);
      expect(actualScores.slice(0, 2)).toEqual(
        expect.arrayContaining([
          { id: 'B', score: 2 },
          { id: 'C', score: 2 },
        ]),
      );
      expect(actualScores.slice(2)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'D', score: 0 },
          { id: 'E', score: 0 },
          { id: 'F', score: 0 },
          { id: 'G', score: 0 },
        ]),
      );
    });

    test('should correctly calculate scores for a long spine with a short side branch', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'B');
      network.registerUser('D', 'C');
      network.registerUser('E', 'A');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(5);
      expect(actualScores.slice(0, 2)).toEqual(
        expect.arrayContaining([
          { id: 'B', score: 2 },
          { id: 'C', score: 2 },
        ]),
      );
      expect(actualScores.slice(2)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'D', score: 0 },
          { id: 'E', score: 0 },
        ]),
      );
    });

    test('should correctly calculate scores for a heavily skewed tree with mid-layer branches', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'B');
      network.registerUser('F', 'B');
      network.registerUser('G', 'B');
      network.registerUser('D', 'C');
      network.registerUser('E', 'D');
      network.registerUser('H', 'G');
      network.registerUser('I', 'H');

      const actualScores = network.getFlowCentrality();
      expect(actualScores).toHaveLength(9);
      expect(actualScores[0]).toEqual({ id: 'B', score: 7 });
      expect(actualScores.slice(1, 3)).toEqual(
        expect.arrayContaining([
          { id: 'C', score: 4 },
          { id: 'G', score: 4 },
        ]),
      );
      expect(actualScores.slice(3, 5)).toEqual(
        expect.arrayContaining([
          { id: 'D', score: 3 },
          { id: 'H', score: 3 },
        ]),
      );
      expect(actualScores.slice(5)).toEqual(
        expect.arrayContaining([
          { id: 'A', score: 0 },
          { id: 'F', score: 0 },
          { id: 'E', score: 0 },
          { id: 'I', score: 0 },
        ]),
      );
    });
  });
});

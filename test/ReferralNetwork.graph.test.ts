import { ReferralNetwork } from '../src/ReferralNetwork';

describe('ReferralNetwork - Referral Graph', () => {
  let network: ReferralNetwork;

  beforeEach(() => {
    network = new ReferralNetwork();
  });

  describe('User details', () => {
    it("can query for an user's details", () => {
      network.registerUser('A');
      expect(network.getUserDetails('A')).toBeDefined();
    });

    it('throws error when querying for non-existent user', () => {
      expect(() => network.getUserDetails('NOPE')).toThrow();
    });
  });

  describe('Direct referrals', () => {
    it('can get direct referrals for an user', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      expect(network.getDirectReferrals('A')).toEqual(['B', 'C']);
    });

    it('returns empty list when getting direct referrals for an user with no referrals', () => {
      network.registerUser('A');
      expect(network.getDirectReferrals('A')).toEqual([]);
    });

    it('throws error when getting direct referrals for non-existent user', () => {
      expect(() => network.getDirectReferrals('NOPE')).toThrow();
    });
  });

  describe('Registering users', () => {
    it('can add an user without a referrer', () => {
      network.registerUser('A');
      expect(network.getUserDetails('A')).toBeDefined();
    });

    it('can add an user with a referrer', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');

      const details = network.getUserDetails('B');
      expect(details).toBeDefined();
      expect(details?.referrerId).toBe('A');
    });

    it('cannot register an user with self as referrer', () => {
      expect(() => network.registerUser('A', 'A')).toThrow();
    });

    it('cannot register an user with an invalid referrer/user', () => {
      expect(() => network.registerUser('A', 'B')).toThrow();
    });

    it('cannot re-register an user', () => {
      network.registerUser('A');
      expect(() => network.registerUser('A')).toThrow();
    });
  });

  describe('Linking users', () => {
    it('can link an user to a referrer', () => {
      network.registerUser('A');
      network.registerUser('B');
      network.linkUserToReferrer('A', 'B');
      expect(network.getUserDetails('B')?.referrerId).toBe('A');
    });

    it('cannot set self as a referrer', () => {
      network.registerUser('A');
      expect(() => network.linkUserToReferrer('A', 'A')).toThrow();
    });

    it('cannot link an user to a non-existing referrer/user', () => {
      network.registerUser('A');
      expect(() => network.linkUserToReferrer('B', 'A')).toThrow();
    });

    it('cannot link an user to a referrer that is already linked to another user', () => {
      network.registerUser('A');
      network.registerUser('B');
      network.linkUserToReferrer('A', 'B');
      expect(() => network.linkUserToReferrer('A', 'C')).toThrow();
    });

    it('cannot link if the linkage makes the network cyclic', () => {
      network.registerUser('A');
      network.registerUser('B');
      network.registerUser('C');
      network.linkUserToReferrer('A', 'B');
      network.linkUserToReferrer('B', 'C');
      expect(() => network.linkUserToReferrer('C', 'A')).toThrow();
    });

    it('cannot link an user that already has a referrer', () => {
      network.registerUser('A');
      network.registerUser('B');
      network.registerUser('C');
      network.linkUserToReferrer('A', 'C');
      expect(() => network.linkUserToReferrer('B', 'C')).toThrow();
    });
  });

  describe('Deleting users', () => {
    it("deleting an user removes them from their referrer and nullifies their referrals' referrers", () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'B');

      // Preconditions
      expect(network.getUserDetails('A').referrerId).toBeNull();
      expect(network.getUserDetails('B').referrerId).toBe('A');
      expect(network.getUserDetails('C').referrerId).toBe('B');
      expect(network.getDirectReferrals('A')).toContain('B');
      expect(network.getDirectReferrals('B')).toContain('C');

      // Delete B
      network.deleteUser('B');

      // B removed from A's referrals
      expect(network.getUserDetails('A').referrerId).toBeNull();
      expect(network.getDirectReferrals('A')).not.toContain('B');

      // C becomes root (referrerId null)
      expect(network.getUserDetails('C').referrerId).toBeNull();
    });

    it('deleteUser throws for non-existent user', () => {
      expect(() => network.deleteUser('MISSING')).toThrow();
    });

    it('deleting a root with multiple referrals makes them roots and preserves their subtrees', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      network.registerUser('D', 'B');

      // Preconditions
      expect(network.getUserDetails('B').referrerId).toBe('A');
      expect(network.getUserDetails('C').referrerId).toBe('A');
      expect(network.getUserDetails('D').referrerId).toBe('B');
      expect(network.getDirectReferrals('A')).toEqual(['B', 'C']);
      expect(network.getDirectReferrals('B')).toEqual(['D']);

      // Delete root A
      network.deleteUser('A');

      // B and C become roots
      expect(network.getUserDetails('B').referrerId).toBeNull();
      expect(network.getUserDetails('C').referrerId).toBeNull();

      // D still under B
      expect(network.getUserDetails('D').referrerId).toBe('B');
      expect(network.getDirectReferrals('B')).toEqual(['D']);
    });
  });
});

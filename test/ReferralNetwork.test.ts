import { ReferralNetwork } from '../src/ReferralNetwork';

describe('ReferralNetwork (direct referrals only)', () => {
  let network: ReferralNetwork;

  beforeEach(() => {
    network = new ReferralNetwork();
  });

  describe('network', () => {
    it("can query for an user's details", () => {
      network.registerUser('A');
      expect(network.getUserDetails('A')).toBeDefined();
    });

    it('can get direct referrals for an user', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');
      network.registerUser('C', 'A');
      expect(network.getDirectReferrals('A')).toEqual(['B', 'C']);
    });

    it('can delete an user', () => {
      network.registerUser('A');
      network.deleteUser('A');
      console.log(network.getUserDetails('A'));
      
      expect(network.getUserDetails('A')).toBeNull();
    });
  });

  describe('registering candidates', () => {
    it('can add a candidate without a referrer', () => {
      network.registerUser('A');
      expect(network.getUserDetails('A')).toBeDefined();
    });

    it('can add a candidate with a referrer', () => {
      network.registerUser('A');
      network.registerUser('B', 'A');

      const details = network.getUserDetails('B');
      expect(details).toBeDefined();
      expect(details?.referrerId).toBe('A');
    });

    it('cannot register a candidate with an invalid referrer/user', () => {
      expect(() => network.registerUser('A', 'B')).toThrow();
    });

    it('cannot re-register a candidate', () => {
      network.registerUser('A');
      expect(() => network.registerUser('A')).toThrow();
    });
  });

  describe('linking users', () => {
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
  });
});

import { MinHeap } from '../src/entities/MinHeap';

describe('MinHeap', () => {
  let heap: MinHeap<number>;

  beforeEach(() => {
    heap = new MinHeap<number>((a, b) => a - b);
  });

  describe('peek()', () => {
    it('throws error when heap is empty', () => {
      expect(() => heap.peek()).toThrow();
    });

    it('returns the only element for single-element heap', () => {
      heap.add(7);
      expect(heap.peek()).toBe(7);
    });

    it('returns the minimum element for multiple elements', () => {
      heap.add(5);
      heap.add(3);
      heap.add(8);
      heap.add(1);
      expect(heap.peek()).toBe(1);
    });

    it('returns the next minimum element after single removal', () => {
      heap.add(5);
      heap.add(3);
      heap.add(8);
      heap.add(1);
      heap.remove();
      expect(heap.peek()).toBe(3);
    });

    it('returns the minimum element after multiple removals', () => {
      heap.add(5);
      heap.add(3);
      heap.add(8);
      heap.add(1);
      heap.remove();
      heap.remove();
      expect(heap.peek()).toBe(5);
    });
  });

  describe('add()', () => {
    it('adds elements in ascending order', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      expect(heap.toArray()).toEqual([1, 3, 4, 5, 8]);
    });
  });

  describe('remove()', () => {
    it('throws error when heap is empty', () => {
      expect(() => heap.remove()).toThrow();
    });

    it('removes the minimum element', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      heap.remove();
      expect(heap.peek()).toBe(3);
    });

    it('removes the next minimum element after single removal', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      heap.remove();
      expect(heap.peek()).toBe(3);
    });

    it('removes the next minimum element after multiple removals', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      heap.remove();
      heap.remove();
      expect(heap.peek()).toBe(4);
    });

    it('removes all elements in ascending order', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      const sorted: number[] = [];
      while (heap.size > 0) {
        sorted.push(heap.peek());
        heap.remove();
      }
      expect(sorted).toEqual([1, 3, 4, 5, 8]);
    });
  });

  describe('toArray()', () => {
    it('returns the elements in ascending order', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      expect(heap.toArray()).toEqual([1, 3, 4, 5, 8]);
    });

    it('does not modify the heap', () => {
      [5, 3, 8, 1, 4].forEach((n) => heap.add(n));
      const copy = heap.toArray();
      expect(heap.toArray()).toEqual(copy);
    });
  });

  describe('duplicates and ties', () => {
    it('handles duplicate values correctly', () => {
      const heap = new MinHeap<number>((a, b) => a - b);
      [2, 2, 1, 1, 3].forEach((n) => heap.add(n));

      expect(heap.peek()).toBe(1);
      heap.remove();
      expect(heap.peek()).toBe(1);
      heap.remove();

      expect(heap.peek()).toBe(2);
      heap.remove();
      expect(heap.peek()).toBe(2);
      heap.remove();

      expect(heap.peek()).toBe(3);
      heap.remove();

      expect(heap.size).toBe(0);
    });
  });

  describe('custom comparator', () => {
    type Node = { key: string; weight: number };

    it('orders objects by provided comparator (weight asc)', () => {
      const heap = new MinHeap<Node>((a, b) => a.weight - b.weight);
      heap.add({ key: 'x', weight: 10 });
      heap.add({ key: 'y', weight: 3 });
      heap.add({ key: 'z', weight: 7 });

      expect(heap.peek().key).toBe('y');
      heap.remove();
      expect(heap.peek().key).toBe('z');
      heap.remove();
      expect(heap.peek().key).toBe('x');
      heap.remove();
      expect(heap.size).toBe(0);
    });

    it('can behave like a max-heap with inverted comparator', () => {
      const heap = new MinHeap<number>((a, b) => b - a); // max-heap
      [5, 1, 7, 3].forEach((n) => heap.add(n));

      expect(heap.peek()).toBe(7);
      heap.remove();
      expect(heap.peek()).toBe(5);
      heap.remove();
      expect(heap.peek()).toBe(3);
      heap.remove();
      expect(heap.peek()).toBe(1);
      heap.remove();
      expect(heap.size).toBe(0);
    });
  });

  describe('data types and values', () => {
    it('works with strings using lexicographic order', () => {
      const heap = new MinHeap<string>((a, b) => a.localeCompare(b));
      ['delta', 'alpha', 'charlie', 'bravo'].forEach((s) => heap.add(s));
      const out: string[] = [];
      while (heap.size > 0) {
        out.push(heap.peek());
        heap.remove();
      }
      expect(out).toEqual(['alpha', 'bravo', 'charlie', 'delta']);
    });

    it('handles negative numbers and zeros', () => {
      const heap = new MinHeap<number>((a, b) => a - b);
      [0, -10, 5, -1, 0].forEach((n) => heap.add(n));
      const out: number[] = [];
      while (heap.size > 0) {
        out.push(heap.peek());
        heap.remove();
      }
      expect(out).toEqual([-10, -1, 0, 0, 5]);
    });
  });
});

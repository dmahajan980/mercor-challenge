class MinHeap<T> {
  private heap: T[];

  constructor(private compare: (a: T, b: T) => number) {
    this.heap = [];
  }

  /**
   * Gets the size of the heap.
   *
   * @returns {number} The size of the heap.
   */
  public get size(): number {
    return this.heap.length;
  }

  /**
   * Adds an element to the heap.
   *
   * @param {T} element - The element to add to the heap.
   */
  public add(element: T): void {
    this.heap.push(element);
    this._heapifyUp(this.size - 1);
  }

  /**
   * Gets the top element of the heap.
   *
   * @returns {T} The top element of the heap.
   * @throws {Error} If the heap is empty.
   */
  public peek(): T {
    if (this.size === 0) {
      throw new Error('Heap is empty');
    }
    
    return this.heap[0];
  }

  /**
   * Removes and returns the top element of the heap.
   *
   * @throws {Error} If the heap is empty.
   */
  public remove(): void {
    if (this.size === 0) {
      throw new Error('Heap is empty');
    }

    this.heap[0] = this.heap[this.size - 1];
    this.heap.pop();
    this._heapifyDown(0);
  }

  /**
   * Maps the heap to an array of values.
   *
   * @returns {T[]} The array of values.
   */
  public toArray(): T[] {
    const backup = [...this.heap];
    const result: T[] = [];
    while (this.size > 0) {
      result.push(this.peek());
      this.remove();
    }

    // Restore the heap.
    this.heap = backup;
    return result;
  }

  /**
   * Gets the index of the left child of the element at the given index.
   *
   * @param {number} index - The index of the element to get the left child of.
   * @returns {number} The index of the left child of the element at the given index.
   */
  private _getLeftChildIndex = (index: number) => 2 * index + 1;

  /**
   * Checks if the element at the given index has a left child.
   *
   * @param {number} index - The index of the element to check if it has a left child.
   * @returns {boolean} True if the element at the given index has a left child, false otherwise.
   */
  private _hasLeftChild = (index: number) => this._getLeftChildIndex(index) < this.size;

  /**
   * Gets the index of the right child of the element at the given index.
   *
   * @param {number} index - The index of the element to get the right child of.
   * @returns {number} The index of the right child of the element at the given index.
   */
  private _getRightChildIndex = (index: number) => 2 * index + 2;

  /**
   * Checks if the element at the given index has a right child.
   *
   * @param {number} index - The index of the element to check if it has a right child.
   * @returns {boolean} True if the element at the given index has a right child, false otherwise.
   */
  private _hasRightChild = (index: number) => this._getRightChildIndex(index) < this.size;

  /**
   * Gets the index of the parent of the element at the given index.
   *
   * @param {number} index - The index of the element to get the parent of.
   * @returns {number} The index of the parent of the element at the given index.
   */
  private _getParentIndex = (index: number) => Math.floor((index - 1) / 2);

  /**
   * Checks if the element at the given index has a parent.
   *
   * @param {number} index - The index of the element to check if it has a parent.
   * @returns {boolean} True if the element at the given index has a parent, false otherwise.
   */
  private _hasParent = (index: number) => this._getParentIndex(index) >= 0;

  /**
   * Swaps the elements at the given indices.
   *
   * @param {number} index1 - The index of the first element to swap.
   * @param {number} index2 - The index of the second element to swap.
   */
  private _swap(index1: number, index2: number): void {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  /**
   * Heapifies the heap up from the given index.
   *
   * @param {number} index - The index of the element to get.
   * @returns {T} The element at the given index.
   */
  private _heapifyUp(index: number): void {
    let parentIndex = this._getParentIndex(index);
    let currentIndex = index;

    // Process only if the node has a parent and the current node is smaller than the parent.
    while (this._hasParent(currentIndex) && this.compare(this.heap[currentIndex], this.heap[parentIndex]) < 0) {
      // Move the current element up the heap.
      this._swap(currentIndex, parentIndex);
      currentIndex = parentIndex;
      parentIndex = this._getParentIndex(currentIndex);
    }
  }

  /**
   * Heapifies the heap down from the given index.
   *
   * @param {number} index - The index of the element to heapify down.
   */
  private _heapifyDown(index: number): void {
    let currentIndex = index;
    
    // Process only if the node has at least one child.
    while (this._hasLeftChild(currentIndex)) {
      let smallerChildIndex = this._getLeftChildIndex(currentIndex);

      // If the node has a right child, and it's smaller than the left child, use the right child.
      if (this._hasRightChild(currentIndex) && this.compare(this.heap[this._getRightChildIndex(currentIndex)], this.heap[smallerChildIndex]) < 0) {
        smallerChildIndex = this._getRightChildIndex(currentIndex);
      }

      // If the current node is smaller than the smaller child, stop.
      if (this.compare(this.heap[currentIndex], this.heap[smallerChildIndex]) < 0) {
        break;
      }

      // Swap the current node with the smaller child.
      this._swap(currentIndex, smallerChildIndex);
      currentIndex = smallerChildIndex;
    }
  }
}

export { MinHeap };

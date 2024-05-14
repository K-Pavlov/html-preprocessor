export class Node<T> {
  data: T;
  adjacent: Map<T, Node<T>> = new Map();

  constructor(data: T) {
    this.data = data;
  }

  addAdjacent(node: Node<T>): void {
    let existing = this.adjacent.get(node.data);
    if (existing) return;

    this.adjacent.set(node.data, node);
  }

  removeAdjacent(data: T): Node<T> | undefined {
    let existing = this.adjacent.get(data);
    this.adjacent.delete(data);

    return existing;
  }
}

export class Graph<T> {
  nodes: Map<T, Node<T>> = new Map();

  /**
   * Add a new node if it was not added before
   *
   * @param {T} data
   * @returns {Node<T>}
   */
  addNode(data: T): Node<T> {
    let node = this.nodes.get(data);

    if (node) return node;

    node = new Node(data);
    this.nodes.set(data, node);

    return node;
  }

  /**
   * Remove a node, also remove it from other nodes adjacency list
   *
   * @param {T} data
   * @returns {Node<T> | null}
   */
  removeNode(data: T): Node<T> | null {
    const nodeToRemove = this.nodes.get(data);

    if (!nodeToRemove) return null;

    this.nodes.forEach((node) => {
      node.removeAdjacent(nodeToRemove.data);
    });

    this.nodes.delete(data);

    return nodeToRemove;
  }

  /**
   * Create an edge between two nodes
   *
   * @param {T} source
   * @param {T} destination
   */
  addEdge(source: T, destination: T): void {
    const sourceNode = this.addNode(source);
    const destinationNode = this.addNode(destination);

    sourceNode.addAdjacent(destinationNode);
  }

  /**
   * Remove an edge between two nodes
   *
   * @param {T} source
   * @param {T} destination
   */
  removeEdge(source: T, destination: T): void {
    const sourceNode = this.nodes.get(source);
    const destinationNode = this.nodes.get(destination);

    if (sourceNode && destinationNode) {
      sourceNode.removeAdjacent(destination);
    }
  }

  /**
   * Depth-first search
   *
   * @param {T} data
   * @param {Map<T, boolean>} visited
   * @returns
   */
  private depthFirstSearchAux(node: Node<T>, visited: Map<T, boolean>): void {
    if (!node) return;

    visited.set(node.data, true);

    console.log(node.data);

    node.adjacent.forEach((item) => {
      if (!visited.has(item.data)) {
        this.depthFirstSearchAux(item, visited);
      }
    });
  }

  depthFirstSearch() {
    const visited: Map<T, boolean> = new Map();
    this.nodes.forEach((node) => {
      if (!visited.has(node.data)) {
        this.depthFirstSearchAux(node, visited);
      }
    });
  }

  /**
   * Breadth-first search
   *
   * @param {T} data
   * @returns
   */
  private breadthFirstSearchAux(node: Node<T>, visited: Map<T, boolean>): void {
    const queue: Queue<Node<T>> = new Queue();

    if (!node) return;

    queue.add(node);
    visited.set(node.data, true);

    while (!queue.isEmpty) {
      node = queue.remove();

      if (!node) continue;

      console.log(node.data);

      node.adjacent.forEach((item) => {
        if (!visited.has(item.data)) {
          visited.set(item.data, true);
          queue.add(item);
        }
      });
    }
  }

  breadthFirstSearch() {
    const visited: Map<T, boolean> = new Map();
    this.nodes.forEach((node) => {
      if (!visited.has(node.data)) {
        this.breadthFirstSearchAux(node, visited);
      }
    });
  }

  private hasCycle(node: Node<T>, path: T[] = []): T[] | undefined {
    if (path.includes(node.data)) return path;

    for (const child of [...node.adjacent.values()]) {
      const res = this.hasCycle(child, [...path, node.data]);
      if (res) return res;
    }

    return undefined;
  }

  hasAnyCycle() {
    for (const node of [...this.nodes.values()]) {
      const res = this.hasCycle(node);
      if (res) return res;
    }

    return undefined;
  }
}

class Queue<T> {
  public constructor(
    private elements: Record<number, T> = {},
    private head: number = 0,
    private tail: number = 0
  ) {}

  public add(element: T): void {
    this.elements[this.tail] = element;
    this.tail++;
  }

  public remove(): T {
    const item = this.elements[this.head];
    delete this.elements[this.head];
    this.head++;

    return item!;
  }

  public peek(): T {
    return this.elements[this.head]!;
  }

  public get length(): number {
    return this.tail - this.head;
  }

  public get isEmpty(): boolean {
    return this.length === 0;
  }
}

function getNodeId(node) {
  return node.id ?? node;
}

class UnionFind {
  constructor(nodes) {
    this.parent = {};
    this.rank = {};

    nodes.forEach((node) => {
      const nodeId = getNodeId(node);
      this.parent[nodeId] = nodeId;
      this.rank[nodeId] = 0;
    });
  }

  find(nodeId) {
    // Path compression keeps future lookups short and easy.
    if (this.parent[nodeId] !== nodeId) {
      this.parent[nodeId] = this.find(this.parent[nodeId]);
    }

    return this.parent[nodeId];
  }

  union(firstNode, secondNode) {
    const firstRoot = this.find(firstNode);
    const secondRoot = this.find(secondNode);

    if (firstRoot === secondRoot) {
      return false;
    }

    // Union by rank attaches the smaller tree under the larger tree.
    if (this.rank[firstRoot] < this.rank[secondRoot]) {
      this.parent[firstRoot] = secondRoot;
    } else if (this.rank[firstRoot] > this.rank[secondRoot]) {
      this.parent[secondRoot] = firstRoot;
    } else {
      this.parent[secondRoot] = firstRoot;
      this.rank[firstRoot] += 1;
    }

    return true;
  }
}

function sortEdgesByWeight(edges) {
  return [...edges].sort((firstEdge, secondEdge) => {
    if (firstEdge.weight !== secondEdge.weight) {
      return firstEdge.weight - secondEdge.weight;
    }

    return firstEdge.id.localeCompare(secondEdge.id);
  });
}

function formatEdges(edges) {
  if (edges.length === 0) {
    return 'none';
  }

  return edges.map((edge) => `${edge.id} (${edge.weight})`).join(', ');
}

function createStep({
  explanation,
  currentEdge = null,
  selectedEdges = [],
  mstEdges = [],
  rejectedEdges = [],
  totalWeight = 0,
}) {
  return {
    explanation,
    currentNode: null,
    visitedNodes: [],
    currentEdge,
    selectedEdges: [...selectedEdges],
    shortestPathEdges: [],
    mstEdges: [...mstEdges],
    distances: {},
    rejectedEdges: [...rejectedEdges],
    totalWeight,
  };
}

// Kruskal builds an MST by scanning edges from cheapest to most expensive.
export function kruskal(graph) {
  const sortedEdges = sortEdgesByWeight(graph.edges);
  const unionFind = new UnionFind(graph.nodes);
  const mstEdges = [];
  const rejectedEdges = [];
  const steps = [
    createStep({
      explanation: `Sort all edges by weight: ${formatEdges(sortedEdges)}.`,
      selectedEdges: sortedEdges.map((edge) => edge.id),
    }),
  ];
  let totalWeight = 0;

  for (const edge of sortedEdges) {
    if (mstEdges.length === graph.nodes.length - 1) {
      break;
    }

    steps.push(
      createStep({
        explanation: `Consider edge ${edge.id} with weight ${edge.weight}. Check whether ${edge.source} and ${edge.target} are already connected.`,
        currentEdge: edge.id,
        selectedEdges: [edge.id],
        mstEdges,
        rejectedEdges,
        totalWeight,
      }),
    );

    if (unionFind.find(edge.source) === unionFind.find(edge.target)) {
      rejectedEdges.push(edge.id);

      steps.push(
        createStep({
          explanation: `Reject ${edge.id} because ${edge.source} and ${edge.target} are already connected, so adding it would create a cycle.`,
          currentEdge: edge.id,
          selectedEdges: [edge.id],
          mstEdges,
          rejectedEdges,
          totalWeight,
        }),
      );
      continue;
    }

    unionFind.union(edge.source, edge.target);
    mstEdges.push(edge.id);
    totalWeight += edge.weight;

    steps.push(
      createStep({
        explanation: `Accept ${edge.id}. It connects two different components, so it becomes part of the MST. Total MST weight: ${totalWeight}.`,
        currentEdge: edge.id,
        selectedEdges: [edge.id],
        mstEdges,
        rejectedEdges,
        totalWeight,
      }),
    );
  }

  const isConnected = mstEdges.length === Math.max(graph.nodes.length - 1, 0);

  steps.push(
    createStep({
      explanation: isConnected
        ? `Kruskal finishes. Final MST edges: ${mstEdges.join(', ')}. Total MST weight: ${totalWeight}. Rejected edges: ${rejectedEdges.length ? rejectedEdges.join(', ') : 'none'}.`
        : `Kruskal stops with a minimum spanning forest because the graph is disconnected. Selected edges: ${mstEdges.join(', ') || 'none'}. Total weight: ${totalWeight}. Rejected edges: ${rejectedEdges.length ? rejectedEdges.join(', ') : 'none'}.`,
      selectedEdges: [],
      mstEdges,
      rejectedEdges,
      totalWeight,
    }),
  );

  return steps;
}

export const runKruskal = kruskal;

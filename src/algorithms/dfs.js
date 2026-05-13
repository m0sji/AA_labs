function getNodeId(node) {
  return node.id ?? node;
}

function buildAdjacencyList(graph) {
  const adjacencyList = new Map();

  graph.nodes.forEach((node) => {
    adjacencyList.set(getNodeId(node), []);
  });

  // The graph is undirected, so every edge is added in both directions.
  graph.edges.forEach((edge) => {
    adjacencyList.get(edge.source).push({ node: edge.target, edgeId: edge.id });
    adjacencyList.get(edge.target).push({ node: edge.source, edgeId: edge.id });
  });

  return adjacencyList;
}

function createStep({
  explanation,
  currentNode = null,
  visitedNodes = [],
  currentEdge = null,
  selectedEdges = [],
}) {
  return {
    explanation,
    currentNode,
    visitedNodes: [...visitedNodes],
    currentEdge,
    selectedEdges: [...selectedEdges],
    shortestPathEdges: [],
    mstEdges: [],
    distances: {},
  };
}

function getStartNode(graph, requestedStartNode) {
  return requestedStartNode ?? (graph.nodes[0] ? getNodeId(graph.nodes[0]) : null);
}

// Depth-First Search follows one path as far as possible before backtracking.
export function dfs(graph, startNode) {
  const actualStartNode = getStartNode(graph, startNode);

  if (!actualStartNode || !graph.nodes.some((node) => getNodeId(node) === actualStartNode)) {
    return [
      createStep({
        explanation: 'DFS needs a valid starting node before it can start.',
      }),
    ];
  }

  const adjacencyList = buildAdjacencyList(graph);
  const visited = new Set();
  const visitOrder = [];
  const traversalEdges = [];
  const steps = [
    createStep({
      explanation: `DFS starts at node ${actualStartNode}. The visited list is empty, and ${actualStartNode} is chosen as the first node.`,
      currentNode: actualStartNode,
    }),
  ];

  function visit(nodeId, edgeUsedToEnter = null) {
    visited.add(nodeId);
    visitOrder.push(nodeId);

    steps.push(
      createStep({
        explanation: `Visit node ${nodeId}. Mark it as visited. Current DFS order: ${visitOrder.join(', ')}.`,
        currentNode: nodeId,
        visitedNodes: visitOrder,
        currentEdge: edgeUsedToEnter,
        selectedEdges: traversalEdges,
      }),
    );

    adjacencyList.get(nodeId).forEach((neighbor) => {
      if (visited.has(neighbor.node)) {
        steps.push(
          createStep({
            explanation: `Skip ${neighbor.node} from ${nodeId} because ${neighbor.node} has already been visited.`,
            currentNode: nodeId,
            visitedNodes: visitOrder,
            currentEdge: neighbor.edgeId,
            selectedEdges: traversalEdges,
          }),
        );
        return;
      }

      traversalEdges.push(neighbor.edgeId);
      steps.push(
        createStep({
          explanation: `Move from ${nodeId} to unvisited neighbor ${neighbor.node} using edge ${neighbor.edgeId}.`,
          currentNode: neighbor.node,
          visitedNodes: visitOrder,
          currentEdge: neighbor.edgeId,
          selectedEdges: traversalEdges,
        }),
      );

      visit(neighbor.node, neighbor.edgeId);
    });
  }

  visit(actualStartNode);

  steps.push(
    createStep({
      explanation: `DFS finishes. Final DFS visit order: ${visitOrder.join(', ')}.`,
      currentNode: visitOrder.at(-1),
      visitedNodes: visitOrder,
      selectedEdges: traversalEdges,
    }),
  );

  return steps;
}

export const runDfs = dfs;

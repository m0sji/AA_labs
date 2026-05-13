function getNodeId(node) {
  return node.id ?? node;
}

function buildAdjacencyList(graph) {
  const adjacencyList = new Map();

  graph.nodes.forEach((node) => {
    adjacencyList.set(getNodeId(node), []);
  });

  // Dijkstra needs edge weights, and the current graph is undirected.
  graph.edges.forEach((edge) => {
    adjacencyList.get(edge.source).push({
      node: edge.target,
      edgeId: edge.id,
      weight: edge.weight,
    });
    adjacencyList.get(edge.target).push({
      node: edge.source,
      edgeId: edge.id,
      weight: edge.weight,
    });
  });

  return adjacencyList;
}

function getStartNode(graph, requestedStartNode) {
  return requestedStartNode ?? (graph.nodes[0] ? getNodeId(graph.nodes[0]) : null);
}

function createInitialDistances(graph, startNode) {
  const distances = {};

  graph.nodes.forEach((node) => {
    distances[getNodeId(node)] = Number.POSITIVE_INFINITY;
  });

  distances[startNode] = 0;
  return distances;
}

function formatDistances(distances) {
  const formatted = {};

  Object.entries(distances).forEach(([nodeId, distance]) => {
    formatted[nodeId] = distance === Number.POSITIVE_INFINITY ? 'Infinity' : distance;
  });

  return formatted;
}

function formatDistanceList(distances) {
  return Object.entries(formatDistances(distances))
    .map(([nodeId, distance]) => `${nodeId}: ${distance}`)
    .join(', ');
}

function formatPreviousNodes(previousNodes) {
  const entries = Object.entries(previousNodes).filter(([, previousNode]) => previousNode !== null);

  if (entries.length === 0) {
    return 'none yet';
  }

  return entries.map(([nodeId, previousNode]) => `${nodeId} <- ${previousNode}`).join(', ');
}

function getShortestPathTreeEdges(previousEdges) {
  return Object.values(previousEdges).filter(Boolean);
}

function getFinalizedTreeEdges(finalizedNodes, previousEdges) {
  return finalizedNodes
    .map((nodeId) => previousEdges[nodeId])
    .filter(Boolean);
}

function findClosestUnvisitedNode(graph, finalizedNodes, distances) {
  let closestNode = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  graph.nodes.forEach((node) => {
    const nodeId = getNodeId(node);

    if (finalizedNodes.has(nodeId)) {
      return;
    }

    if (distances[nodeId] < closestDistance) {
      closestNode = nodeId;
      closestDistance = distances[nodeId];
    }
  });

  return closestNode;
}

function createStep({
  explanation,
  currentNode = null,
  visitedNodes = [],
  currentEdge = null,
  selectedEdges = [],
  shortestPathEdges = [],
  distances,
  previousNodes,
}) {
  return {
    explanation,
    currentNode,
    visitedNodes: [...visitedNodes],
    currentEdge,
    selectedEdges: [...selectedEdges],
    shortestPathEdges: [...shortestPathEdges],
    mstEdges: [],
    distances: formatDistances(distances),
    previousNodes: { ...previousNodes },
  };
}

// Dijkstra finds the shortest distance from one start node to every other node.
export function dijkstra(graph, startNode) {
  const actualStartNode = getStartNode(graph, startNode);

  if (!actualStartNode || !graph.nodes.some((node) => getNodeId(node) === actualStartNode)) {
    return [
      {
        explanation: 'Dijkstra needs a valid starting node before it can start.',
        currentNode: null,
        visitedNodes: [],
        currentEdge: null,
        selectedEdges: [],
        shortestPathEdges: [],
        mstEdges: [],
        distances: {},
      },
    ];
  }

  const adjacencyList = buildAdjacencyList(graph);
  const distances = createInitialDistances(graph, actualStartNode);
  const previousNodes = {};
  const previousEdges = {};
  const finalizedNodes = new Set();
  const finalizedOrder = [];
  const steps = [];

  graph.nodes.forEach((node) => {
    const nodeId = getNodeId(node);
    previousNodes[nodeId] = null;
    previousEdges[nodeId] = null;
  });

  steps.push(
    createStep({
      explanation: `Create initial distances from ${actualStartNode}. Set ${actualStartNode} to 0 and every other node to Infinity. Distances: ${formatDistanceList(distances)}.`,
      currentNode: actualStartNode,
      distances,
      previousNodes,
    }),
  );

  while (finalizedNodes.size < graph.nodes.length) {
    const currentNode = findClosestUnvisitedNode(graph, finalizedNodes, distances);

    // If the graph had disconnected nodes, the remaining distances would stay Infinity.
    if (currentNode === null) {
      break;
    }

    const finalizedTreeEdges = getFinalizedTreeEdges(finalizedOrder, previousEdges);
    const currentTreeEdges = getShortestPathTreeEdges(previousEdges);

    steps.push(
      createStep({
        explanation: `Select ${currentNode} because it has the smallest unvisited distance (${distances[currentNode]}). Previous nodes: ${formatPreviousNodes(previousNodes)}.`,
        currentNode,
        visitedNodes: finalizedOrder,
        selectedEdges: finalizedTreeEdges,
        shortestPathEdges: currentTreeEdges,
        distances,
        previousNodes,
      }),
    );

    finalizedNodes.add(currentNode);
    finalizedOrder.push(currentNode);

    steps.push(
      createStep({
        explanation: `Finalize ${currentNode}. Its shortest distance from ${actualStartNode} is now locked at ${distances[currentNode]}.`,
        currentNode,
        visitedNodes: finalizedOrder,
        selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
        shortestPathEdges: getShortestPathTreeEdges(previousEdges),
        distances,
        previousNodes,
      }),
    );

    adjacencyList.get(currentNode).forEach((neighbor) => {
      const candidateDistance = distances[currentNode] + neighbor.weight;

      steps.push(
        createStep({
          explanation: `Check edge ${neighbor.edgeId}. Current distance to ${currentNode} is ${distances[currentNode]}, edge weight is ${neighbor.weight}, so the candidate distance to ${neighbor.node} is ${candidateDistance}.`,
          currentNode,
          visitedNodes: finalizedOrder,
          currentEdge: neighbor.edgeId,
          selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
          shortestPathEdges: getShortestPathTreeEdges(previousEdges),
          distances,
          previousNodes,
        }),
      );

      if (finalizedNodes.has(neighbor.node)) {
        steps.push(
          createStep({
            explanation: `Do not update ${neighbor.node}; it is already finalized with distance ${distances[neighbor.node]}.`,
            currentNode,
            visitedNodes: finalizedOrder,
            currentEdge: neighbor.edgeId,
            selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
            shortestPathEdges: getShortestPathTreeEdges(previousEdges),
            distances,
            previousNodes,
          }),
        );
        return;
      }

      if (candidateDistance < distances[neighbor.node]) {
        const oldDistance = formatDistances(distances)[neighbor.node];
        distances[neighbor.node] = candidateDistance;
        previousNodes[neighbor.node] = currentNode;
        previousEdges[neighbor.node] = neighbor.edgeId;

        steps.push(
          createStep({
            explanation: `Update ${neighbor.node}: ${candidateDistance} is better than ${oldDistance}. Set previous node of ${neighbor.node} to ${currentNode}.`,
            currentNode: neighbor.node,
            visitedNodes: finalizedOrder,
            currentEdge: neighbor.edgeId,
            selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
            shortestPathEdges: getShortestPathTreeEdges(previousEdges),
            distances,
            previousNodes,
          }),
        );
        return;
      }

      steps.push(
        createStep({
          explanation: `Do not update ${neighbor.node}: the current distance ${distances[neighbor.node]} is already better than or equal to ${candidateDistance}.`,
          currentNode,
          visitedNodes: finalizedOrder,
          currentEdge: neighbor.edgeId,
          selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
          shortestPathEdges: getShortestPathTreeEdges(previousEdges),
          distances,
          previousNodes,
        }),
      );
    });
  }

  steps.push(
    createStep({
      explanation: `Dijkstra finishes. Final shortest distances from ${actualStartNode}: ${formatDistanceList(distances)}.`,
      currentNode: finalizedOrder[finalizedOrder.length - 1] ?? null,
      visitedNodes: finalizedOrder,
      selectedEdges: getFinalizedTreeEdges(finalizedOrder, previousEdges),
      shortestPathEdges: getShortestPathTreeEdges(previousEdges),
      distances,
      previousNodes,
    }),
  );

  return steps;
}

export const runDijkstra = dijkstra;

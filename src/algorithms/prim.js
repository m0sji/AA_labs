function getNodeId(node) {
  return node.id ?? node;
}

function buildAdjacencyList(graph) {
  const adjacencyList = new Map();

  graph.nodes.forEach((node) => {
    adjacencyList.set(getNodeId(node), []);
  });

  // Prim works on an undirected weighted graph, so each edge is available both ways.
  graph.edges.forEach((edge) => {
    adjacencyList.get(edge.source).push({
      from: edge.source,
      to: edge.target,
      edgeId: edge.id,
      weight: edge.weight,
    });
    adjacencyList.get(edge.target).push({
      from: edge.target,
      to: edge.source,
      edgeId: edge.id,
      weight: edge.weight,
    });
  });

  return adjacencyList;
}

function formatCandidateEdges(candidateEdges) {
  if (candidateEdges.length === 0) {
    return 'none';
  }

  return candidateEdges
    .map((edge) => `${edge.edgeId} (${edge.weight})`)
    .join(', ');
}

function createStep({
  explanation,
  currentNode = null,
  visitedNodes = [],
  currentEdge = null,
  selectedEdges = [],
  mstEdges = [],
  candidateEdges = [],
  totalWeight = 0,
}) {
  return {
    explanation,
    currentNode,
    visitedNodes: [...visitedNodes],
    currentEdge,
    selectedEdges: [...selectedEdges],
    shortestPathEdges: [],
    mstEdges: [...mstEdges],
    distances: {},
    candidateEdges: candidateEdges.map((edge) => edge.edgeId),
    totalWeight,
  };
}

function sortCandidateEdges(candidateEdges) {
  candidateEdges.sort((firstEdge, secondEdge) => {
    if (firstEdge.weight !== secondEdge.weight) {
      return firstEdge.weight - secondEdge.weight;
    }

    return firstEdge.edgeId.localeCompare(secondEdge.edgeId);
  });
}

function addCandidateEdges(nodeId, adjacencyList, candidateEdges, includedNodes) {
  adjacencyList.get(nodeId).forEach((edge) => {
    const isAlreadyInTree = includedNodes.has(edge.to);
    const isAlreadyCandidate = candidateEdges.some((candidate) => candidate.edgeId === edge.edgeId);

    if (isAlreadyInTree || isAlreadyCandidate) {
      return;
    }

    candidateEdges.push(edge);
  });
  sortCandidateEdges(candidateEdges);
}

function getStartNode(graph, requestedStartNode) {
  return requestedStartNode ?? (graph.nodes[0] ? getNodeId(graph.nodes[0]) : null);
}

// Prim grows a minimum spanning tree by always choosing the cheapest edge to a new node.
export function prim(graph, startNode) {
  const actualStartNode = getStartNode(graph, startNode);

  if (!actualStartNode || !graph.nodes.some((node) => getNodeId(node) === actualStartNode)) {
    return [
      createStep({
        explanation: 'Prim needs a valid starting node before it can start.',
      }),
    ];
  }

  const adjacencyList = buildAdjacencyList(graph);
  const includedNodes = new Set();
  const candidateEdges = [];
  const mstEdges = [];
  const steps = [];
  let totalWeight = 0;

  includedNodes.add(actualStartNode);

  steps.push(
    createStep({
      explanation: `Prim starts at node ${actualStartNode}. Add ${actualStartNode} to the MST. Total MST weight: ${totalWeight}.`,
      currentNode: actualStartNode,
      visitedNodes: [...includedNodes],
      totalWeight,
    }),
  );

  addCandidateEdges(actualStartNode, adjacencyList, candidateEdges, includedNodes);

  steps.push(
    createStep({
      explanation: `Add all edges connected to ${actualStartNode} as candidates. Candidate edges: ${formatCandidateEdges(candidateEdges)}.`,
      currentNode: actualStartNode,
      visitedNodes: [...includedNodes],
      selectedEdges: candidateEdges.map((edge) => edge.edgeId),
      mstEdges,
      candidateEdges,
      totalWeight,
    }),
  );

  while (includedNodes.size < graph.nodes.length && candidateEdges.length > 0) {
    const candidateEdge = candidateEdges.shift();

    steps.push(
      createStep({
        explanation: `Check the smallest candidate edge ${candidateEdge.edgeId} with weight ${candidateEdge.weight}. Candidate edges left: ${formatCandidateEdges(candidateEdges)}.`,
        currentNode: candidateEdge.from,
        visitedNodes: [...includedNodes],
        currentEdge: candidateEdge.edgeId,
        selectedEdges: [candidateEdge.edgeId, ...candidateEdges.map((edge) => edge.edgeId)],
        mstEdges,
        candidateEdges,
        totalWeight,
      }),
    );

    if (includedNodes.has(candidateEdge.to)) {
      steps.push(
        createStep({
          explanation: `Skip ${candidateEdge.edgeId} because ${candidateEdge.to} is already in the MST, so this edge creates no useful expansion.`,
          currentNode: candidateEdge.from,
          visitedNodes: [...includedNodes],
          currentEdge: candidateEdge.edgeId,
          selectedEdges: candidateEdges.map((edge) => edge.edgeId),
          mstEdges,
          candidateEdges,
          totalWeight,
        }),
      );
      continue;
    }

    mstEdges.push(candidateEdge.edgeId);
    totalWeight += candidateEdge.weight;

    steps.push(
      createStep({
        explanation: `Select ${candidateEdge.edgeId}. It is the smallest valid edge and connects the MST to new node ${candidateEdge.to}.`,
        currentNode: candidateEdge.to,
        visitedNodes: [...includedNodes],
        currentEdge: candidateEdge.edgeId,
        selectedEdges: [candidateEdge.edgeId],
        mstEdges,
        candidateEdges,
        totalWeight,
      }),
    );

    includedNodes.add(candidateEdge.to);

    steps.push(
      createStep({
        explanation: `Add node ${candidateEdge.to} to the MST. Total MST weight is now ${totalWeight}.`,
        currentNode: candidateEdge.to,
        visitedNodes: [...includedNodes],
        currentEdge: candidateEdge.edgeId,
        selectedEdges: candidateEdges.map((edge) => edge.edgeId),
        mstEdges,
        candidateEdges,
        totalWeight,
      }),
    );

    addCandidateEdges(candidateEdge.to, adjacencyList, candidateEdges, includedNodes);

    steps.push(
      createStep({
        explanation: `Add edges connected to ${candidateEdge.to} as new candidates. Candidate edges: ${formatCandidateEdges(candidateEdges)}.`,
        currentNode: candidateEdge.to,
        visitedNodes: [...includedNodes],
        selectedEdges: candidateEdges.map((edge) => edge.edgeId),
        mstEdges,
        candidateEdges,
        totalWeight,
      }),
    );
  }

  const isConnected = includedNodes.size === graph.nodes.length;

  steps.push(
    createStep({
      explanation: isConnected
        ? `Prim finishes. Final MST edges: ${mstEdges.join(', ')}. Total MST weight: ${totalWeight}.`
        : `Prim stops because no candidate edges remain. The graph is disconnected, so these edges form a minimum spanning tree for the reachable component: ${mstEdges.join(', ') || 'none'}. Total weight: ${totalWeight}.`,
      currentNode: [...includedNodes].at(-1),
      visitedNodes: [...includedNodes],
      selectedEdges: [],
      mstEdges,
      totalWeight,
    }),
  );

  return steps;
}

export const runPrim = prim;

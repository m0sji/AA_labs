function getNodeId(node) {
  return node.id ?? node;
}

function buildAdjacencyList(graph) {
  const adjacencyList = new Map();

  graph.nodes.forEach((node) => {
    adjacencyList.set(getNodeId(node), []);
  });

  // The sample graph is undirected, so each edge can be followed both ways.
  graph.edges.forEach((edge) => {
    adjacencyList.get(edge.source).push({ node: edge.target, edgeId: edge.id });
    adjacencyList.get(edge.target).push({ node: edge.source, edgeId: edge.id });
  });

  return adjacencyList;
}

function formatQueue(queue) {
  return queue.length > 0 ? `[${queue.join(', ')}]` : '[]';
}

function createStep({
  explanation,
  currentNode = null,
  visitedNodes = [],
  currentEdge = null,
  selectedEdges = [],
  queue = [],
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
    queue: [...queue],
  };
}

function getStartNode(graph, requestedStartNode) {
  return requestedStartNode ?? (graph.nodes[0] ? getNodeId(graph.nodes[0]) : null);
}

// Breadth-First Search explores nodes level by level using a queue.
export function bfs(graph, startNode) {
  const actualStartNode = getStartNode(graph, startNode);

  if (!actualStartNode || !graph.nodes.some((node) => getNodeId(node) === actualStartNode)) {
    return [
      createStep({
        explanation: 'BFS needs a valid starting node before it can start.',
      }),
    ];
  }

  const adjacencyList = buildAdjacencyList(graph);
  const visited = new Set();
  const visitedNodes = [];
  const visitOrder = [];
  const traversalEdges = [];
  const queue = [];
  const steps = [
    createStep({
      explanation: `BFS starts at node ${actualStartNode}. The queue is empty: ${formatQueue(queue)}.`,
      currentNode: actualStartNode,
      queue,
    }),
  ];

  visited.add(actualStartNode);
  visitedNodes.push(actualStartNode);
  queue.push(actualStartNode);

  steps.push(
    createStep({
      explanation: `Add ${actualStartNode} to the queue and mark it as visited. Queue: ${formatQueue(queue)}.`,
      currentNode: actualStartNode,
      visitedNodes,
      queue,
    }),
  );

  while (queue.length > 0) {
    const currentNode = queue.shift();
    visitOrder.push(currentNode);

    steps.push(
      createStep({
        explanation: `Remove ${currentNode} from the front of the queue for processing. Queue: ${formatQueue(queue)}.`,
        currentNode,
        visitedNodes,
        selectedEdges: traversalEdges,
        queue,
      }),
    );

    adjacencyList.get(currentNode).forEach((neighbor) => {
      steps.push(
        createStep({
          explanation: `Check neighbor ${neighbor.node} from ${currentNode} using edge ${neighbor.edgeId}. Queue: ${formatQueue(queue)}.`,
          currentNode,
          visitedNodes,
          currentEdge: neighbor.edgeId,
          selectedEdges: traversalEdges,
          queue,
        }),
      );

      if (visited.has(neighbor.node)) {
        steps.push(
          createStep({
            explanation: `Skip ${neighbor.node} because it is already visited. Queue: ${formatQueue(queue)}.`,
            currentNode,
            visitedNodes,
            currentEdge: neighbor.edgeId,
            selectedEdges: traversalEdges,
            queue,
          }),
        );
        return;
      }

      visited.add(neighbor.node);
      visitedNodes.push(neighbor.node);
      traversalEdges.push(neighbor.edgeId);
      queue.push(neighbor.node);

      steps.push(
        createStep({
          explanation: `Add ${neighbor.node} to the back of the queue and mark it as visited. Queue: ${formatQueue(queue)}.`,
          currentNode: neighbor.node,
          visitedNodes,
          currentEdge: neighbor.edgeId,
          selectedEdges: traversalEdges,
          queue,
        }),
      );
    });
  }

  steps.push(
    createStep({
      explanation: `BFS finishes because the queue is empty. Final BFS visit order: ${visitOrder.join(', ')}. Queue: ${formatQueue(queue)}.`,
      currentNode: visitOrder.at(-1),
      visitedNodes,
      selectedEdges: traversalEdges,
      queue,
    }),
  );

  return steps;
}

export const runBfs = bfs;

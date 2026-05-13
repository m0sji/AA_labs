const INFINITY = Number.POSITIVE_INFINITY;
const INFINITY_LABEL = String.fromCharCode(8734);

function getNodeId(node) {
  return node.id ?? node;
}

function formatDistance(distance) {
  return distance === INFINITY ? INFINITY_LABEL : distance;
}

function createInitialMatrix(graph, nodeIds) {
  const matrix = {};

  nodeIds.forEach((fromNode) => {
    matrix[fromNode] = {};

    nodeIds.forEach((toNode) => {
      matrix[fromNode][toNode] = fromNode === toNode ? 0 : INFINITY;
    });
  });

  // The sample graph is undirected, so direct distances are filled both ways.
  graph.edges.forEach((edge) => {
    matrix[edge.source][edge.target] = edge.weight;
    matrix[edge.target][edge.source] = edge.weight;
  });

  return matrix;
}

function copyMatrix(matrix, nodeIds) {
  const copy = {};

  nodeIds.forEach((fromNode) => {
    copy[fromNode] = {};

    nodeIds.forEach((toNode) => {
      copy[fromNode][toNode] = matrix[fromNode][toNode];
    });
  });

  return copy;
}

function createStep({
  explanation,
  matrix,
  nodeIds,
  intermediateNode = null,
  updatedCell = null,
}) {
  return {
    explanation,
    matrix: copyMatrix(matrix, nodeIds),
    intermediateNode,
    updatedCell,
    currentNode: intermediateNode,
    visitedNodes: intermediateNode ? [intermediateNode] : [],
    currentEdge: null,
    selectedEdges: [],
    shortestPathEdges: [],
    mstEdges: [],
    distances: {},
  };
}

// Floyd-Warshall checks every possible intermediate node for every pair of nodes.
export function floydWarshall(graph) {
  const nodeIds = graph.nodes.map((node) => getNodeId(node));
  const matrix = createInitialMatrix(graph, nodeIds);
  const steps = [
    createStep({
      explanation:
        'Initialize the distance matrix: 0 from each node to itself, direct edge weights for neighbors, and infinity when no direct edge exists.',
      matrix,
      nodeIds,
    }),
  ];

  nodeIds.forEach((intermediateNode) => {
    steps.push(
      createStep({
        explanation: `Use ${intermediateNode} as the intermediate node. Every pair i -> j will be checked to see if going through ${intermediateNode} is shorter.`,
        matrix,
        nodeIds,
        intermediateNode,
      }),
    );

    nodeIds.forEach((fromNode) => {
      nodeIds.forEach((toNode) => {
        const currentDistance = matrix[fromNode][toNode];
        const distanceToIntermediate = matrix[fromNode][intermediateNode];
        const distanceFromIntermediate = matrix[intermediateNode][toNode];
        const candidateDistance = distanceToIntermediate + distanceFromIntermediate;

        if (candidateDistance < currentDistance) {
          steps.push(
            createStep({
              explanation: `Check ${fromNode} -> ${toNode} through ${intermediateNode}: ${formatDistance(distanceToIntermediate)} + ${formatDistance(distanceFromIntermediate)} = ${candidateDistance}, which is better than ${formatDistance(currentDistance)}.`,
              matrix,
              nodeIds,
              intermediateNode,
            }),
          );

          matrix[fromNode][toNode] = candidateDistance;

          steps.push(
            createStep({
              explanation: `Update matrix[${fromNode}][${toNode}] to ${candidateDistance}. The shortest known path now goes through ${intermediateNode}.`,
              matrix,
              nodeIds,
              intermediateNode,
              updatedCell: { from: fromNode, to: toNode },
            }),
          );
          return;
        }

        steps.push(
          createStep({
            explanation: `Check ${fromNode} -> ${toNode} through ${intermediateNode}: ${formatDistance(distanceToIntermediate)} + ${formatDistance(distanceFromIntermediate)} = ${formatDistance(candidateDistance)}. No update because the current distance is ${formatDistance(currentDistance)}.`,
            matrix,
            nodeIds,
            intermediateNode,
          }),
        );
      });
    });
  });

  steps.push(
    createStep({
      explanation: 'Floyd-Warshall finishes. The matrix now contains the shortest distance between every pair of nodes.',
      matrix,
      nodeIds,
    }),
  );

  return steps;
}

export const runFloydWarshall = floydWarshall;

import { useEffect, useMemo, useState } from 'react';
import AlgorithmControls from './components/AlgorithmControls.jsx';
import DistanceDisplay from './components/DistanceDisplay.jsx';
import DistanceMatrix from './components/DistanceMatrix.jsx';
import GraphEditor from './components/GraphEditor.jsx';
import GraphVisualizer from './components/GraphVisualizer.jsx';
import StepExplanation from './components/StepExplanation.jsx';
import { sampleGraph } from './data/sampleGraph.js';
import { runBfs } from './algorithms/bfs.js';
import { runDfs } from './algorithms/dfs.js';
import { runDijkstra } from './algorithms/dijkstra.js';
import { runFloydWarshall } from './algorithms/floydWarshall.js';
import { runKruskal } from './algorithms/kruskal.js';
import { runPrim } from './algorithms/prim.js';

const algorithms = [
  {
    id: 'dfs',
    name: 'DFS',
    fullName: 'Depth-First Search',
    description: 'Explore as far as possible along each path before backtracking.',
    educationalDescription:
      'DFS explores a graph by going as deep as possible before backtracking. It is used for maze solving, cycle checks, and exploring connected components. It works on weighted or unweighted graphs, but it ignores weights. Main idea: follow one branch until you cannot continue, then return and try another.',
    run: runDfs,
    usesStartNode: true,
  },
  {
    id: 'bfs',
    name: 'BFS',
    fullName: 'Breadth-First Search',
    description: 'Visit neighbors level by level from a starting node.',
    educationalDescription:
      'BFS explores a graph level by level from a start node. It is used to find the shortest number of edges in unweighted graphs, such as simple routing or social network distance. It can run on weighted graphs, but it treats every edge as equal. Main idea: use a queue so closer nodes are visited first.',
    run: runBfs,
    usesStartNode: true,
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra',
    fullName: "Dijkstra's Algorithm",
    description: 'Find shortest paths from one source when edge weights are non-negative.',
    educationalDescription:
      'Dijkstra finds the shortest weighted path from one start node to every other node. It is used in maps, routing, and network cost problems with non-negative weights. It is designed for weighted graphs. Main idea: repeatedly finalize the closest unvisited node and relax its outgoing edges.',
    run: runDijkstra,
    usesStartNode: true,
    requiresNonNegativeWeights: true,
  },
  {
    id: 'floyd-warshall',
    name: 'Floyd-Warshall',
    fullName: 'Floyd-Warshall Algorithm',
    description: 'Compare all possible intermediate nodes to find all-pairs shortest paths.',
    educationalDescription:
      'Floyd-Warshall finds the shortest distance between every pair of nodes. It is useful when you need all-pairs distances, such as comparing many routes in a small network. It works with weighted graphs and can handle negative edges if there are no negative cycles. Main idea: try each node as a possible middle stop.',
    run: runFloydWarshall,
    usesStartNode: false,
  },
  {
    id: 'prim',
    name: 'Prim',
    fullName: "Prim's Algorithm",
    description: 'Grow a minimum spanning tree one low-cost edge at a time.',
    educationalDescription:
      'Prim builds a minimum spanning tree that connects all nodes with the lowest total edge weight. It is used for network design, wiring, and road-planning style problems. It works on weighted undirected graphs. Main idea: grow one tree by always choosing the cheapest edge that reaches a new node.',
    run: runPrim,
    usesStartNode: true,
    requiresNonNegativeWeights: true,
  },
  {
    id: 'kruskal',
    name: 'Kruskal',
    fullName: "Kruskal's Algorithm",
    description: 'Sort edges by weight and add safe edges to a minimum spanning tree.',
    educationalDescription:
      'Kruskal builds a minimum spanning tree by choosing low-cost edges without creating cycles. It is used for the same network design problems as Prim. It works on weighted undirected graphs. Main idea: sort all edges by weight, then accept an edge only if it connects two separate groups.',
    run: runKruskal,
    usesStartNode: false,
    requiresNonNegativeWeights: true,
  },
];

function cloneGraph(graph) {
  return normalizeGraph(graph);
}

function normalizeGraph(graph) {
  const nodes = (graph.nodes ?? []).map((node) => normalizeNode(node));
  const nodeIds = new Set(nodes.map((node) => getNodeId(node)));

  return {
    nodes,
    edges: normalizeEdges(graph.edges ?? [], nodeIds),
  };
}

function getNodeId(node) {
  return node.id ?? node;
}

function normalizeNode(node) {
  const nodeId = getNodeId(node);
  const position = node.position;
  const hasPosition = Number.isFinite(Number(position?.x)) && Number.isFinite(Number(position?.y));

  return {
    id: nodeId,
    label: node.label ?? nodeId,
    position: hasPosition
      ? {
          x: Number(position.x),
          y: Number(position.y),
        }
      : undefined,
  };
}

function normalizeNodeLabel(label) {
  return label.trim().toUpperCase();
}

function createEdgeId(source, target) {
  return [source, target].sort((first, second) => first.localeCompare(second)).join('-');
}

function normalizeEdge(edge) {
  const edgeId = createEdgeId(edge.source, edge.target);
  const [source, target] = edgeId.split('-');
  const parsedWeight = Number(edge.weight);

  return {
    ...edge,
    id: edgeId,
    source,
    target,
    weight: Number.isFinite(parsedWeight) ? parsedWeight : 0,
  };
}

function normalizeEdges(edges, validNodeIds = null) {
  const seenEdgeIds = new Set();

  return edges
    .map((edge) => normalizeEdge(edge))
    .filter((edge) => {
      const connectsExistingNodes =
        !validNodeIds || (validNodeIds.has(edge.source) && validNodeIds.has(edge.target));

      if (
        !edge.source
        || !edge.target
        || edge.source === edge.target
        || !connectsExistingNodes
        || seenEdgeIds.has(edge.id)
      ) {
        return false;
      }

      seenEdgeIds.add(edge.id);
      return true;
    });
}

function getEffectiveGraph(graph, graphType) {
  if (graphType === 'weighted') {
    return graph;
  }

  return {
    nodes: graph.nodes,
    edges: graph.edges.map((edge) => ({
      ...edge,
      weight: 1,
    })),
  };
}

function layoutNodes(nodes) {
  const count = Math.max(nodes.length, 1);
  const centerX = 360;
  const centerY = 220;
  const radiusX = 280;
  const radiusY = 190;

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;

    return {
      ...node,
      position: {
        x: Math.round(centerX + radiusX * Math.cos(angle)),
        y: Math.round(centerY + radiusY * Math.sin(angle)),
      },
    };
  });
}

function hasNegativeWeights(graph) {
  return graph.edges.some((edge) => Number(edge.weight) < 0);
}

function getAllPossibleEdges(nodes) {
  const nodeIds = nodes.map((node) => getNodeId(node));
  const possibleEdges = [];

  // Every pair i < j gives one undirected edge. This avoids self-loops and duplicates.
  for (let firstIndex = 0; firstIndex < nodeIds.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < nodeIds.length; secondIndex += 1) {
      const edgeId = createEdgeId(nodeIds[firstIndex], nodeIds[secondIndex]);
      const [source, target] = edgeId.split('-');

      possibleEdges.push({ id: edgeId, source, target });
    }
  }

  return possibleEdges;
}

function getRandomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function parseRandomSettings({
  edgeCount,
  minimumWeight,
  maximumWeight,
  requireEdgeCount,
  requireWeights,
}) {
  const parsedEdgeCount = Number(edgeCount);
  const parsedMinimum = Number(minimumWeight);
  const parsedMaximum = Number(maximumWeight);

  if (requireEdgeCount && (!String(edgeCount).trim() || !Number.isInteger(parsedEdgeCount))) {
    return { ok: false, text: 'Enter a whole number of random edges to generate.' };
  }

  if (requireEdgeCount && parsedEdgeCount < 0) {
    return { ok: false, text: 'Number of random edges cannot be negative.' };
  }

  if (!requireWeights) {
    return {
      ok: true,
      edgeCount: parsedEdgeCount,
      minimumWeight: 1,
      maximumWeight: 1,
    };
  }

  if (!String(minimumWeight).trim() || !String(maximumWeight).trim()) {
    return { ok: false, text: 'Enter both minimum and maximum edge weights.' };
  }

  if (!Number.isInteger(parsedMinimum) || !Number.isInteger(parsedMaximum)) {
    return { ok: false, text: 'Random edge weights must be whole numbers.' };
  }

  if (parsedMinimum < 0 || parsedMaximum < 0) {
    return { ok: false, text: 'Random edge weights must be non-negative.' };
  }

  if (parsedMinimum > parsedMaximum) {
    return { ok: false, text: 'Minimum weight cannot be greater than maximum weight.' };
  }

  return {
    ok: true,
    edgeCount: parsedEdgeCount,
    minimumWeight: parsedMinimum,
    maximumWeight: parsedMaximum,
  };
}

function App() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithms[0]);
  const [graph, setGraph] = useState(() => cloneGraph(sampleGraph));
  const [graphType, setGraphType] = useState('weighted');
  const [startNode, setStartNode] = useState(sampleGraph.nodes[0] ? getNodeId(sampleGraph.nodes[0]) : '');
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentStep, setCurrentStep] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayDelay, setAutoPlayDelay] = useState(1000);
  const [statusMessage, setStatusMessage] = useState(null);
  const effectiveGraph = useMemo(() => getEffectiveGraph(graph, graphType), [graph, graphType]);
  const isWeightedGraph = graphType === 'weighted';
  const hasStarted = currentStepIndex >= 0;
  const isLastStep = hasStarted && currentStepIndex === steps.length - 1;
  const isFloydWarshall = selectedAlgorithm.id === 'floyd-warshall';

  useEffect(() => {
    if (!isAutoPlaying) {
      return undefined;
    }

    if (!hasStarted || isLastStep) {
      setIsAutoPlaying(false);
      return undefined;
    }

    // Use one timeout per step so React can clean it up whenever state changes.
    const timerId = window.setTimeout(() => {
      const nextStepIndex = currentStepIndex + 1;

      setCurrentStepIndex(nextStepIndex);
      setCurrentStep(steps[nextStepIndex] ?? null);

      if (nextStepIndex === steps.length - 1) {
        setIsAutoPlaying(false);
      }
    }, autoPlayDelay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [autoPlayDelay, currentStepIndex, hasStarted, isAutoPlaying, isLastStep, steps]);

  useEffect(() => {
    const startNodeExists = graph.nodes.some((node) => getNodeId(node) === startNode);

    if (!startNodeExists) {
      setStartNode(graph.nodes[0] ? getNodeId(graph.nodes[0]) : '');
    }
  }, [graph, startNode]);

  function handleAlgorithmChange(algorithmId) {
    const nextAlgorithm = algorithms.find((algorithm) => algorithm.id === algorithmId) ?? algorithms[0];

    setSelectedAlgorithm(nextAlgorithm);
    resetVisualization();
    setStatusMessage(null);
  }

  function handleStartNodeChange(nextStartNode) {
    setStartNode(nextStartNode);
    resetVisualization();
    setStatusMessage(null);
  }

  function handleGraphTypeChange(nextGraphType) {
    if (nextGraphType === graphType) {
      return;
    }

    setGraphType(nextGraphType);
    resetVisualization();
    setStatusMessage(null);
  }

  function startVisualization() {
    if (graph.nodes.length === 0) {
      setStatusMessage({ type: 'error', text: 'Add at least one node before starting an algorithm.' });
      return;
    }

    if (selectedAlgorithm.usesStartNode && !graph.nodes.some((node) => getNodeId(node) === startNode)) {
      setStatusMessage({ type: 'error', text: 'Choose a valid starting node before starting this algorithm.' });
      return;
    }

    if (selectedAlgorithm.requiresNonNegativeWeights && hasNegativeWeights(effectiveGraph)) {
      setStatusMessage({
        type: 'error',
        text: `${selectedAlgorithm.name} requires non-negative edge weights in this visualizer.`,
      });
      return;
    }

    // Each algorithm returns an ordered list of steps with explanation and highlight data.
    const generatedSteps = selectedAlgorithm.run(
      effectiveGraph,
      selectedAlgorithm.usesStartNode ? startNode : undefined,
    );

    setStatusMessage(null);
    setIsAutoPlaying(false);
    setSteps(generatedSteps);
    setCurrentStepIndex(generatedSteps.length > 0 ? 0 : -1);
    setCurrentStep(generatedSteps[0] ?? null);
  }

  function showNextStep() {
    if (!hasStarted || isLastStep) {
      return;
    }

    setIsAutoPlaying(false);
    const nextStepIndex = currentStepIndex + 1;

    setCurrentStepIndex(nextStepIndex);
    setCurrentStep(steps[nextStepIndex]);
  }

  function toggleAutoPlay() {
    if (!hasStarted || isLastStep) {
      return;
    }

    setIsAutoPlaying((isPlaying) => !isPlaying);
  }

  function resetVisualization() {
    setIsAutoPlaying(false);
    setSteps([]);
    setCurrentStepIndex(-1);
    setCurrentStep(null);
  }

  function applyGraphUpdate(nextGraph) {
    setGraph(normalizeGraph(nextGraph));
    resetVisualization();
    setStatusMessage(null);
  }

  function addNode(label) {
    const nodeId = normalizeNodeLabel(label);

    if (!nodeId) {
      return { ok: false, text: 'Node label cannot be empty.' };
    }

    if (nodeId.includes('-')) {
      return { ok: false, text: 'Use labels without hyphens because hyphens are reserved for edge IDs.' };
    }

    if (!/^[A-Z0-9_]+$/.test(nodeId)) {
      return { ok: false, text: 'Use letters, numbers, or underscores for node labels.' };
    }

    if (graph.nodes.some((node) => getNodeId(node) === nodeId)) {
      return { ok: false, text: `Node ${nodeId} already exists.` };
    }

    const nextNodes = layoutNodes([...graph.nodes.map((node) => normalizeNode(node)), { id: nodeId, label: nodeId }]);

    applyGraphUpdate({
      nodes: nextNodes,
      edges: graph.edges,
    });

    if (!startNode) {
      setStartNode(nodeId);
    }

    return { ok: true, text: `Node ${nodeId} added.` };
  }

  function addEdge(source, target, weightValue) {
    const normalizedSource = normalizeNodeLabel(source);
    const normalizedTarget = normalizeNodeLabel(target);
    const trimmedWeight = String(weightValue).trim();
    const parsedWeight = isWeightedGraph ? Number(trimmedWeight) : 1;

    if (!normalizedSource || !normalizedTarget) {
      return { ok: false, text: 'Choose both a source node and a target node.' };
    }

    if (normalizedSource === normalizedTarget) {
      return { ok: false, text: 'Source and target must be different nodes.' };
    }

    if (!graph.nodes.some((node) => getNodeId(node) === normalizedSource)) {
      return { ok: false, text: `Source node ${normalizedSource} does not exist.` };
    }

    if (!graph.nodes.some((node) => getNodeId(node) === normalizedTarget)) {
      return { ok: false, text: `Target node ${normalizedTarget} does not exist.` };
    }

    if (isWeightedGraph && !trimmedWeight) {
      return { ok: false, text: 'Enter a weight for the edge.' };
    }

    if (isWeightedGraph && !Number.isFinite(parsedWeight)) {
      return { ok: false, text: 'Edge weight must be a valid number.' };
    }

    if (isWeightedGraph && parsedWeight < 0) {
      return {
        ok: false,
        text: 'Use non-negative weights so Dijkstra, Prim, and Kruskal remain valid.',
      };
    }

    const edgeId = createEdgeId(normalizedSource, normalizedTarget);

    if (graph.edges.some((edge) => normalizeEdge(edge).id === edgeId)) {
      return {
        ok: false,
        text: `Edge ${edgeId} already exists. Because the graph is undirected, ${normalizedTarget}-${normalizedSource} is the same edge.`,
      };
    }

    const [sourceNode, targetNode] = edgeId.split('-');

    applyGraphUpdate({
      nodes: graph.nodes,
      edges: [
        ...graph.edges,
        {
          id: edgeId,
          source: sourceNode,
          target: targetNode,
          weight: parsedWeight,
        },
      ],
    });

    return {
      ok: true,
      text: isWeightedGraph
        ? `Edge ${edgeId} added with weight ${parsedWeight}.`
        : `Edge ${edgeId} added.`,
    };
  }

  function removeNode(nodeId) {
    const normalizedEdges = normalizeEdges(graph.edges);
    const removedEdgeCount = normalizedEdges.filter(
      (edge) => edge.source === nodeId || edge.target === nodeId,
    ).length;

    applyGraphUpdate({
      nodes: layoutNodes(graph.nodes.filter((node) => getNodeId(node) !== nodeId).map((node) => normalizeNode(node))),
      edges: normalizedEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    });

    return {
      ok: true,
      text: removedEdgeCount > 0
        ? `Node ${nodeId} removed. ${removedEdgeCount} connected edge${removedEdgeCount === 1 ? '' : 's'} also removed.`
        : `Node ${nodeId} removed.`,
    };
  }

  function removeEdge(edgeId) {
    applyGraphUpdate({
      nodes: graph.nodes,
      edges: graph.edges.filter((edge) => normalizeEdge(edge).id !== edgeId),
    });

    return { ok: true, text: `Edge ${edgeId} removed.` };
  }

  function clearGraph() {
    applyGraphUpdate({ nodes: [], edges: [] });
    setStartNode('');

    return { ok: true, text: 'Graph cleared and visualization reset.' };
  }

  function loadDefaultGraph() {
    const defaultGraph = cloneGraph(sampleGraph);

    applyGraphUpdate(defaultGraph);
    setStartNode(defaultGraph.nodes[0] ? getNodeId(defaultGraph.nodes[0]) : '');

    return { ok: true, text: 'Default sample graph loaded.' };
  }

  function generateRandomEdges({ edgeCount, minimumWeight, maximumWeight, keepExistingEdges }) {
    if (graph.nodes.length < 2) {
      return { ok: false, text: 'Please add at least 2 nodes before generating edges.' };
    }

    const parsed = parseRandomSettings({
      edgeCount,
      minimumWeight,
      maximumWeight,
      requireEdgeCount: true,
      requireWeights: isWeightedGraph,
    });

    if (!parsed.ok) {
      return parsed;
    }

    const possibleEdges = getAllPossibleEdges(graph.nodes);
    const maximumPossibleEdges = possibleEdges.length;
    const normalizedExistingEdges = normalizeEdges(graph.edges);
    const existingEdgeIds = new Set(
      keepExistingEdges ? normalizedExistingEdges.map((edge) => edge.id) : [],
    );
    const availableEdges = possibleEdges.filter((edge) => !existingEdgeIds.has(edge.id));
    const targetCount = Math.min(parsed.edgeCount, availableEdges.length);

    if (parsed.edgeCount === 0) {
      return { ok: false, text: 'Enter at least 1 random edge to generate.' };
    }

    if (targetCount === 0) {
      return {
        ok: false,
        type: 'info',
        text: 'No random edges were added because all possible undirected edges already exist.',
      };
    }

    const newEdges = shuffleItems(availableEdges)
      .slice(0, targetCount)
      .map((edge) => ({
        ...edge,
        weight: isWeightedGraph
          ? getRandomInteger(parsed.minimumWeight, parsed.maximumWeight)
          : 1,
      }));
    const nextEdges = keepExistingEdges ? [...normalizedExistingEdges, ...newEdges] : newEdges;

    applyGraphUpdate({
      nodes: graph.nodes.map((node) => normalizeNode(node)),
      edges: nextEdges,
    });

    if (targetCount < parsed.edgeCount) {
      if (keepExistingEdges) {
        return {
          ok: true,
          type: 'info',
          text: `Only ${targetCount} new edge${targetCount === 1 ? '' : 's'} could be generated because ${normalizedExistingEdges.length} edge${normalizedExistingEdges.length === 1 ? '' : 's'} already exist and the maximum possible for ${graph.nodes.length} nodes is ${maximumPossibleEdges}.`,
        };
      }

      return {
        ok: true,
        type: 'info',
        text: `Only ${maximumPossibleEdges} edges could be generated because that is the maximum possible for ${graph.nodes.length} nodes.`,
      };
    }

    return { ok: true, text: 'Random edges generated successfully.' };
  }

  function generateCompleteRandomGraph({ minimumWeight, maximumWeight }) {
    if (graph.nodes.length < 2) {
      return { ok: false, text: 'Please add at least 2 nodes before generating a complete graph.' };
    }

    const parsed = parseRandomSettings({
      edgeCount: 0,
      minimumWeight,
      maximumWeight,
      requireEdgeCount: false,
      requireWeights: isWeightedGraph,
    });

    if (!parsed.ok) {
      return parsed;
    }

    const completeEdges = getAllPossibleEdges(graph.nodes).map((edge) => ({
      ...edge,
      weight: isWeightedGraph
        ? getRandomInteger(parsed.minimumWeight, parsed.maximumWeight)
        : 1,
    }));

    applyGraphUpdate({
      nodes: graph.nodes.map((node) => normalizeNode(node)),
      edges: completeEdges,
    });

    return {
      ok: true,
      text: `Complete random graph generated with ${completeEdges.length} edge${completeEdges.length === 1 ? '' : 's'}.`,
    };
  }

  function randomizeNodePositions() {
    if (graph.nodes.length === 0) {
      return { ok: false, text: 'Add at least one node before randomizing positions.' };
    }

    const nextNodes = graph.nodes.map((node) => ({
      ...normalizeNode(node),
      position: {
        x: getRandomInteger(80, 640),
        y: getRandomInteger(60, 420),
      },
    }));

    applyGraphUpdate({
      nodes: nextNodes,
      edges: graph.edges,
    });

    return { ok: true, text: 'Node positions randomized successfully.' };
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Algorithm menu">
        <div className="brand-block">
          <p className="eyebrow">Classroom Demo</p>
          <h1>Graph Algorithms Visualizer</h1>
          <p className="brand-subtitle">Step-by-step graph learning with clear highlights.</p>
        </div>

        <p className="sidebar-section-title">Algorithms</p>
        <nav className="algorithm-list">
          {algorithms.map((algorithm, index) => (
            <button
              className={algorithm.id === selectedAlgorithm.id ? 'algorithm-button active' : 'algorithm-button'}
              key={algorithm.id}
              onClick={() => handleAlgorithmChange(algorithm.id)}
              type="button"
            >
              <span className="algorithm-number">{index + 1}</span>
              <span>{algorithm.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-area">
        <section className="workspace-header">
          <div className="workspace-title">
            <p className="eyebrow">Educational demonstration</p>
            <h1>Graph Algorithms Visualizer</h1>
            <p>
              Explore traversal, shortest-path, and minimum-spanning-tree algorithms on the
              current {isWeightedGraph ? 'weighted' : 'unweighted'} graph.
            </p>
            <div className="selected-summary">
              <span>Selected algorithm</span>
              <strong>{selectedAlgorithm.fullName}</strong>
              <p>{selectedAlgorithm.description}</p>
            </div>
          </div>

          <div className="control-panel">
            <div className="graph-type-control" aria-label="Graph type">
              <span>Graph type</span>
              <div className="segmented-control">
                <button
                  aria-pressed={isWeightedGraph}
                  className={isWeightedGraph ? 'active' : ''}
                  onClick={() => handleGraphTypeChange('weighted')}
                  type="button"
                >
                  Weighted
                </button>
                <button
                  aria-pressed={!isWeightedGraph}
                  className={!isWeightedGraph ? 'active' : ''}
                  onClick={() => handleGraphTypeChange('unweighted')}
                  type="button"
                >
                  Unweighted
                </button>
              </div>
            </div>

            {selectedAlgorithm.usesStartNode && (
              <label className="start-node-control" htmlFor="start-node">
                Start node
                <select
                  id="start-node"
                  onChange={(event) => handleStartNodeChange(event.target.value)}
                  value={startNode}
                >
                  {graph.nodes.length === 0 ? (
                    <option value="">No nodes</option>
                  ) : (
                    graph.nodes.map((node) => (
                      <option key={getNodeId(node)} value={getNodeId(node)}>
                        {getNodeId(node)}
                      </option>
                    ))
                  )}
                </select>
              </label>
            )}

            <AlgorithmControls
              hasStarted={hasStarted}
              isAutoPlaying={isAutoPlaying}
              isLastStep={isLastStep}
              autoPlayDelay={autoPlayDelay}
              onAutoPlayDelayChange={setAutoPlayDelay}
              onNextStep={showNextStep}
              onReset={resetVisualization}
              onStart={startVisualization}
              onToggleAutoPlay={toggleAutoPlay}
            />

            {statusMessage && (
              <p className={`status-message ${statusMessage.type}`}>{statusMessage.text}</p>
            )}
          </div>
        </section>

        <section className="content-grid">
          <div className="graph-workspace-column">
            <div className="graph-panel">
              <div className="panel-heading">
                <div className="panel-title-block">
                  <p className="eyebrow">Graph workspace</p>
                  <h3>Current {isWeightedGraph ? 'weighted' : 'unweighted'} graph</h3>
                  <p>Create a graph below, then run an algorithm step by step.</p>
                </div>
                <span className="step-count">
                  {hasStarted ? `Step ${currentStepIndex + 1} of ${steps.length}` : 'Ready'}
                </span>
              </div>

              <div className="graph-legend" aria-label="Graph color legend">
                <span className="legend-item">
                  <span className="legend-swatch current-node-swatch" />
                  Current node
                </span>
                <span className="legend-item">
                  <span className="legend-swatch visited-node-swatch" />
                  Visited
                </span>
                <span className="legend-item">
                  <span className="legend-line current-edge-swatch" />
                  Current edge
                </span>
                <span className="legend-item">
                  <span className="legend-line selected-edge-swatch" />
                  Traversal
                </span>
                <span className="legend-item">
                  <span className="legend-line shortest-path-swatch" />
                  Shortest path
                </span>
                <span className="legend-item">
                  <span className="legend-line mst-edge-swatch" />
                  MST
                </span>
              </div>

              <GraphVisualizer
                graph={effectiveGraph}
                showEdgeWeights={isWeightedGraph}
                currentNode={currentStep?.currentNode ?? null}
                visitedNodes={currentStep?.visitedNodes ?? []}
                currentEdge={currentStep?.currentEdge ?? null}
                selectedEdges={currentStep?.selectedEdges ?? []}
                shortestPathEdges={currentStep?.shortestPathEdges ?? []}
                mstEdges={currentStep?.mstEdges ?? []}
              />
            </div>

            <GraphEditor
              graph={graph}
              isWeightedGraph={isWeightedGraph}
              onAddEdge={addEdge}
              onAddNode={addNode}
              onClearGraph={clearGraph}
              onGenerateCompleteGraph={generateCompleteRandomGraph}
              onGenerateRandomEdges={generateRandomEdges}
              onLoadDefaultGraph={loadDefaultGraph}
              onRandomizeNodePositions={randomizeNodePositions}
              onRemoveEdge={removeEdge}
              onRemoveNode={removeNode}
            />
          </div>

          <aside className="side-panel">
            <StepExplanation
              algorithmDescription={selectedAlgorithm.educationalDescription}
              algorithmName={selectedAlgorithm.name}
              currentStep={currentStep}
              hasStarted={hasStarted}
            />
            <DistanceDisplay distances={currentStep?.distances} startNode={startNode} />
            <DistanceMatrix
              graph={effectiveGraph}
              matrix={isFloydWarshall ? currentStep?.matrix : null}
              updatedCell={isFloydWarshall ? currentStep?.updatedCell : null}
              eyebrow={isFloydWarshall ? 'All-pairs shortest paths' : 'Reference'}
              title={isFloydWarshall ? 'Floyd-Warshall matrix' : 'Distance matrix'}
            />
          </aside>
        </section>

        <footer className="app-footer">
          Educational visualization of graph algorithms.
        </footer>
      </main>
    </div>
  );
}

export default App;

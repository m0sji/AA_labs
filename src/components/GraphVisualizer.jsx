import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

function getNodeId(node) {
  return node.id ?? node;
}

function getNodeLabel(node) {
  return node.label ?? getNodeId(node);
}

function hasSavedPosition(node) {
  return Number.isFinite(node.position?.x) && Number.isFinite(node.position?.y);
}

function getFallbackPosition(index, totalNodes) {
  const count = Math.max(totalNodes, 1);
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;

  return {
    x: Math.round(360 + 280 * Math.cos(angle)),
    y: Math.round(220 + 190 * Math.sin(angle)),
  };
}

function buildElements(graph, useSavedPositions, showEdgeWeights) {
  const nodes = graph.nodes.map((node, index) => ({
    data: {
      id: getNodeId(node),
      label: getNodeLabel(node),
    },
    position: useSavedPositions
      ? node.position
      : getFallbackPosition(index, graph.nodes.length),
  }));

  const edges = graph.edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: showEdgeWeights ? String(edge.weight) : '',
      weight: edge.weight,
    },
  }));

  return [...nodes, ...edges];
}

function GraphVisualizer({
  graph,
  showEdgeWeights = true,
  currentNode = null,
  visitedNodes = [],
  currentEdge = null,
  selectedEdges = [],
  shortestPathEdges = [],
  mstEdges = [],
}) {
  const containerRef = useRef(null);
  const cytoscapeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }
    const useSavedPositions =
      graph.nodes.length > 0 && graph.nodes.every((node) => hasSavedPosition(node));

    function fitGraph() {
      if (cy.elements().length > 0) {
        cy.fit(undefined, 40);
      }
    }

    // Cytoscape owns the graph canvas. React only gives it a container element.
    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(graph, useSavedPositions, showEdgeWeights),
      layout: {
        name: useSavedPositions ? 'preset' : 'circle',
        padding: 40,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#f8fafc',
            'border-color': '#3b82f6',
            'border-width': 4,
            color: '#111827',
            'font-size': 20,
            'font-weight': 800,
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-color': '#ffffff',
            'text-outline-width': 3,
            width: 66,
            height: 66,
            'z-index': 10,
          },
        },
        {
          selector: 'edge',
          style: {
            color: '#334155',
            'curve-style': 'bezier',
            'font-size': 16,
            'font-weight': 800,
            label: 'data(label)',
            'line-color': '#cbd5e1',
            'line-style': 'solid',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': 6,
            'text-margin-y': -10,
            'text-rotation': 'autorotate',
            width: 4,
            'z-index': 1,
          },
        },
        {
          selector: '.visited-node',
          style: {
            'background-color': '#bbf7d0',
            'border-color': '#15803d',
            color: '#14532d',
            'z-index': 20,
          },
        },
        {
          selector: '.current-node',
          style: {
            'background-color': '#fef3c7',
            'border-color': '#f59e0b',
            'border-width': 7,
            color: '#78350f',
            width: 78,
            height: 78,
            'z-index': 40,
          },
        },
        {
          selector: '.selected-edge',
          style: {
            'line-color': '#f59e0b',
            color: '#92400e',
            width: 5,
            'z-index': 15,
          },
        },
        {
          selector: '.shortest-path-edge',
          style: {
            'line-color': '#8b5cf6',
            'line-style': 'dashed',
            color: '#5b21b6',
            width: 6,
            'z-index': 25,
          },
        },
        {
          selector: '.mst-edge',
          style: {
            'line-color': '#0f766e',
            color: '#115e59',
            width: 7,
            'z-index': 30,
          },
        },
        {
          selector: '.current-edge',
          style: {
            'line-color': '#ef4444',
            color: '#991b1b',
            width: 8,
            'z-index': 50,
          },
        },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });
    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(() => {
          cy.resize();
          fitGraph();
        })
      : null;

    cy.ready(() => {
      fitGraph();
    });

    resizeObserver?.observe(containerRef.current);

    cytoscapeRef.current = cy;

    return () => {
      resizeObserver?.disconnect();
      cy.destroy();
      cytoscapeRef.current = null;
    };
  }, [graph, showEdgeWeights]);

  useEffect(() => {
    const cy = cytoscapeRef.current;

    if (!cy) {
      return;
    }

    cy.elements().removeClass(
      'current-node visited-node current-edge selected-edge shortest-path-edge mst-edge',
    );

    // These props are simple IDs so future algorithm code can control the highlighting.
    visitedNodes.forEach((nodeId) => {
      cy.getElementById(nodeId).addClass('visited-node');
    });

    if (currentNode) {
      cy.getElementById(currentNode).addClass('current-node');
    }

    selectedEdges.forEach((edgeId) => {
      cy.getElementById(edgeId).addClass('selected-edge');
    });

    shortestPathEdges.forEach((edgeId) => {
      cy.getElementById(edgeId).addClass('shortest-path-edge');
    });

    mstEdges.forEach((edgeId) => {
      cy.getElementById(edgeId).addClass('mst-edge');
    });

    if (currentEdge) {
      cy.getElementById(currentEdge).addClass('current-edge');
    }
  }, [currentNode, visitedNodes, currentEdge, selectedEdges, shortestPathEdges, mstEdges]);

  return <div className="graph-canvas" ref={containerRef} />;
}

export default GraphVisualizer;

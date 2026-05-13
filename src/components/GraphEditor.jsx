import { useState } from 'react';

function getNodeId(node) {
  return node.id ?? node;
}

function createEdgeId(source, target) {
  return [source, target].sort((first, second) => first.localeCompare(second)).join('-');
}

function getNormalizedEdgeId(edge) {
  return createEdgeId(edge.source, edge.target);
}

function getMaximumUndirectedEdges(nodeCount) {
  return (nodeCount * (nodeCount - 1)) / 2;
}

function GraphEditor({
  graph,
  onAddEdge,
  onAddNode,
  onClearGraph,
  onGenerateCompleteGraph,
  onGenerateRandomEdges,
  onLoadDefaultGraph,
  onRandomizeNodePositions,
  onRemoveEdge,
  onRemoveNode,
}) {
  const [nodeLabel, setNodeLabel] = useState('');
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [weight, setWeight] = useState('');
  const [randomEdgeCount, setRandomEdgeCount] = useState('4');
  const [minimumWeight, setMinimumWeight] = useState('1');
  const [maximumWeight, setMaximumWeight] = useState('10');
  const [keepExistingEdges, setKeepExistingEdges] = useState(true);
  const [message, setMessage] = useState(null);
  const nodeCount = graph.nodes.length;
  const maximumEdgeCount = getMaximumUndirectedEdges(nodeCount);
  const currentUndirectedEdgeCount = new Set(graph.edges.map((edge) => getNormalizedEdgeId(edge))).size;
  const availableNewEdgeCount = Math.max(maximumEdgeCount - currentUndirectedEdgeCount, 0);

  function showResult(result) {
    setMessage(result);
  }

  function handleAddNode(event) {
    event.preventDefault();

    const result = onAddNode(nodeLabel);
    showResult(result);

    if (result.ok) {
      setNodeLabel('');
    }
  }

  function handleAddEdge(event) {
    event.preventDefault();

    const result = onAddEdge(sourceNode, targetNode, weight);
    showResult(result);

    if (result.ok) {
      setSourceNode('');
      setTargetNode('');
      setWeight('');
    }
  }

  function handleClearGraph() {
    showResult(onClearGraph());
    setSourceNode('');
    setTargetNode('');
    setWeight('');
  }

  function handleLoadDefaultGraph() {
    showResult(onLoadDefaultGraph());
    setSourceNode('');
    setTargetNode('');
    setWeight('');
  }

  function handleRemoveNode(nodeId) {
    showResult(onRemoveNode(nodeId));
  }

  function handleRemoveEdge(edgeId) {
    showResult(onRemoveEdge(edgeId));
  }

  function handleGenerateRandomEdges() {
    showResult(
      onGenerateRandomEdges({
        edgeCount: randomEdgeCount,
        minimumWeight,
        maximumWeight,
        keepExistingEdges,
      }),
    );
  }

  function handleGenerateCompleteGraph() {
    showResult(
      onGenerateCompleteGraph({
        minimumWeight,
        maximumWeight,
      }),
    );
  }

  function handleRandomizeNodePositions() {
    showResult(onRandomizeNodePositions());
  }

  return (
    <section className="graph-editor-panel">
      <div className="editor-heading">
        <div>
          <p className="eyebrow">Graph editor</p>
          <h3>Create your own graph</h3>
          <p>Add nodes and weighted undirected edges, then run any algorithm.</p>
        </div>
        <button className="secondary-action" onClick={handleLoadDefaultGraph} type="button">
          Load Default
        </button>
      </div>

      {message && (
        <p className={`editor-message ${message.type ?? (message.ok ? 'success' : 'error')}`}>
          {message.text}
        </p>
      )}

      <div className="editor-forms">
        <form className="editor-form" onSubmit={handleAddNode}>
          <label htmlFor="node-label">Node label</label>
          <div className="inline-form-row">
            <input
              id="node-label"
              onChange={(event) => setNodeLabel(event.target.value)}
              placeholder="A"
              type="text"
              value={nodeLabel}
            />
            <button type="submit">Add Node</button>
          </div>
        </form>

        <form className="editor-form" onSubmit={handleAddEdge}>
          <label>Add weighted edge</label>
          <div className="edge-form-grid">
            <input
              aria-label="Source node"
              list="graph-node-options"
              onChange={(event) => setSourceNode(event.target.value)}
              placeholder="Source"
              type="text"
              value={sourceNode}
            />
            <input
              aria-label="Target node"
              list="graph-node-options"
              onChange={(event) => setTargetNode(event.target.value)}
              placeholder="Target"
              type="text"
              value={targetNode}
            />
            <datalist id="graph-node-options">
              {graph.nodes.map((node) => (
                <option key={getNodeId(node)} value={getNodeId(node)}>
                  {getNodeId(node)}
                </option>
              ))}
            </datalist>
            <input
              aria-label="Edge weight"
              min="0"
              onChange={(event) => setWeight(event.target.value)}
              placeholder="Weight"
              step="1"
              type="number"
              value={weight}
            />
            <button type="submit">Add Edge</button>
          </div>
          <p className="field-help">Edges are undirected, so A-B and B-A count as the same edge.</p>
        </form>
      </div>

      <div className="random-generator">
        <div className="random-generator-heading">
          <div>
            <p className="eyebrow">Random Graph Generator</p>
            <h4>Generate edges and positions</h4>
          </div>
          <button className="secondary-action" onClick={handleRandomizeNodePositions} type="button">
            Randomize Node Positions
          </button>
        </div>

        <div className="random-generator-grid">
          <label>
            Random edges
            <input
              min="1"
              onChange={(event) => setRandomEdgeCount(event.target.value)}
              step="1"
              type="number"
              value={randomEdgeCount}
            />
          </label>
          <label>
            Min weight
            <input
              min="0"
              onChange={(event) => setMinimumWeight(event.target.value)}
              step="1"
              type="number"
              value={minimumWeight}
            />
          </label>
          <label>
            Max weight
            <input
              min="0"
              onChange={(event) => setMaximumWeight(event.target.value)}
              step="1"
              type="number"
              value={maximumWeight}
            />
          </label>
          <label className="checkbox-control">
            <input
              checked={keepExistingEdges}
              onChange={(event) => setKeepExistingEdges(event.target.checked)}
              type="checkbox"
            />
            Keep existing edges
          </label>
        </div>

        <div className="random-generator-stats" aria-label="Random graph generation limits">
          <span>
            Nodes <strong>{nodeCount}</strong>
          </span>
          <span>
            Maximum edges <strong>{maximumEdgeCount}</strong>
          </span>
          <span>
            Current edges <strong>{currentUndirectedEdgeCount}</strong>
          </span>
          <span>
            New edges available <strong>{availableNewEdgeCount}</strong>
          </span>
        </div>

        <div className="random-generator-actions">
          <button onClick={handleGenerateRandomEdges} type="button">
            Generate Random Edges
          </button>
          <button onClick={handleGenerateCompleteGraph} type="button">
            Generate Complete Random Graph
          </button>
        </div>
        <p className="field-help">
          Random generation uses only existing nodes, avoids self-loops, and treats A-B and B-A as one edge.
        </p>
      </div>

      <div className="graph-lists">
        <div className="graph-list-block">
          <h4>Nodes</h4>
          {graph.nodes.length === 0 ? (
            <p className="empty-list">No nodes yet.</p>
          ) : (
            <div className="chip-list">
              {graph.nodes.map((node) => (
                <span className="graph-chip" key={getNodeId(node)}>
                  {getNodeId(node)}
                  <button onClick={() => handleRemoveNode(getNodeId(node))} type="button">
                    Remove
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="graph-list-block">
          <h4>Edges</h4>
          {graph.edges.length === 0 ? (
            <p className="empty-list">No edges yet.</p>
          ) : (
            <div className="edge-list">
              {graph.edges.map((edge) => (
                <div className="edge-row" key={edge.id}>
                  <span>
                    {edge.id} <strong>weight {edge.weight}</strong>
                  </span>
                  <button onClick={() => handleRemoveEdge(edge.id)} type="button">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="danger-action" onClick={handleClearGraph} type="button">
        Clear Graph
      </button>
    </section>
  );
}

export default GraphEditor;

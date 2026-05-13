const INFINITY_LABEL = String.fromCharCode(8734);

function getNodeId(node) {
  return node.id ?? node;
}

function buildMatrixFromGraph(graph, nodeIds) {
  const matrix = {};

  nodeIds.forEach((fromNode) => {
    matrix[fromNode] = {};

    nodeIds.forEach((toNode) => {
      matrix[fromNode][toNode] = fromNode === toNode ? 0 : Number.POSITIVE_INFINITY;
    });
  });

  // The graph is undirected, so direct edge weights appear in both directions.
  graph.edges.forEach((edge) => {
    matrix[edge.source][edge.target] = edge.weight;
    matrix[edge.target][edge.source] = edge.weight;
  });

  return matrix;
}

function formatMatrixValue(value) {
  if (value === Number.POSITIVE_INFINITY || value === 'Infinity' || value === INFINITY_LABEL) {
    return INFINITY_LABEL;
  }

  return value;
}

function DistanceMatrix({
  graph,
  matrix,
  updatedCell = null,
  eyebrow = 'Reference',
  title = 'Distance matrix',
}) {
  const nodeIds = graph.nodes.map((node) => getNodeId(node));
  const displayMatrix = matrix ?? buildMatrixFromGraph(graph, nodeIds);

  return (
    <section className="info-panel matrix-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>

      {nodeIds.length === 0 && <p className="empty-list">Add nodes to display a matrix.</p>}

      <div className="matrix-scroll">
        {nodeIds.length > 0 && (
          <table className="distance-table">
            <thead>
              <tr>
                <th aria-label="From node to node" />
                {nodeIds.map((nodeId) => (
                  <th key={nodeId}>{nodeId}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodeIds.map((fromNode) => (
                <tr key={fromNode}>
                  <th>{fromNode}</th>
                  {nodeIds.map((toNode) => {
                    const isUpdatedCell =
                      updatedCell?.from === fromNode && updatedCell?.to === toNode;

                    return (
                      <td className={isUpdatedCell ? 'updated-cell' : undefined} key={toNode}>
                        {formatMatrixValue(displayMatrix[fromNode]?.[toNode])}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default DistanceMatrix;

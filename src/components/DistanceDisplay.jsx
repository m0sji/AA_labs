function formatDistance(distance) {
  // Dijkstra stores unreachable distances as Infinity. The UI shows the standard infinity symbol.
  if (distance === Number.POSITIVE_INFINITY || distance === 'Infinity' || distance === '\u221e') {
    return '\u221e';
  }

  return distance;
}

function DistanceDisplay({ distances, startNode = 'A' }) {
  const distanceEntries = Object.entries(distances ?? {});

  if (distanceEntries.length === 0) {
    return null;
  }

  return (
    <section className="info-panel distance-display-panel">
      <p className="eyebrow">Dijkstra distances</p>
      <h3>Current distances from {startNode || 'start node'}</h3>

      <table className="distance-display-table">
        <thead>
          <tr>
            <th>Node</th>
            <th>Current distance from {startNode || 'start node'}</th>
          </tr>
        </thead>
        <tbody>
          {distanceEntries.map(([nodeId, distance]) => (
            <tr key={nodeId}>
              <td>{nodeId}</td>
              <td>{formatDistance(distance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default DistanceDisplay;

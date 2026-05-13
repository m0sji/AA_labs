// One shared weighted, undirected graph for every algorithm screen.
// Each edge is written once, and the visualizer treats it as usable in both directions.
export const sampleGraph = {
  nodes: [
    { id: 'A', label: 'A', position: { x: 80, y: 170 } },
    { id: 'B', label: 'B', position: { x: 230, y: 70 } },
    { id: 'C', label: 'C', position: { x: 230, y: 270 } },
    { id: 'D', label: 'D', position: { x: 420, y: 170 } },
    { id: 'E', label: 'E', position: { x: 600, y: 270 } },
    { id: 'F', label: 'F', position: { x: 600, y: 70 } },
  ],
  edges: [
    { id: 'A-B', source: 'A', target: 'B', weight: 4 },
    { id: 'A-C', source: 'A', target: 'C', weight: 2 },
    { id: 'B-C', source: 'B', target: 'C', weight: 1 },
    { id: 'B-D', source: 'B', target: 'D', weight: 5 },
    { id: 'C-D', source: 'C', target: 'D', weight: 8 },
    { id: 'C-E', source: 'C', target: 'E', weight: 10 },
    { id: 'D-E', source: 'D', target: 'E', weight: 2 },
    { id: 'D-F', source: 'D', target: 'F', weight: 6 },
    { id: 'E-F', source: 'E', target: 'F', weight: 3 },
  ],
};

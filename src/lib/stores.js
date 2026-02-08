import { writable, derived } from 'svelte/store';

// Theme definitions
export const themes = {
  purple: {
    name: 'PURPLE',
    brutalistBg: '#6B46C1',
    modernBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    vintageBg: '#EBE0F0',
    brutalistColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF1493'],
    modernColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#95E1D3', '#A8E6CF', '#FFD3B6', '#FFAAA5'],
    vintageColors: ['#9B7B9E', '#A78BA8', '#8B7389', '#B8A5C8', '#967B94', '#9D8B96', '#C5B5D5', '#8F7E9C']
  },
  green: {
    name: 'GREEN',
    brutalistBg: '#059669',
    modernBg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    vintageBg: '#D4E4D4',
    brutalistColors: ['#10B981', '#059669', '#047857', '#065F46', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
    modernColors: ['#2ECC71', '#27AE60', '#16A085', '#1ABC9C', '#52BE80', '#58D68D', '#7DCEA0', '#A9DFBF'],
    vintageColors: ['#5C7457', '#6B8E5F', '#7A9C6E', '#4A5D3F', '#698267', '#8FA688', '#A4B89A', '#5F7358']
  },
  red: {
    name: 'RED',
    brutalistBg: '#DC2626',
    modernBg: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    vintageBg: '#E8D4CC',
    brutalistColors: ['#FF0000', '#DC2626', '#B91C1C', '#991B1B', '#EF4444', '#F87171', '#FCA5A5', '#FEE2E2'],
    modernColors: ['#E74C3C', '#C0392B', '#EC7063', '#F1948A', '#E57373', '#EF5350', '#F44336', '#D32F2F'],
    vintageColors: ['#8B4C39', '#A65D4A', '#C17E6B', '#734133', '#925847', '#AB7360', '#C49481', '#7D4A3A']
  }
};

// Initial mindmap data
const initialNodes = [
  { id: 1, text: 'Main Idea', x: window.innerWidth / 2, y: window.innerHeight / 2, size: 120, colorIndex: 0, connections: [2, 3, 4] },
  { id: 2, text: 'Concept A', x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 150, size: 100, colorIndex: 1, connections: [5, 6] },
  { id: 3, text: 'Concept B', x: window.innerWidth / 2 + 250, y: window.innerHeight / 2 - 150, size: 100, colorIndex: 2, connections: [7] },
  { id: 4, text: 'Concept C', x: window.innerWidth / 2, y: window.innerHeight / 2 + 200, size: 100, colorIndex: 3, connections: [8] },
  { id: 5, text: 'Detail 1', x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 250, size: 80, colorIndex: 4, connections: [] },
  { id: 6, text: 'Detail 2', x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 50, size: 80, colorIndex: 5, connections: [] },
  { id: 7, text: 'Detail 3', x: window.innerWidth / 2 + 400, y: window.innerHeight / 2 - 250, size: 80, colorIndex: 6, connections: [] },
  { id: 8, text: 'Detail 4', x: window.innerWidth / 2 + 150, y: window.innerHeight / 2 + 350, size: 80, colorIndex: 7, connections: [] }
];

// Store original positions for reset
const originalPositions = initialNodes.map(node => ({ x: node.x, y: node.y }));

// Stores
export const nodes = writable(initialNodes);
export const animationEnabled = writable(true);
export const editingNodeId = writable(null);
export const draggedNodeId = writable(null);
export const currentTheme = writable('purple');
export const showIds = writable(true);
export const zoomLevel = writable(1);
export const panOffset = writable({ x: 0, y: 0 });
export const designStyle = writable('brutalist'); // 'brutalist', 'modern', or 'vintage'

// Derived store that maps nodes with actual colors based on current theme and design style
export const themedNodes = derived(
  [nodes, currentTheme, designStyle],
  ([$nodes, $currentTheme, $designStyle]) => {
    let themeColors;
    if ($designStyle === 'brutalist') {
      themeColors = themes[$currentTheme].brutalistColors;
    } else if ($designStyle === 'vintage') {
      themeColors = themes[$currentTheme].vintageColors;
    } else {
      themeColors = themes[$currentTheme].modernColors;
    }
    return $nodes.map(node => ({
      ...node,
      color: themeColors[node.colorIndex % themeColors.length]
    }));
  }
);

// Derived store for background based on design style
export const currentBackground = derived(
  [currentTheme, designStyle],
  ([$currentTheme, $designStyle]) => {
    if ($designStyle === 'brutalist') {
      return themes[$currentTheme].brutalistBg;
    } else if ($designStyle === 'vintage') {
      return themes[$currentTheme].vintageBg;
    } else {
      return themes[$currentTheme].modernBg;
    }
  }
);

// Helper functions
export function resetPositions() {
  nodes.update(currentNodes => {
    return currentNodes.map((node, index) => ({
      ...node,
      x: originalPositions[index].x,
      y: originalPositions[index].y
    }));
  });
}

export function updateNodePosition(id, x, y) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, x, y } : node
    );
  });
}

export function updateNodeText(id, text) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, text } : node
    );
  });
}

export function updateNodeSize(id, size) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, size: Math.max(40, Math.min(300, size)) } : node
    );
  });
}

export function updateNodeColor(id, colorIndex) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, colorIndex } : node
    );
  });
}

export function updateNodeTextAndColor(id, text, colorIndex) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, text, colorIndex } : node
    );
  });
}

export function updateNodeFull(id, text, colorIndex, connections) {
  nodes.update(currentNodes => {
    return currentNodes.map(node =>
      node.id === id ? { ...node, text, colorIndex, connections } : node
    );
  });
}

export function addNode(text, x, y, size = 80, connections = []) {
  nodes.update(currentNodes => {
    const newId = Math.max(...currentNodes.map(n => n.id)) + 1;
    const colorIndex = newId % 8;

    return [...currentNodes, { id: newId, text, x, y, size, colorIndex, connections }];
  });
}

export function setTheme(themeName) {
  if (themes[themeName]) {
    currentTheme.set(themeName);
  }
}

export function deleteNode(id) {
  nodes.update(currentNodes => {
    // Remove the node
    const filtered = currentNodes.filter(node => node.id !== id);
    // Remove connections to this node
    return filtered.map(node => ({
      ...node,
      connections: node.connections.filter(connId => connId !== id)
    }));
  });
}

export function toggleConnection(fromId, toId) {
  nodes.update(currentNodes => {
    return currentNodes.map(node => {
      if (node.id === fromId) {
        const hasConnection = node.connections.includes(toId);
        return {
          ...node,
          connections: hasConnection
            ? node.connections.filter(id => id !== toId)
            : [...node.connections, toId]
        };
      }
      return node;
    });
  });
}

import { Node, Edge } from '@xyflow/react';
import { TransactionProcess, TransitionDefinition, V3TransitionDefinition } from './edn-parser';

// Actor color mapping for transitions
const ACTOR_COLORS = {
  customer: '#F97316', // orange
  provider: '#EC4899', // pink
  operator: '#10B981', // green
  system: '#6B7280', // gray
  default: '#6B7280' // gray
};

// Get actor color based on actor type
function getActorColor(actor: string): string {
  const normalizedActor = actor.toLowerCase().replace(/^actor\.role\//, '');
  return ACTOR_COLORS[normalizedActor as keyof typeof ACTOR_COLORS] || ACTOR_COLORS.default;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Generate ReactFlow nodes and edges from parsed EDN transaction process data
 */
export function generateGraphData(processData: TransactionProcess): GraphData {
  if (processData.format === 'v3') {
    return generateV3GraphData(processData);
  } else {
    return generateV2GraphData(processData);
  }
}

/**
 * Generate graph data for v3 format
 */
function generateV3GraphData(processData: TransactionProcess): GraphData {
  const transitions = processData.transitions || [];
  
  // Extract all unique states from transitions
  const stateSet = new Set<string>();
  
  // Add initial state (no 'from' field means it's initial)
  const initialTransitions = transitions.filter(t => !t.from);
  if (initialTransitions.length > 0) {
    stateSet.add('initial');
  }
  
  // Add all states from transitions
  transitions.forEach(transition => {
    if (transition.from) {
      stateSet.add(transition.from);
    }
    if (transition.to) {
      stateSet.add(transition.to);
    }
  });
  
  const states = Array.from(stateSet);
  
  // Create nodes with improved tree layout
  const nodes: Node[] = states.map((state, index) => {
    const { x, y } = getImprovedTreePosition(state, transitions, states);
    
    return {
      id: state,
      type: 'default',
      position: { x, y },
      data: { 
        label: formatStateLabel(state),
        originalId: state
      },
      style: {
        background: 'white',
        color: '#374151',
        border: '2px solid #D1D5DB',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '120px',
        textAlign: 'center',
        fontStyle: state === 'initial' ? 'italic' : 'normal',
      },
      sourcePosition: 'bottom' as const,
      targetPosition: 'top' as const,
    };
  });

  // Create edges for each transition
  const edges: Edge[] = [];
  transitions.forEach((transition, transitionIndex) => {
    const fromState = transition.from || 'initial';
    const toState = transition.to;
    
    if (toState) {
      const edgeId = `${transition.name}-${transitionIndex}`;
      
      edges.push({
        id: edgeId,
        source: fromState,
        target: toState,
        label: formatV3TransitionLabel(transition),
        style: {
          stroke: getActorColor(transition.actor || 'system'),
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: '11px',
          fontWeight: '500',
          fill: '#374151',
          textDecoration: 'underline',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
          stroke: '#D1D5DB',
          strokeWidth: 1,
        },
        labelBgPadding: [4, 8],
        type: 'straight',
        animated: false,
        markerEnd: {
          type: 'arrowclosed',
          width: 8,
          height: 8,
          color: getActorColor(transition.actor || 'system'),
        },
        // Position label closer to source
        labelPosition: 0.25,
        data: {
          transitionId: transition.name,
          actor: transition.actor || 'system',
          actions: transition.actions?.map(a => a.name) || [],
          notifications: [],
          from: fromState,
          to: toState,
        }
      });
    }
  });

  return { nodes, edges };
}

/**
 * Generate graph data for v2 format
 */
function generateV2GraphData(processData: TransactionProcess): GraphData {
  const states = processData['process/states'] || [];
  const transitions = processData['process/transitions'] || [];

  // Create nodes with vertical tree layout
  const nodes: Node[] = states.map((state, index) => {
    const { x, y } = getVerticalTreePositionV2(state, transitions, states);

    return {
      id: state,
      type: 'default',
      position: { x, y },
      data: { 
        label: formatStateLabel(state),
        originalId: state
      },
      style: {
        background: 'white',
        color: '#374151',
        border: '2px solid #D1D5DB',
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '120px',
        textAlign: 'center',
        fontStyle: state === 'initial' ? 'italic' : 'normal',
      },
      sourcePosition: 'bottom' as const,
      targetPosition: 'top' as const,
    };
  });

  // Create edges for each transition
  const edges: Edge[] = [];
  transitions.forEach((transition, transitionIndex) => {
    const fromStates = Array.isArray(transition['transition/from']) 
      ? transition['transition/from'] 
      : [transition['transition/from']];

    fromStates.forEach((fromState, fromIndex) => {
      const edgeId = `${transition['transition/id']}-${fromIndex}`;
      
      edges.push({
        id: edgeId,
        source: fromState,
        target: transition['transition/to'],
        label: formatTransitionLabel(transition),
        style: {
          stroke: getActorColor(transition['transition/actor'] || 'system'),
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: '11px',
          fontWeight: '500',
          fill: '#374151',
          textDecoration: 'underline',
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
          stroke: '#D1D5DB',
          strokeWidth: 1,
        },
        labelBgPadding: [4, 8],
        type: 'straight',
        markerEnd: {
          type: 'arrowclosed',
          width: 8,
          height: 8,
          color: getActorColor(transition['transition/actor'] || 'system'),
        },
        labelPosition: 0.25,
        animated: false,
        data: {
          transitionId: transition['transition/id'],
          actor: transition['transition/actor'],
          actions: transition['transition/actions'] || [],
          notifications: transition['transition/notifications'] || [],
          from: fromState,
          to: transition['transition/to'],
        }
      });
    });
  });

  return { nodes, edges };
}

/**
 * Get improved tree position for v3 format with better branching layout
 */
function getImprovedTreePosition(state: string, transitions: V3TransitionDefinition[], states: string[]): { x: number; y: number } {
  // Build a simple tree structure based on transitions
  const levels = new Map<string, number>();
  const children = new Map<string, string[]>();
  
  // Start with initial state at level 0
  levels.set('initial', 0);
  
  // Build children map
  transitions.forEach(transition => {
    const from = transition.from || 'initial';
    if (!children.has(from)) {
      children.set(from, []);
    }
    if (transition.to) {
      children.get(from)!.push(transition.to);
    }
  });
  
  // Simple BFS to assign levels
  const queue = ['initial'];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const currentState = queue.shift()!;
    if (visited.has(currentState)) continue;
    visited.add(currentState);
    
    const currentLevel = levels.get(currentState) || 0;
    
    // Find all transitions from this state
    const outgoingTransitions = transitions.filter(t => (t.from || 'initial') === currentState);
    
    outgoingTransitions.forEach(transition => {
      if (transition.to && !levels.has(transition.to)) {
        levels.set(transition.to, currentLevel + 1);
        queue.push(transition.to);
      }
    });
  }
  
  // If state not found in tree, place at bottom
  if (!levels.has(state)) {
    levels.set(state, Math.max(...Array.from(levels.values())) + 1);
  }
  
  // Calculate position within level with improved centering
  const level = levels.get(state) || 0;
  const statesAtLevel = states.filter(s => levels.get(s) === level);
  const positionInLevel = statesAtLevel.indexOf(state);
  
  // Enhanced spacing to prevent overlapping with better centering
  const horizontalSpacing = 280;
  const verticalSpacing = 180;
  const baseY = 100;
  
  // Center nodes at each level
  const totalWidth = (statesAtLevel.length - 1) * horizontalSpacing;
  const baseX = 400 - totalWidth / 2;
  
  return {
    x: positionInLevel * horizontalSpacing + baseX,
    y: level * verticalSpacing + baseY
  };
}

/**
 * Get vertical tree position for v2 format
 */
function getVerticalTreePositionV2(state: string, transitions: TransitionDefinition[], states: string[]): { x: number; y: number } {
  // Build a simple tree structure based on transitions
  const levels = new Map<string, number>();
  
  // Find states that are never targets (root states)
  const targetStates = new Set<string>();
  transitions.forEach(t => {
    targetStates.add(t['transition/to']);
  });
  
  const rootStates = states.filter(s => !targetStates.has(s));
  
  // Start with root states at level 0
  rootStates.forEach(rootState => {
    levels.set(rootState, 0);
  });
  
  // Simple BFS to assign levels
  const queue = [...rootStates];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const currentState = queue.shift()!;
    if (visited.has(currentState)) continue;
    visited.add(currentState);
    
    const currentLevel = levels.get(currentState) || 0;
    
    // Find all transitions from this state
    const outgoingTransitions = transitions.filter(t => {
      const fromStates = Array.isArray(t['transition/from']) ? t['transition/from'] : [t['transition/from']];
      return fromStates.includes(currentState);
    });
    
    outgoingTransitions.forEach(transition => {
      if (!levels.has(transition['transition/to'])) {
        levels.set(transition['transition/to'], currentLevel + 1);
        queue.push(transition['transition/to']);
      }
    });
  }
  
  // If state not found in tree, place at bottom
  if (!levels.has(state)) {
    levels.set(state, Math.max(...Array.from(levels.values())) + 1);
  }
  
  // Calculate position within level
  const level = levels.get(state) || 0;
  const statesAtLevel = states.filter(s => levels.get(s) === level);
  const positionInLevel = statesAtLevel.indexOf(state);
  
  return {
    x: positionInLevel * 250 + 100,
    y: level * 150 + 50
  };
}

/**
 * Format state name for display
 */
function formatStateLabel(state: string): string {
  // Keep states in lowercase with dashes like the reference image
  return state;
}

/**
 * Format transition label for display (v2 format)
 */
function formatTransitionLabel(transition: TransitionDefinition): string {
  const id = transition['transition/id'].replace(/^transition\//, '');
  // Convert to kebab-case like in the reference image
  const kebabId = id.replace(/([A-Z])/g, '-$1').toLowerCase();
  return kebabId;
}

/**
 * Format transition label for display (v3 format)
 */
function formatV3TransitionLabel(transition: V3TransitionDefinition): string {
  const name = transition.name.replace(/^transition\//, '');
  // Convert to kebab-case like in the reference image
  const kebabName = name.replace(/([A-Z])/g, '-$1').toLowerCase();
  return kebabName;
}

/**
 * Auto-layout nodes using a simple algorithm
 * This is a basic implementation - for more complex layouts, consider using dagre or similar
 */
export function autoLayoutNodes(nodes: Node[]): Node[] {
  const nodeCount = nodes.length;
  const cols = Math.ceil(Math.sqrt(nodeCount));
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % cols) * 280,
      y: Math.floor(index / cols) * 120,
    },
  }));
}

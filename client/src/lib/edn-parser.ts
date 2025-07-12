/**
 * EDN parser for Sharetribe transaction processes
 * Supports both v2 and v3 format structures
 */

export interface TransactionProcess {
  'process/id'?: string;
  'process/states'?: string[];
  'process/transitions'?: TransitionDefinition[];
  format?: string;
  transitions?: V3TransitionDefinition[];
  notifications?: V3NotificationDefinition[];
}

export interface TransitionDefinition {
  'transition/id': string;
  'transition/from': string | string[];
  'transition/to': string;
  'transition/actor': string;
  'transition/actions'?: string[];
  'transition/notifications'?: string[];
}

export interface V3TransitionDefinition {
  name: string;
  actor?: string;
  actions?: Array<{ name: string; config?: any }>;
  to?: string;
  from?: string;
  at?: any;
  'privileged?'?: boolean;
}

export interface V3NotificationDefinition {
  name: string;
  on: string;
  to: string;
  template: string;
}

/**
 * Parse EDN string into a JavaScript object
 * Supports both v2 and v3 Sharetribe transaction process formats
 */
export function parseEdn(ednString: string): TransactionProcess {
  try {
    // Remove comments (lines starting with ;)
    const cleanEdn = ednString.replace(/;.*$/gm, '');
    
    // Detect format - v3 format has :format key, v2 format has :process/id
    const isV3Format = cleanEdn.includes(':format :v3');
    const isV2Format = cleanEdn.includes(':process/id') && cleanEdn.includes(':process/states');
    
    if (isV3Format) {
      return parseV3Format(cleanEdn);
    } else if (isV2Format) {
      return parseV2Format(cleanEdn);
    } else {
      throw new Error('Unrecognized EDN format. Please provide a valid Sharetribe transaction process.');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid EDN format. Please check your input.');
  }
}

/**
 * Parse v2 format (legacy format with :process/id, :process/states, :process/transitions)
 */
function parseV2Format(cleanEdn: string): TransactionProcess {
  // Extract process ID
  const processIdMatch = cleanEdn.match(/:process\/id\s+:([^\s\n]+)/);
  if (!processIdMatch) {
    throw new Error('Missing or invalid :process/id');
  }
  const processId = processIdMatch[1];

  // Extract states from set notation #{...}
  const statesMatch = cleanEdn.match(/:process\/states\s+#{([^}]+)}/);
  if (!statesMatch) {
    throw new Error('Missing or invalid :process/states');
  }
  const statesContent = statesMatch[1];
  const states = statesContent
    .split(/\s+/)
    .filter(s => s.trim() && s.startsWith(':'))
    .map(s => s.substring(1));

  // Extract transitions array
  const transitionsMatch = cleanEdn.match(/:process\/transitions\s+\[(.*)\]/s);
  if (!transitionsMatch) {
    throw new Error('Missing or invalid :process/transitions');
  }
  
  const transitionsContent = transitionsMatch[1];
  const transitions = parseTransitions(transitionsContent);

  return {
    'process/id': processId,
    'process/states': states,
    'process/transitions': transitions
  };
}

/**
 * Parse v3 format (new format with :format :v3, :transitions)
 */
function parseV3Format(cleanEdn: string): TransactionProcess {
  // Extract transitions array - need to handle nested brackets properly
  const transitionsMatch = extractBracketedContent(cleanEdn, ':transitions');
  if (!transitionsMatch) {
    throw new Error('Missing or invalid :transitions');
  }
  
  const transitions = parseV3Transitions(transitionsMatch);

  // Extract notifications array (optional)
  const notificationsMatch = extractBracketedContent(cleanEdn, ':notifications');
  let notifications: V3NotificationDefinition[] = [];
  if (notificationsMatch) {
    notifications = parseV3Notifications(notificationsMatch);
  }

  return {
    format: 'v3',
    transitions,
    notifications
  };
}

/**
 * Extract content between brackets for a given key, handling nested brackets
 */
function extractBracketedContent(ednString: string, key: string): string | null {
  const startPattern = new RegExp(`${key}\\s*\\[`);
  const match = ednString.match(startPattern);
  if (!match) return null;
  
  const startIndex = match.index! + match[0].length;
  let bracketCount = 1;
  let currentIndex = startIndex;
  
  while (currentIndex < ednString.length && bracketCount > 0) {
    const char = ednString[currentIndex];
    if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
    }
    currentIndex++;
  }
  
  if (bracketCount === 0) {
    return ednString.slice(startIndex, currentIndex - 1);
  }
  
  return null;
}

/**
 * Parse v3 transitions from the transitions array content
 */
function parseV3Transitions(transitionsContent: string): V3TransitionDefinition[] {
  const transitions: V3TransitionDefinition[] = [];
  
  // Parse each transition map - need to handle nested brackets properly
  let bracketCount = 0;
  let transitionStart = -1;
  
  for (let i = 0; i < transitionsContent.length; i++) {
    const char = transitionsContent[i];
    
    if (char === '{') {
      if (bracketCount === 0) {
        transitionStart = i;
      }
      bracketCount++;
    } else if (char === '}') {
      bracketCount--;
      if (bracketCount === 0 && transitionStart >= 0) {
        // Found complete transition
        const transitionText = transitionsContent.slice(transitionStart, i + 1);
        try {
          const transition = parseV3Transition(transitionText);
          transitions.push(transition);
        } catch (error) {
          console.warn('Skipping invalid v3 transition:', error);
        }
        transitionStart = -1;
      }
    }
  }

  return transitions;
}

/**
 * Parse v3 notifications from the notifications array content
 */
function parseV3Notifications(notificationsContent: string): V3NotificationDefinition[] {
  const notifications: V3NotificationDefinition[] = [];
  
  // Split by notification maps (look for {:name pattern)
  const notificationMatches = notificationsContent.split(/(?=\s*{:name)/);
  
  for (const notificationText of notificationMatches) {
    if (!notificationText.trim() || !notificationText.includes(':name')) {
      continue;
    }

    try {
      const notification = parseV3Notification(notificationText);
      notifications.push(notification);
    } catch (error) {
      // Skip invalid notifications but continue parsing others
      console.warn('Skipping invalid v3 notification:', error);
    }
  }

  return notifications;
}

/**
 * Parse transitions from the transitions array content (v2 format)
 */
function parseTransitions(transitionsContent: string): TransitionDefinition[] {
  const transitions: TransitionDefinition[] = [];
  
  // Split by transition maps (look for {:transition/id pattern)
  const transitionMatches = transitionsContent.split(/(?=\s*{:transition\/id)/);
  
  for (const transitionText of transitionMatches) {
    if (!transitionText.trim() || !transitionText.includes(':transition/id')) {
      continue;
    }

    try {
      const transition = parseTransition(transitionText);
      transitions.push(transition);
    } catch (error) {
      // Skip invalid transitions but continue parsing others
      console.warn('Skipping invalid transition:', error);
    }
  }

  return transitions;
}

/**
 * Parse a single v3 transition definition
 */
function parseV3Transition(transitionText: string): V3TransitionDefinition {
  const transition: Partial<V3TransitionDefinition> = {};

  // Extract name
  const nameMatch = transitionText.match(/:name\s+:([^\s\n,]+)/);
  if (!nameMatch) {
    throw new Error('Missing transition name');
  }
  transition.name = nameMatch[1];

  // Extract actor (optional)
  const actorMatch = transitionText.match(/:actor\s+:([^\s\n,]+)/);
  if (actorMatch) {
    transition.actor = actorMatch[1].replace(/^actor\.role\//, '');
  }

  // Extract to (optional)
  const toMatch = transitionText.match(/:to\s+:([^\s\n,}]+)/);
  if (toMatch) {
    transition.to = toMatch[1].replace(/^state\//, '');
  }

  // Extract from (optional)
  const fromMatch = transitionText.match(/:from\s+:([^\s\n,}]+)/);
  if (fromMatch) {
    transition.from = fromMatch[1].replace(/^state\//, '');
  }

  // Extract actions (optional) - need to handle nested brackets properly
  const actionsContent = extractBracketedContent(transitionText, ':actions');
  if (actionsContent) {
    const actions = parseV3Actions(actionsContent);
    transition.actions = actions;
  }

  return transition as V3TransitionDefinition;
}

/**
 * Parse a single v3 notification definition
 */
function parseV3Notification(notificationText: string): V3NotificationDefinition {
  const notification: Partial<V3NotificationDefinition> = {};

  // Extract name
  const nameMatch = notificationText.match(/:name\s+:([^\s\n,]+)/);
  if (!nameMatch) {
    throw new Error('Missing notification name');
  }
  notification.name = nameMatch[1];

  // Extract on
  const onMatch = notificationText.match(/:on\s+:([^\s\n,]+)/);
  if (onMatch) {
    notification.on = onMatch[1];
  }

  // Extract to
  const toMatch = notificationText.match(/:to\s+:([^\s\n,]+)/);
  if (toMatch) {
    notification.to = toMatch[1];
  }

  // Extract template
  const templateMatch = notificationText.match(/:template\s+:([^\s\n,}]+)/);
  if (templateMatch) {
    notification.template = templateMatch[1];
  }

  return notification as V3NotificationDefinition;
}

/**
 * Parse v3 actions from actions content
 */
function parseV3Actions(actionsContent: string): Array<{ name: string; config?: any }> {
  const actions: Array<{ name: string; config?: any }> = [];
  
  // Parse each action map - need to handle nested brackets properly
  let currentPos = 0;
  let bracketCount = 0;
  let actionStart = -1;
  
  for (let i = 0; i < actionsContent.length; i++) {
    const char = actionsContent[i];
    
    if (char === '{') {
      if (bracketCount === 0) {
        actionStart = i;
      }
      bracketCount++;
    } else if (char === '}') {
      bracketCount--;
      if (bracketCount === 0 && actionStart >= 0) {
        // Found complete action
        const actionText = actionsContent.slice(actionStart, i + 1);
        try {
          const nameMatch = actionText.match(/:name\s+:([^\s\n,}]+)/);
          if (nameMatch) {
            const action: { name: string; config?: any } = {
              name: nameMatch[1].replace(/^action\//, '')
            };
            
            // Extract config (optional)
            const configMatch = actionText.match(/:config\s+({[^}]+})/);
            if (configMatch) {
              // Simple config parsing - just extract the type for now
              const typeMatch = configMatch[1].match(/:type\s+:([^\s\n,}]+)/);
              if (typeMatch) {
                action.config = { type: typeMatch[1] };
              }
            }
            
            actions.push(action);
          }
        } catch (error) {
          console.warn('Skipping invalid v3 action:', error);
        }
        actionStart = -1;
      }
    }
  }

  return actions;
}

/**
 * Parse a single transition definition (v2 format)
 */
function parseTransition(transitionText: string): TransitionDefinition {
  const transition: Partial<TransitionDefinition> = {};

  // Extract transition ID
  const idMatch = transitionText.match(/:transition\/id\s+:([^\s\n]+)/);
  if (!idMatch) {
    throw new Error('Missing transition ID');
  }
  transition['transition/id'] = idMatch[1];

  // Extract from (can be single keyword or set)
  const fromMatch = transitionText.match(/:transition\/from\s+(#{[^}]+}|:[^\s\n]+)/);
  if (!fromMatch) {
    throw new Error('Missing transition from');
  }
  
  const fromContent = fromMatch[1];
  if (fromContent.startsWith('#{')) {
    // Set notation - multiple from states
    const fromStates = fromContent
      .slice(2, -1) // Remove #{ and }
      .split(/\s+/)
      .filter(s => s.trim() && s.startsWith(':'))
      .map(s => s.substring(1));
    transition['transition/from'] = fromStates;
  } else {
    // Single from state
    transition['transition/from'] = fromContent.substring(1);
  }

  // Extract to
  const toMatch = transitionText.match(/:transition\/to\s+:([^\s\n]+)/);
  if (!toMatch) {
    throw new Error('Missing transition to');
  }
  transition['transition/to'] = toMatch[1];

  // Extract actor
  const actorMatch = transitionText.match(/:transition\/actor\s+:([^\s\n]+)/);
  if (!actorMatch) {
    throw new Error('Missing transition actor');
  }
  transition['transition/actor'] = actorMatch[1];

  // Extract actions (optional)
  const actionsMatch = transitionText.match(/:transition\/actions\s+\[([^\]]+)\]/);
  if (actionsMatch) {
    const actions = actionsMatch[1]
      .split(/\s+/)
      .filter(s => s.trim() && s.startsWith(':'))
      .map(s => s.substring(1).replace(/^action\//, ''));
    transition['transition/actions'] = actions;
  }

  // Extract notifications (optional)
  const notificationsMatch = transitionText.match(/:transition\/notifications\s+\[([^\]]+)\]/);
  if (notificationsMatch) {
    const notifications = notificationsMatch[1]
      .split(/\s+/)
      .filter(s => s.trim() && s.startsWith(':'))
      .map(s => s.substring(1).replace(/^notification\//, ''));
    transition['transition/notifications'] = notifications;
  }

  return transition as TransitionDefinition;
}

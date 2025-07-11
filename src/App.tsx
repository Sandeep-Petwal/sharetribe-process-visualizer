/**
 * Sharetribe Transaction Process Visualizer
 *
 * - Paste EDN, visualize as a directed graph (states as nodes, transitions as edges)
 * - Uses react-flow, edn-js, lucide-react, Tailwind CSS
 * - Modern, responsive, clean UI with Inter font
 * - Extensive comments throughout
 */

import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
// Add this at the top for edn-js type workaround
// @ts-expect-error: no types for edn-js
import { read as parseEdn } from 'edn-js';
import { Play, Info, AlertTriangle, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

// Type imports for linter
// @ts-ignore
import type { Node, Edge } from 'reactflow';
// @ts-ignore
import type { Icon } from 'lucide-react';
// @ts-ignore
import type { parseEdn as ParseEdnType } from 'edn-js';

// Helper: Convert EDN keyword (e.g., :initial) to string ("initial")
const keywordToString = (kw: unknown): string => {
  if (typeof kw === 'string' && kw.startsWith(':')) return kw.slice(1);
  return String(kw);
};

// Helper: Check if value is a set (edn-js parses sets as {"edn/set": [...]})
const isEdnSet = (val: unknown): val is { 'edn/set': unknown[] } =>
  !!val && typeof val === 'object' && 'edn/set' in (val as any);

// Helper: Extract set values
const getSetValues = (val: unknown): unknown[] => (isEdnSet(val) ? (val as any)['edn/set'] : [val]);

// Helper: Remove EDN comments (lines starting with ';;')
function stripEdnComments(edn: string): string {
  return edn
    .split('\n')
    .filter(line => !line.trim().startsWith(';;'))
    .join('\n');
}

// Helper: Convert edn-js keyword object or Symbol to string (e.g., :process/id)
function ednKeyToString(key: any): string {
  if (typeof key === 'symbol') {
    // Symbol(:process/id) => ':process/id'
    return key.description || String(key);
  }
  return String(key);
}

// Helper: Recursively convert Map to plain object, converting keys to strings
function mapToObjectDeep(val: any): any {
  if (val instanceof Map) {
    const obj: any = {};
    for (const [k, v] of val.entries()) {
      obj[ednKeyToString(k)] = mapToObjectDeep(v);
    }
    return obj;
  }
  if (Array.isArray(val)) {
    return val.map(mapToObjectDeep);
  }
  if (val && typeof val === 'object' && 'edn/set' in val) {
    // preserve edn-js set structure
    return { 'edn/set': mapToObjectDeep(val['edn/set']) };
  }
  return val;
}

// Main App Component
const App = () => {
  // State for EDN input, error, parsed process, graph, and selection
  const [ednInput, setEdnInput] = useState('');
  const [error, setError] = useState('');
  const [process, setProcess] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null); // node or edge
  const reactFlowWrapper = useRef(null);

  // Parse EDN and generate graph
  const handleVisualize = useCallback(() => {
    setError('');
    setSelected(null);
    let parsed;
    try {
      const cleanEdn = stripEdnComments(ednInput);
      parsed = parseEdn(cleanEdn);
      console.log('Raw parsed EDN:', parsed);
      parsed = mapToObjectDeep(parsed);
      console.log('After mapToObjectDeep:', parsed);
      console.log('Top-level keys:', Object.keys(parsed));
    } catch (e) {
      setError('Invalid EDN format. Please check your input.');
      setProcess(null);
      setNodes([]);
      setEdges([]);
      console.error('EDN parse error:', e);
      return;
    }
    // Validate structure
    if (!parsed) {
      console.error('Parsed is falsy');
    }
    if (typeof parsed !== 'object') {
      console.error('Parsed is not an object');
    }
    if (!parsed[':process/id']) {
      console.error('Missing :process/id', parsed[':process/id']);
    }
    if (!parsed[':process/states']) {
      console.error('Missing :process/states', parsed[':process/states']);
    }
    if (!parsed[':process/transitions']) {
      console.error('Missing :process/transitions', parsed[':process/transitions']);
    }
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !parsed[':process/id'] ||
      !parsed[':process/states'] ||
      !parsed[':process/transitions']
    ) {
      setError('Malformed transaction process data. Missing required keys or incorrect structure.');
      setProcess(null);
      setNodes([]);
      setEdges([]);
      return;
    }
    setProcess(parsed);
    // Build nodes (states)
    const stateList = getSetValues(parsed[':process/states']);
    const nodeList = stateList.map((state, idx) => ({
      id: keywordToString(state),
      data: { label: keywordToString(state) },
      position: { x: 0, y: idx * 100 }, // Will be auto-laid out
      type: 'default',
      style: {
        borderRadius: 12,
        background: '#f1f5f9',
        border: '2px solid #64748b',
        color: '#0f172a',
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        padding: 8,
        minWidth: 120,
        textAlign: 'center' as const,
      },
    }));
    // Build edges (transitions)
    const transitions = parsed[':process/transitions'] || [];
    let edgeList: any[] = [];
    (transitions as any[]).forEach((t: any, idx: number) => {
      const fromStates = getSetValues(t[':transition/from']);
      const toState = keywordToString(t[':transition/to']);
      fromStates.forEach((from) => {
        edgeList.push({
          id: `${keywordToString(t[':transition/id'])}-${keywordToString(from)}-${toState}`,
          source: keywordToString(from),
          target: toState,
          label: (
            <div className="flex flex-col items-center text-xs">
              <span className="font-bold">{keywordToString(t[':transition/id'])}</span>
              <span className="text-[10px] text-slate-500">by {keywordToString(t[':transition/actor'])}</span>
            </div>
          ),
          data: {
            ...t,
            from: keywordToString(from),
            to: toState,
          },
          animated: true,
          style: {
            stroke: '#6366f1',
            strokeWidth: 2,
            borderRadius: 8,
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#6366f1',
          },
        });
      });
    });
    setNodes(nodeList);
    setEdges(edgeList);
  }, [ednInput]);

  // Node/edge click handler for info panel
  const onElementClick = useCallback((event: any, element: any) => {
    setSelected(element);
  }, []);

  // Reset selection when graph changes
  React.useEffect(() => {
    setSelected(null);
  }, [nodes, edges]);

  // Responsive layout: stack on mobile, side-by-side on desktop
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-6 px-2">
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex flex-col items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Play className="w-7 h-7 text-indigo-500" />
          Sharetribe Process Visualizer
        </h1>
        <p className="text-slate-500 text-center max-w-2xl">
          Paste your Sharetribe transaction process EDN below and visualize the states and transitions as a directed graph.
        </p>
      </header>
      {/* Main content: input + graph */}
      <main className="w-full max-w-6xl flex flex-col md:flex-row gap-6">
        {/* EDN Input Area */}
        <section className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col mb-4 md:mb-0">
          <label htmlFor="edn-input" className="font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <Info className="w-4 h-4 text-indigo-400" /> Paste EDN Transaction Process Here
          </label>
          <textarea
            id="edn-input"
            className="w-full h-64 md:h-[400px] resize-y rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-400 p-3 font-mono text-sm bg-slate-50 mb-4 text-black"
            placeholder={
              `;; Sample Sharetribe Transaction Process EDN\n` +
              `{:process/id :instant-booking\n :process/states #{:initial :pending-payment :booked :completed :canceled}\n :process/transitions [\n   {:transition/id :transition/initiate-booking\n    :transition/from :initial\n    :transition/to :pending-payment\n    :transition/actor :customer\n    :transition/actions [:action/create-booking :action/send-payment-request]\n    :transition/notifications [:notification/customer-booking-initiated :notification/provider-new-booking]}\n   ;; ... more transitions ...\n ]}`
            }
            value={ednInput}
            onChange={e => setEdnInput(e.target.value)}
            spellCheck={false}
            autoFocus
          />
          <button
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-5 py-2 transition-colors shadow mt-2"
            onClick={handleVisualize}
            type="button"
          >
            <Play className="w-4 h-4" /> Visualize Process
          </button>
          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded p-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </section>
        {/* Graph Output Area */}
        <section className="flex-[2] bg-white rounded-xl shadow p-4 min-h-[400px] flex flex-col relative">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Info className="w-4 h-4 text-indigo-400" /> Visual Output
            </span>
            <div className="flex gap-2">
              <button
                className="p-2 rounded hover:bg-slate-100"
                onClick={() => {
                  setNodes([]); setEdges([]); setProcess(null); setEdnInput(''); setError('');
                }}
                title="Clear"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
          <div ref={reactFlowWrapper} className="flex-1 min-h-[350px] h-[350px] md:h-[500px] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                onNodeClick={onElementClick}
                onEdgeClick={onElementClick}
                panOnDrag
                zoomOnScroll
                zoomOnPinch
                minZoom={0.2}
                maxZoom={2}
                attributionPosition="bottom-right"
              >
                <MiniMap
                  nodeColor={(n: any) => '#6366f1'}
                  nodeStrokeWidth={3}
                  nodeBorderRadius={8}
                  pannable
                />
                <Controls showInteractive={false} position="top-right">
                  <ZoomIn />
                  <ZoomOut />
                </Controls>
                <Background color="#e0e7ef" gap={24} />
                {/* Info panel for selected node/edge */}
                {selected && (
                  <Panel position="top-left" className="bg-white/90 rounded-lg shadow p-4 border border-slate-200 min-w-[220px] max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-slate-700">Details</span>
                    </div>
                    {(selected as any).type === 'default' ? (
                      // Node (state)
                      <div>
                        <div className="font-bold text-indigo-600">State</div>
                        <div className="text-slate-700">{(selected as any).data.label}</div>
                      </div>
                    ) : (
                      // Edge (transition)
                      <div className="space-y-1">
                        <div className="font-bold text-indigo-600">Transition</div>
                        <div className="text-slate-700">ID: {keywordToString((selected as any).data[':transition/id'])}</div>
                        <div className="text-slate-700">From: {(selected as any).data.from}</div>
                        <div className="text-slate-700">To: {(selected as any).data.to}</div>
                        <div className="text-slate-700">Actor: {keywordToString((selected as any).data[':transition/actor'])}</div>
                        {(selected as any).data[':transition/actions'] && (
                          <div className="text-slate-700">
                            Actions:
                            <ul className="list-disc ml-5">
                              {(selected as any).data[':transition/actions'].map((a: any, i: number) => (
                                <li key={i}>{keywordToString(a)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(selected as any).data[':transition/notifications'] && (
                          <div className="text-slate-700">
                            Notifications:
                            <ul className="list-disc ml-5">
                              {(selected as any).data[':transition/notifications'].map((n: any, i: number) => (
                                <li key={i}>{keywordToString(n)}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Panel>
                )}
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </section>
      </main>
      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Sharetribe Process Visualizer &mdash; Built with React, React Flow, Tailwind CSS, and EDN-JS
      </footer>
    </div>
  );
};

export default App;

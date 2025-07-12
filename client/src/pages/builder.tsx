import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  ArrowLeft, 
  Download, 
  Settings,
  Play,
  FileText,
  Workflow,
  FolderOpen
} from 'lucide-react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type ConnectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Link } from 'wouter';

interface CustomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    stateType: 'initial' | 'intermediate' | 'final';
    description?: string;
  };
  style: any;
}

interface CustomEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  data: {
    actor: string;
    actions: string[];
    transitionName: string;
  };
  style: any;
}

const ACTOR_COLORS = {
  customer: '#F97316',
  provider: '#EC4899',
  operator: '#10B981',
  system: '#6B7280',
};

const ACTOR_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'operator', label: 'Operator' },
  { value: 'system', label: 'System' },
];

interface StoredGraph {
  id: string;
  name: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
  createdAt: string;
  updatedAt: string;
}

export default function Builder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [showEdgeDialog, setShowEdgeDialog] = useState(false);
  const [nodeFormData, setNodeFormData] = useState({
    label: '',
    stateType: 'intermediate' as 'initial' | 'intermediate' | 'final',
    description: ''
  });
  const [edgeFormData, setEdgeFormData] = useState({
    transitionName: '',
    actor: 'customer',
    actions: [''],
    source: '',
    target: ''
  });
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [isEditingEdge, setIsEditingEdge] = useState(false);
  const [storedGraphs, setStoredGraphs] = useState<StoredGraph[]>([]);
  const [selectedGraphId, setSelectedGraphId] = useState<string>('');
  const [showGraphsDialog, setShowGraphsDialog] = useState(false);
  const [isEditingGraphName, setIsEditingGraphName] = useState<string>('');
  const [newGraphName, setNewGraphName] = useState('');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Load stored graphs on component mount
  useEffect(() => {
    const stored = localStorage.getItem('sharetribe-custom-graphs');
    if (stored) {
      try {
        const graphs = JSON.parse(stored);
        setStoredGraphs(graphs);
      } catch (e) {
        console.error('Error loading stored graphs:', e);
      }
    }
  }, []);

  // Save graphs to localStorage whenever storedGraphs changes
  useEffect(() => {
    localStorage.setItem('sharetribe-custom-graphs', JSON.stringify(storedGraphs));
  }, [storedGraphs]);

  const getNodeStyle = (stateType: string) => {
    const baseStyle = {
      background: 'white',
      border: '2px solid #D1D5DB',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
      minWidth: '120px',
      textAlign: 'center',
      color: '#374151',
    };

    switch (stateType) {
      case 'initial':
        return {
          ...baseStyle,
          fontStyle: 'italic',
          borderColor: '#10B981',
          backgroundColor: '#F0FDF4',
        };
      case 'final':
        return {
          ...baseStyle,
          borderColor: '#EF4444',
          backgroundColor: '#FEF2F2',
        };
      default:
        return baseStyle;
    }
  };

  const getEdgeStyle = (actor: string) => ({
    stroke: ACTOR_COLORS[actor as keyof typeof ACTOR_COLORS] || ACTOR_COLORS.system,
    strokeWidth: 2,
  });

  const onConnect = useCallback((params: Connection) => {
    setEdgeFormData({
      ...edgeFormData,
      source: params.source || '',
      target: params.target || ''
    });
    setShowEdgeDialog(true);
  }, [edgeFormData]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const x = event.clientX - rect.left - 200;
      const y = event.clientY - rect.top - 100;
      
      // Only create node if clicking on empty space
      if (event.target === reactFlowWrapper.current.querySelector('.react-flow__pane')) {
        setNodeFormData({
          label: '',
          stateType: 'intermediate',
          description: ''
        });
        setIsEditingNode(false);
        setShowNodeDialog(true);
      }
    }
  }, []);

  const addNode = useCallback(() => {
    if (!nodeFormData.label.trim()) return;

    const newNode: CustomNode = {
      id: Date.now().toString(),
      type: 'default',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: {
        label: nodeFormData.label,
        stateType: nodeFormData.stateType,
        description: nodeFormData.description
      },
      style: getNodeStyle(nodeFormData.stateType),
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeFormData({ label: '', stateType: 'intermediate', description: '' });
    setShowNodeDialog(false);
  }, [nodeFormData, setNodes]);

  const updateNode = useCallback(() => {
    if (!selectedNode || !nodeFormData.label.trim()) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeFormData.label,
                stateType: nodeFormData.stateType,
                description: nodeFormData.description
              },
              style: getNodeStyle(nodeFormData.stateType),
            }
          : node
      )
    );
    setNodeFormData({ label: '', stateType: 'intermediate', description: '' });
    setIsEditingNode(false);
    setShowNodeDialog(false);
  }, [selectedNode, nodeFormData, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode && edge.target !== selectedNode));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const addEdge = useCallback(() => {
    if (!edgeFormData.source || !edgeFormData.target || !edgeFormData.transitionName.trim()) return;

    const newEdge: CustomEdge = {
      id: Date.now().toString(),
      source: edgeFormData.source,
      target: edgeFormData.target,
      label: edgeFormData.transitionName,
      data: {
        actor: edgeFormData.actor,
        actions: edgeFormData.actions.filter(action => action.trim()),
        transitionName: edgeFormData.transitionName
      },
      style: getEdgeStyle(edgeFormData.actor),
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
        color: ACTOR_COLORS[edgeFormData.actor as keyof typeof ACTOR_COLORS] || ACTOR_COLORS.system,
      },
    };

    setEdges((eds) => [...eds, newEdge]);
    setEdgeFormData({
      transitionName: '',
      actor: 'customer',
      actions: [''],
      source: '',
      target: ''
    });
    setShowEdgeDialog(false);
  }, [edgeFormData, setEdges]);

  const editNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setNodeFormData({
        label: node.data.label,
        stateType: node.data.stateType,
        description: node.data.description || ''
      });
      setSelectedNode(nodeId);
      setIsEditingNode(true);
      setShowNodeDialog(true);
    }
  }, [nodes]);

  const editEdge = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      setEdgeFormData({
        transitionName: edge.data.transitionName,
        actor: edge.data.actor,
        actions: edge.data.actions.length > 0 ? edge.data.actions : [''],
        source: edge.source,
        target: edge.target
      });
      setSelectedEdge(edgeId);
      setIsEditingEdge(true);
      setShowEdgeDialog(true);
    }
  }, [edges]);

  const deleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge));
    setSelectedEdge(null);
  }, [selectedEdge, setEdges]);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedGraphId('');
  }, [setNodes, setEdges]);

  const saveGraph = useCallback(() => {
    if (nodes.length === 0) return;
    
    const graphName = `Graph-${Date.now()}`;
    const newGraph: StoredGraph = {
      id: Date.now().toString(),
      name: graphName,
      nodes: nodes,
      edges: edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setStoredGraphs(prev => [...prev, newGraph]);
    setSelectedGraphId(newGraph.id);
  }, [nodes, edges]);

  const loadGraph = useCallback((graphId: string) => {
    const graph = storedGraphs.find(g => g.id === graphId);
    if (graph) {
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setSelectedGraphId(graphId);
      setSelectedNode(null);
      setSelectedEdge(null);
      setShowGraphsDialog(false);
    }
  }, [storedGraphs, setNodes, setEdges]);

  const deleteGraph = useCallback((graphId: string) => {
    setStoredGraphs(prev => prev.filter(g => g.id !== graphId));
    if (selectedGraphId === graphId) {
      setSelectedGraphId('');
    }
  }, [selectedGraphId]);

  const startEditingGraphName = useCallback((graphId: string, currentName: string) => {
    setIsEditingGraphName(graphId);
    setNewGraphName(currentName);
  }, []);

  const saveGraphName = useCallback((graphId: string) => {
    if (!newGraphName.trim()) return;
    
    setStoredGraphs(prev => 
      prev.map(g => 
        g.id === graphId 
          ? { ...g, name: newGraphName.trim(), updatedAt: new Date().toISOString() }
          : g
      )
    );
    setIsEditingGraphName('');
    setNewGraphName('');
  }, [newGraphName]);

  const exportGraph = useCallback(() => {
    const graphData = {
      nodes: nodes.map(node => ({
        id: node.id,
        label: node.data.label,
        type: node.data.stateType,
        position: node.position,
        description: node.data.description
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        actor: edge.data.actor,
        actions: edge.data.actions,
        transitionName: edge.data.transitionName
      }))
    };

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'custom-graph.json');
    linkElement.click();
  }, [nodes, edges]);

  const addAction = useCallback(() => {
    setEdgeFormData({
      ...edgeFormData,
      actions: [...edgeFormData.actions, '']
    });
  }, [edgeFormData]);

  const removeAction = useCallback((index: number) => {
    setEdgeFormData({
      ...edgeFormData,
      actions: edgeFormData.actions.filter((_, i) => i !== index)
    });
  }, [edgeFormData]);

  const updateAction = useCallback((index: number, value: string) => {
    setEdgeFormData({
      ...edgeFormData,
      actions: edgeFormData.actions.map((action, i) => i === index ? value : action)
    });
  }, [edgeFormData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Visualizer
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Graph Builder</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create custom transaction processes visually
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveGraph}
              disabled={nodes.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Dialog open={showGraphsDialog} onOpenChange={setShowGraphsDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Saved Graphs</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {storedGraphs.map(graph => (
                    <div key={graph.id} className="flex items-center justify-between p-2 border rounded">
                      {isEditingGraphName === graph.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={newGraphName}
                            onChange={(e) => setNewGraphName(e.target.value)}
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                saveGraphName(graph.id);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveGraphName(graph.id)}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{graph.name}</p>
                            <p className="text-xs text-gray-500">
                              {graph.nodes.length} states, {graph.edges.length} transitions
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(graph.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadGraph(graph.id)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingGraphName(graph.id, graph.name)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteGraph(graph.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {storedGraphs.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No saved graphs</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={exportGraph}
              disabled={nodes.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={nodes.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Control Panel */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3">Controls</h2>
            <div className="space-y-2">
              <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add State
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isEditingNode ? 'Edit State' : 'Add New State'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="label">State Name</Label>
                      <Input
                        id="label"
                        value={nodeFormData.label}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, label: e.target.value })}
                        placeholder="e.g., pending-payment"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stateType">State Type</Label>
                      <Select value={nodeFormData.stateType} onValueChange={(value: any) => setNodeFormData({ ...nodeFormData, stateType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="initial">Initial State</SelectItem>
                          <SelectItem value="intermediate">Intermediate State</SelectItem>
                          <SelectItem value="final">Final State</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={nodeFormData.description}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, description: e.target.value })}
                        placeholder="Describe this state..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={isEditingNode ? updateNode : addNode} className="flex-1">
                        {isEditingNode ? 'Update' : 'Add'} State
                      </Button>
                      <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showEdgeDialog} onOpenChange={setShowEdgeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Workflow className="h-4 w-4 mr-2" />
                    Add Transition
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isEditingEdge ? 'Edit Transition' : 'Add New Transition'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transitionName">Transition Name</Label>
                      <Input
                        id="transitionName"
                        value={edgeFormData.transitionName}
                        onChange={(e) => setEdgeFormData({ ...edgeFormData, transitionName: e.target.value })}
                        placeholder="e.g., confirm-payment"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actor">Actor</Label>
                      <Select value={edgeFormData.actor} onValueChange={(value) => setEdgeFormData({ ...edgeFormData, actor: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTOR_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="source">From State</Label>
                      <Select value={edgeFormData.source} onValueChange={(value) => setEdgeFormData({ ...edgeFormData, source: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source state" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.data.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target">To State</Label>
                      <Select value={edgeFormData.target} onValueChange={(value) => setEdgeFormData({ ...edgeFormData, target: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target state" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes.map(node => (
                            <SelectItem key={node.id} value={node.id}>
                              {node.data.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label>Actions</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addAction}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {edgeFormData.actions.map((action, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={action}
                              onChange={(e) => updateAction(index, e.target.value)}
                              placeholder="e.g., charge-customer"
                            />
                            {edgeFormData.actions.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeAction(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addEdge} className="flex-1">
                        {isEditingEdge ? 'Update' : 'Add'} Transition
                      </Button>
                      <Button variant="outline" onClick={() => setShowEdgeDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Selected Element Details */}
          {(selectedNode || selectedEdge) && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                {selectedNode ? 'Selected State' : 'Selected Transition'}
              </h3>
              {selectedNode && (
                <div className="space-y-2">
                  {(() => {
                    const node = nodes.find(n => n.id === selectedNode);
                    return node ? (
                      <>
                        <p className="text-sm text-gray-600">
                          <strong>Name:</strong> {node.data.label}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Type:</strong> {node.data.stateType}
                        </p>
                        {node.data.description && (
                          <p className="text-sm text-gray-600">
                            <strong>Description:</strong> {node.data.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editNode(selectedNode)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deleteNode}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
              {selectedEdge && (
                <div className="space-y-2">
                  {(() => {
                    const edge = edges.find(e => e.id === selectedEdge);
                    return edge ? (
                      <>
                        <p className="text-sm text-gray-600">
                          <strong>Name:</strong> {edge.data.transitionName}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Actor:</strong> {edge.data.actor}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Actions:</strong> {edge.data.actions.join(', ')}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editEdge(selectedEdge)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={deleteEdge}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Click "Add State" to create new states</li>
              <li>• Click "Add Transition" to create transitions</li>
              <li>• Click on states/transitions to select them</li>
              <li>• Use the graph area to visualize your process</li>
              <li>• Export when finished to save your work</li>
            </ul>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              fitView
              className="bg-gray-50"
              connectionLineType="straight"
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            >
              <Controls className="bg-white border-gray-200" />
              <Background 
                color="#E5E7EB" 
                gap={20} 
                size={1}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
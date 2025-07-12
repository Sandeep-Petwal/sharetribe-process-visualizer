import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Info, 
  AlertCircle, 
  Download, 
  Maximize2, 
  Minimize2, 
  PanelRightClose, 
  Save, 
  FolderOpen, 
  Trash2, 
  Edit, 
  Plus,
  Settings,
  FileText,
  Github,
  ExternalLink
} from 'lucide-react';
import { parseEdn, TransactionProcess } from '@/lib/edn-parser';
import { generateGraphData, GraphData } from '@/lib/graph-generator';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  ReactFlowProvider,
  type Node,
  type Edge,
  getViewportForBounds,
  getRectOfNodes,
  getConnectedEdges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Link } from 'wouter';

// Default v3 EDN sample (official Sharetribe format)
const DEFAULT_V3_EDN = `{:format :v3,
 :transitions
 [{:name :transition/inquire,
   :actor :actor.role/customer,
   :actions [{:name :action/update-protected-data}],
   :to :state/inquiry}
  {:name :transition/request-payment,
   :actor :actor.role/customer,
   :actions
   [{:name :action/update-protected-data}
    {:name :action/create-pending-booking, :config {:type :time}}
    {:name :action/privileged-set-line-items}
    {:name :action/stripe-create-payment-intent}],
   :to :state/pending-payment,
   :privileged? true}
  {:name :transition/request-payment-after-inquiry,
   :actor :actor.role/customer,
   :actions
   [{:name :action/update-protected-data}
    {:name :action/create-pending-booking, :config {:type :time}}
    {:name :action/privileged-set-line-items}
    {:name :action/stripe-create-payment-intent}],
   :from :state/inquiry,
   :to :state/pending-payment,
   :privileged? true}
  {:name :transition/expire-payment,
   :at
   {:fn/plus
    [{:fn/timepoint [:time/first-entered-state :state/pending-payment]}
     {:fn/period ["PT15M"]}]},
   :actions
   [{:name :action/calculate-full-refund}
    {:name :action/stripe-refund-payment}
    {:name :action/decline-booking}],
   :from :state/pending-payment,
   :to :state/payment-expired}
  {:name :transition/confirm-payment,
   :actor :actor.role/customer,
   :actions [{:name :action/stripe-confirm-payment-intent}],
   :from :state/pending-payment,
   :to :state/preauthorized}
  {:name :transition/accept,
   :actor :actor.role/provider,
   :actions
   [{:name :action/accept-booking}
    {:name :action/stripe-capture-payment-intent}],
   :from :state/preauthorized,
   :to :state/accepted}
  {:name :transition/decline,
   :actor :actor.role/provider,
   :actions
   [{:name :action/calculate-full-refund}
    {:name :action/stripe-refund-payment}
    {:name :action/decline-booking}],
   :from :state/preauthorized,
   :to :state/declined}]}`;

interface StoredFile {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SelectedElement {
  type: 'node' | 'edge';
  data: any;
}

export default function Home() {
  const [ednInput, setEdnInput] = useState('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [isEditingFileName, setIsEditingFileName] = useState<string>('');
  const [newFileName, setNewFileName] = useState('');
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Load stored files on component mount
  useEffect(() => {
    const stored = localStorage.getItem('sharetribe-edn-files');
    if (stored) {
      try {
        const files = JSON.parse(stored);
        setStoredFiles(files);
      } catch (e) {
        console.error('Error loading stored files:', e);
      }
    }
  }, []);

  // Save files to localStorage whenever storedFiles changes
  useEffect(() => {
    localStorage.setItem('sharetribe-edn-files', JSON.stringify(storedFiles));
  }, [storedFiles]);

  const handleVisualize = useCallback(() => {
    try {
      console.log('Starting visualization...', ednInput.substring(0, 100));
      const parsedData: TransactionProcess = parseEdn(ednInput);
      console.log('Parsed data:', parsedData);
      const newGraphData = generateGraphData(parsedData);
      console.log('Generated graph data:', newGraphData);
      setGraphData(newGraphData);
      setError('');
    } catch (err) {
      console.error('Visualization error:', err);
      setError(`Failed to parse EDN: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setGraphData(null);
    }
  }, [ednInput]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedElement({
      type: 'node',
      data: {
        id: node.id,
        label: node.data.label,
        originalId: node.data.originalId,
        ...node.data
      }
    });
    setShowDetails(true);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedElement({
      type: 'edge',
      data: {
        id: edge.id,
        label: edge.label,
        ...edge.data
      }
    });
    setShowDetails(true);
  }, []);

  const downloadImage = useCallback(() => {
    if (!graphData) return;
    
    // Create a simple export by converting the graph data to JSON
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'sharetribe-graph.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [graphData]);

  const loadSampleEdn = useCallback(() => {
    setEdnInput(DEFAULT_V3_EDN);
    setError('');
    setGraphData(null);
    setSelectedFileId('');
  }, []);

  const saveFile = useCallback(() => {
    if (!ednInput.trim()) return;
    
    const fileName = `Process-${Date.now()}`;
    const newFile: StoredFile = {
      id: Date.now().toString(),
      name: fileName,
      content: ednInput,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setStoredFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
  }, [ednInput]);

  const loadFile = useCallback((fileId: string) => {
    const file = storedFiles.find(f => f.id === fileId);
    if (file) {
      setEdnInput(file.content);
      setSelectedFileId(fileId);
      setError('');
      setGraphData(null);
      setShowFilesDialog(false);
    }
  }, [storedFiles]);

  const deleteFile = useCallback((fileId: string) => {
    setStoredFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId('');
    }
  }, [selectedFileId]);

  const startEditingFileName = useCallback((fileId: string, currentName: string) => {
    setIsEditingFileName(fileId);
    setNewFileName(currentName);
  }, []);

  const saveFileName = useCallback((fileId: string) => {
    if (!newFileName.trim()) return;
    
    setStoredFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, name: newFileName.trim(), updatedAt: new Date().toISOString() }
          : f
      )
    );
    setIsEditingFileName('');
    setNewFileName('');
  }, [newFileName]);

  const clearAll = useCallback(() => {
    setEdnInput('');
    setGraphData(null);
    setError('');
    setSelectedElement(null);
    setSelectedFileId('');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sharetribe Process Visualizer</h1>
              <p className="text-sm text-gray-600 mt-1">
                Parse and visualize Sharetribe transaction processes from EDN format
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Info className="h-4 w-4 mr-2" />
                  Info
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>About Sharetribe Process Visualizer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    This tool helps you visualize Sharetribe transaction processes defined in EDN (Extensible Data Notation) format. 
                    It supports both v2 and v3 Sharetribe process formats and generates interactive directed graphs.
                  </p>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Key Features:</h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Parse EDN transaction process definitions</li>
                      <li>Generate interactive flow diagrams</li>
                      <li>Color-coded transitions by actor type</li>
                      <li>Local storage for your EDN files</li>
                      <li>Manual graph builder for custom processes</li>
                      <li>Export functionality for sharing</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">What is Sharetribe?</h3>
                    <p className="text-gray-700">
                      Sharetribe is a marketplace platform that allows businesses to build custom marketplaces. 
                      Transaction processes define the workflow and states that transactions go through in these marketplaces.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Link href="/builder">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Graph Builder
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Show Input' : 'Hide Input'}
            </Button>
            
            {graphData && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadImage}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Input Panel */}
        {!isFullscreen && (
          <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">EDN Input</span>
              </div>
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSampleEdn}
                  className="text-xs"
                >
                  Load Sample
                </Button>
                <Dialog open={showFilesDialog} onOpenChange={setShowFilesDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      Files
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Stored EDN Files</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {storedFiles.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                          {isEditingFileName === file.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    saveFileName(file.id);
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveFileName(file.id)}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(file.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadFile(file.id)}
                                >
                                  Load
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditingFileName(file.id, file.name)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteFile(file.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {storedFiles.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No stored files</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveFile}
                  disabled={!ednInput.trim()}
                  className="text-xs"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              <Textarea
                value={ednInput}
                onChange={(e) => setEdnInput(e.target.value)}
                placeholder="Paste your Sharetribe EDN transaction process here..."
                className="h-full resize-none font-mono text-sm"
              />
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={handleVisualize}
                disabled={!ednInput.trim()}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Visualize Process
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Graph Area */}
          <div className={`flex-1 ${showDetails ? 'pr-80' : ''}`}>
            {error && (
              <div className="p-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {graphData && (
              <div className="h-full bg-gray-50">
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={graphData.nodes}
                    edges={graphData.edges}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    fitView
                    className="bg-gray-50"
                    nodeTypes={{}}
                    edgeTypes={{}}
                    connectionLineType="straight"
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
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
            )}

            {!graphData && !error && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Visualize
                  </h3>
                  <p className="text-gray-600">
                    {isFullscreen ? 'Click "Show Input" to add your EDN code' : 'Enter your EDN code and click "Visualize Process"'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          {showDetails && selectedElement && (
            <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedElement.type === 'node' ? 'State Details' : 'Transition Details'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedElement.type === 'node' ? 'State' : 'Transition'}: {selectedElement.data.label || selectedElement.data.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedElement.type === 'node' ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">State ID</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.originalId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Display Name</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.label}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Transition ID</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.transitionId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Actor</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.actor || 'system'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">From State</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.from}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">To State</label>
                          <p className="text-sm text-gray-900">{selectedElement.data.to}</p>
                        </div>
                        {selectedElement.data.actions && selectedElement.data.actions.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Actions</label>
                            <div className="space-y-1">
                              {selectedElement.data.actions.map((action: string, index: number) => (
                                <p key={index} className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                  {action}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Made with ❤️ for the Sharetribe community
            </p>
            <a 
              href="https://github.com/yourusername/sharetribe-process-visualizer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Github className="h-4 w-4" />
              Contribute on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">
              Open Source • Free to Use • Community Driven
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
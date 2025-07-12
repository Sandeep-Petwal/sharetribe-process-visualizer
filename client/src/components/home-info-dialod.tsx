import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface HomeInfoDialogProps {
    showInfoModal : boolean;
    setShowInfoModal : (value: boolean) => void;
}

const HomeInfoDialog: React.FC<HomeInfoDialogProps> = ({showInfoModal, setShowInfoModal}) => {
    return (
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

    )
}
        
export default HomeInfoDialog
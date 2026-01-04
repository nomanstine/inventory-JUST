'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  downloadBarcodeLabelsPDF,
  printBarcodeLabelsPDF,
  generateBarcodeLabelsPDF,
} from '@/services/barcodeService';
import { Printer, Download, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeItem {
  itemInstanceId: number;
  barcode: string;
  itemName?: string;
}

interface BarcodePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BarcodeItem[];
  title?: string;
}

export function BarcodePrintDialog({ open, onOpenChange, items, title }: BarcodePrintDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const ids = items.map(item => item.itemInstanceId);
      const itemNames = items.map(item => item.itemName || 'Unknown');
      await downloadBarcodeLabelsPDF(ids, itemNames);
      toast.success('PDF downloaded successfully!');
    } catch (error: any) {
      toast.error(`Failed to download PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintPDF = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const ids = items.map(item => item.itemInstanceId);
      const result = await printBarcodeLabelsPDF(ids);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(`Failed to print to XPrinter: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNormalPrintPDF = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const ids = items.map(item => item.itemInstanceId);
      const blob = await generateBarcodeLabelsPDF(ids);
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
      } else {
        toast.error('Failed to open print dialog. Please allow popups.');
      }
    } catch (error: any) {
      toast.error(`Failed to print: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title || 'Print Barcode Labels'}</DialogTitle>
          <DialogDescription>
            Print or download barcode labels for your items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items List */}
          <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
            <h3 className="font-semibold mb-2">Items to print ({items.length}):</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.itemInstanceId} className="flex justify-between items-center p-2 bg-secondary rounded">
                  <div>
                    {item.itemName && <div className="text-sm font-medium">{item.itemName}</div>}
                    <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>
                  </div>
                  <Badge variant="outline">ID: {item.itemInstanceId}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Printing Options */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {/* Print to XPrinter - Primary Option */}
              <Button
                onClick={handlePrintPDF}
                disabled={isProcessing}
                className="w-full justify-start"
                variant="default"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print to XPrinter
              </Button>

              {/* Normal Print PDF - Secondary Option */}
              <Button
                onClick={handleNormalPrintPDF}
                disabled={isProcessing}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Print PDF (System Dialog)
              </Button>

              {/* Download PDF - Tertiary Option */}
              <Button
                onClick={handleDownloadPDF}
                disabled={isProcessing}
                className="w-full justify-start"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p><strong>Print to XPrinter:</strong> Send directly to XPrinter thermal printer via USB (requires Chrome/Edge and user permission).</p>
            <p><strong>Print PDF (System Dialog):</strong> Opens system print dialog for any printer.</p>
            <p><strong>Download PDF:</strong> Download the PDF file for later printing or sharing.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

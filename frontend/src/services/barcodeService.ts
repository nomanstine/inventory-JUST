import api from "@/lib/api";

export interface BarcodeLabel {
  itemInstanceId: number;
  barcode: string;
  itemName: string;
}

/**
 * Generate a barcode image
 */
export const generateBarcodeImage = async (
  barcodeText: string, 
  width: number = 400, 
  height: number = 100
): Promise<Blob> => {
  const response = await api.get(`/barcodes/generate/${encodeURIComponent(barcodeText)}`, {
    params: { width, height },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate a QR code image
 */
export const generateQRCode = async (
  barcodeText: string, 
  width: number = 200, 
  height: number = 200
): Promise<Blob> => {
  const response = await api.get(`/barcodes/qrcode/${encodeURIComponent(barcodeText)}`, {
    params: { width, height },
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate a complete barcode label with item information
 */
export const generateBarcodeLabel = async (itemInstanceId: number): Promise<Blob> => {
  const response = await api.get(`/barcodes/label/${itemInstanceId}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate a simplified vertical barcode label (6x4 inches)
 */
export const generateSimpleBarcodeLabel = async (itemInstanceId: number): Promise<Blob> => {
  const response = await api.get(`/barcodes/simple-label/${itemInstanceId}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate multiple barcode labels
 */
export const generateBarcodeLabels = async (itemInstanceIds: number[]): Promise<Blob> => {
  const response = await api.post(`/barcodes/labels`, itemInstanceIds, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate multiple simplified vertical barcode labels
 */
export const generateSimpleBarcodeLabels = async (itemInstanceIds: number[]): Promise<Blob> => {
  const response = await api.post(`/barcodes/simple-labels`, itemInstanceIds, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate barcode labels as PDF (optimized for 6x4 inch thermal printing)
 */
export const generateBarcodeLabelsPDF = async (itemInstanceIds: number[]): Promise<Blob> => {
  const response = await api.post(`/barcodes/labels-pdf`, itemInstanceIds, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Generate ESC/POS commands for direct thermal printer printing
 */
export const generateESCPOS = async (itemInstanceId: number): Promise<Blob> => {
  const response = await api.get(`/barcodes/escpos/${itemInstanceId}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Download a barcode label
 */
export const downloadBarcodeLabel = async (itemInstanceId: number, filename?: string) => {
  const blob = await generateBarcodeLabel(itemInstanceId);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `barcode-label-${itemInstanceId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download multiple barcode labels
 */
export const downloadBarcodeLabels = async (itemInstanceIds: number[], filename?: string) => {
  const blob = await generateBarcodeLabels(itemInstanceIds);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `barcode-labels.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download simplified barcode labels as PNG
 */
export const downloadSimpleBarcodeLabels = async (itemInstanceIds: number[], filename?: string) => {
  const blob = await generateSimpleBarcodeLabels(itemInstanceIds);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `barcode-labels-simple.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download barcode labels as PDF (optimized for thermal printer)
 */
export const downloadBarcodeLabelsPDF = async (itemInstanceIds: number[], itemNames?: string[], filename?: string) => {
  const blob = await generateBarcodeLabelsPDF(itemInstanceIds);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with item name and count if not provided
  if (!filename && itemNames && itemNames.length > 0) {
    const count = itemInstanceIds.length;
    // Get unique item names
    const uniqueNames = [...new Set(itemNames)];
    
    if (uniqueNames.length === 1) {
      // Single item type
      const itemName = uniqueNames[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
      filename = `${itemName}_${count}-labels.pdf`;
    } else {
      // Multiple item types
      filename = `mixed-items_${count}-labels.pdf`;
    }
  } else if (!filename) {
    filename = `barcode-labels_${itemInstanceIds.length}.pdf`;
  }
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download ESC/POS file for thermal printer
 */
export const downloadESCPOS = async (itemInstanceId: number, filename?: string) => {
  const blob = await generateESCPOS(itemInstanceId);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `print-${itemInstanceId}.bin`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Print barcode label directly (opens in new window for printing)
 */
export const printBarcodeLabel = async (itemInstanceId: number) => {
  const blob = await generateBarcodeLabel(itemInstanceId);
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
  }
};

/**
 * Print multiple barcode labels
 */
export const printBarcodeLabels = async (itemInstanceIds: number[]) => {
  const blob = await generateBarcodeLabels(itemInstanceIds);
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
  }
};

/**
 * Print simplified barcode labels (optimized for thermal printing)
 */
export const printSimpleBarcodeLabels = async (itemInstanceIds: number[]) => {
  const blob = await generateSimpleBarcodeLabels(itemInstanceIds);
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
  }
};

/**
 * Print barcode labels PDF directly to XPrinter thermal printer via Web Serial API
 */
export const printBarcodeLabelsPDF = async (itemInstanceIds: number[]) => {
  try {
    // Check if Web Serial API is supported
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Use Chrome or Edge.');
    }

    // Request a port
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Get PDF data
    const blob = await generateBarcodeLabelsPDF(itemInstanceIds);
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Write to printer
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();

    // Close the port
    await port.close();

    return { success: true, message: `Printed ${itemInstanceIds.length} label(s) successfully to XPrinter` };
  } catch (error: any) {
    console.error('Thermal printer error:', error);
    throw new Error(error.message || 'Failed to print to XPrinter');
  }
};

/**
 * Send to thermal printer via Web Serial API (for direct USB connection)
 * This requires user permission and only works in Chrome/Edge
 */
export const sendToThermalPrinter = async (itemInstanceId: number) => {
  try {
    // Check if Web Serial API is supported
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Use Chrome or Edge.');
    }

    // Request a port
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Get ESC/POS data
    const blob = await generateESCPOS(itemInstanceId);
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Write to printer
    const writer = port.writable.getWriter();
    await writer.write(data);
    writer.releaseLock();

    // Close the port
    await port.close();

    return { success: true, message: 'Printed successfully to thermal printer' };
  } catch (error: any) {
    console.error('Thermal printer error:', error);
    return { success: false, message: error.message };
  }
};

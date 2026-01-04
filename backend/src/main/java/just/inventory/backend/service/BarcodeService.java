package just.inventory.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import just.inventory.backend.model.ItemInstance;
import just.inventory.backend.repository.ItemInstanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class BarcodeService {

    @Autowired
    private ItemInstanceRepository itemInstanceRepository;

    /**
     * Generate a Code128 barcode image for the given barcode text
     */
    public byte[] generateBarcodeImage(String barcodeText, int width, int height) throws WriterException, IOException {
        Code128Writer barcodeWriter = new Code128Writer();
        BitMatrix bitMatrix = barcodeWriter.encode(barcodeText, BarcodeFormat.CODE_128, width, height);
        
        BufferedImage barcodeImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(barcodeImage, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate a QR code image for the given barcode text
     */
    public byte[] generateQRCode(String barcodeText, int width, int height) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 1);
        
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(barcodeText, BarcodeFormat.QR_CODE, width, height, hints);
        
        BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate a simplified vertical barcode label (6x4 inches / 600x400 pixels at 100 DPI)
     * Optimized for thermal printers with minimal info: item name, office, purchase date
     */
    public byte[] generateSimpleBarcodeLabel(Long itemInstanceId) throws WriterException, IOException {
        ItemInstance itemInstance = itemInstanceRepository.findById(itemInstanceId)
                .orElseThrow(() -> new RuntimeException("Item instance not found"));
        
        // Label dimensions: 6"x4" at 100 DPI = 600x400 pixels
        int labelWidth = 600;
        int labelHeight = 400;
        
        BufferedImage label = new BufferedImage(labelWidth, labelHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = label.createGraphics();
        
        // Set rendering hints for better quality
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        // White background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, labelWidth, labelHeight);
        
        // Black text
        g2d.setColor(Color.BLACK);
        
        int yPos = 30;
        
        // Item Name (centered, bold, larger font)
        Font nameFont = new Font("Arial", Font.BOLD, 18);
        g2d.setFont(nameFont);
        String itemName = itemInstance.getItem().getName();
        if (itemName.length() > 40) {
            itemName = itemName.substring(0, 37) + "...";
        }
        FontMetrics nameFm = g2d.getFontMetrics();
        int nameWidth = nameFm.stringWidth(itemName);
        g2d.drawString(itemName, (labelWidth - nameWidth) / 2, yPos);
        
        yPos += 40;
        
        // Purchase Date (centered)
        Font infoFont = new Font("Arial", Font.PLAIN, 14);
        g2d.setFont(infoFont);
        FontMetrics infoFm = g2d.getFontMetrics();
        
        if (itemInstance.getPurchaseDate() != null) {
            String purchaseDate = "Purchased: " + itemInstance.getPurchaseDate().toLocalDate().toString();
            int dateWidth = infoFm.stringWidth(purchaseDate);
            g2d.drawString(purchaseDate, (labelWidth - dateWidth) / 2, yPos);
            yPos += 50; // Increased gap before barcode
        } else {
            yPos += 30;
        }
        
        // Generate barcode (centered, larger)
        Code128Writer barcodeWriter = new Code128Writer();
        int barcodeWidth = labelWidth - 80; // More margin
        int barcodeHeight = 120;
        BitMatrix bitMatrix = barcodeWriter.encode(
                itemInstance.getBarcode(), 
                BarcodeFormat.CODE_128, 
                barcodeWidth, 
                barcodeHeight
        );
        BufferedImage barcodeImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        // Center the barcode horizontally
        int barcodeX = (labelWidth - barcodeWidth) / 2;
        g2d.drawImage(barcodeImage, barcodeX, yPos, null);
        
        yPos += barcodeHeight + 20; // Gap after barcode
        
        // Barcode text (centered, monospace)
        Font barcodeFont = new Font("Courier", Font.BOLD, 14);
        g2d.setFont(barcodeFont);
        FontMetrics barcodeFm = g2d.getFontMetrics();
        int barcodeTextWidth = barcodeFm.stringWidth(itemInstance.getBarcode());
        g2d.drawString(itemInstance.getBarcode(), (labelWidth - barcodeTextWidth) / 2, yPos);
        
        g2d.dispose();
        
        // Convert to PNG
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(label, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate a complete barcode label with item information
     * This creates a printable image with barcode and text
     */
    public byte[] generateBarcodeLabel(Long itemInstanceId) throws WriterException, IOException {
        ItemInstance itemInstance = itemInstanceRepository.findById(itemInstanceId)
                .orElseThrow(() -> new RuntimeException("Item instance not found"));
        
        // Label dimensions (suitable for thermal printer)
        int labelWidth = 400;
        int labelHeight = 300;
        
        BufferedImage label = new BufferedImage(labelWidth, labelHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = label.createGraphics();
        
        // Set rendering hints for better quality
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        // White background
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, labelWidth, labelHeight);
        
        // Black text
        g2d.setColor(Color.BLACK);
        
        // Draw title/header
        Font titleFont = new Font("Arial", Font.BOLD, 14);
        g2d.setFont(titleFont);
        String title = itemInstance.getItem().getName();
        if (title.length() > 35) {
            title = title.substring(0, 32) + "...";
        }
        g2d.drawString(title, 10, 20);
        
        // Draw item details
        Font detailFont = new Font("Arial", Font.PLAIN, 10);
        g2d.setFont(detailFont);
        int yPos = 40;
        
        g2d.drawString("Office: " + itemInstance.getOwnerOffice().getName(), 10, yPos);
        yPos += 15;
        
        if (itemInstance.getSerialNumber() != null) {
            g2d.drawString("S/N: " + itemInstance.getSerialNumber(), 10, yPos);
            yPos += 15;
        }
        
        if (itemInstance.getPurchaseDate() != null) {
            g2d.drawString("Purchased: " + itemInstance.getPurchaseDate().toLocalDate(), 10, yPos);
            yPos += 15;
        }
        
        g2d.drawString("Status: " + itemInstance.getStatus(), 10, yPos);
        yPos += 30; // More gap before barcode
        
        // Generate and draw barcode (centered)
        Code128Writer barcodeWriter = new Code128Writer();
        int barcodeWidth = labelWidth - 60; // More margin
        int barcodeHeight = 80;
        BitMatrix bitMatrix = barcodeWriter.encode(
                itemInstance.getBarcode(), 
                BarcodeFormat.CODE_128, 
                barcodeWidth, 
                barcodeHeight
        );
        BufferedImage barcodeImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        // Center the barcode horizontally
        int barcodeX = (labelWidth - barcodeWidth) / 2;
        g2d.drawImage(barcodeImage, barcodeX, yPos, null);
        
        // Draw barcode text below the barcode (centered)
        yPos += barcodeHeight + 15; // Gap after barcode
        Font barcodeFont = new Font("Courier", Font.BOLD, 12);
        g2d.setFont(barcodeFont);
        FontMetrics barcodeFm = g2d.getFontMetrics();
        int barcodeTextWidth = barcodeFm.stringWidth(itemInstance.getBarcode());
        g2d.drawString(itemInstance.getBarcode(), (labelWidth - barcodeTextWidth) / 2, yPos);
        
        // Add QR code in the corner (optional)
        int qrSize = 80;
        BufferedImage qrImage = generateQRCodeImage(itemInstance.getBarcode(), qrSize, qrSize);
        g2d.drawImage(qrImage, labelWidth - qrSize - 10, labelHeight - qrSize - 10, null);
        
        g2d.dispose();
        
        // Convert to PNG
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(label, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate barcode labels for multiple item instances
     */
    public byte[] generateBarcodeLabels(java.util.List<Long> itemInstanceIds) throws WriterException, IOException {
        // For multiple labels, create a sheet with multiple labels
        int labelsPerRow = 2;
        int labelWidth = 400;
        int labelHeight = 300;
        int rows = (int) Math.ceil(itemInstanceIds.size() / (double) labelsPerRow);
        
        int sheetWidth = labelWidth * labelsPerRow;
        int sheetHeight = labelHeight * rows;
        
        BufferedImage sheet = new BufferedImage(sheetWidth, sheetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = sheet.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, sheetWidth, sheetHeight);
        
        for (int i = 0; i < itemInstanceIds.size(); i++) {
            byte[] labelBytes = generateBarcodeLabel(itemInstanceIds.get(i));
            BufferedImage labelImage = ImageIO.read(new java.io.ByteArrayInputStream(labelBytes));
            
            int row = i / labelsPerRow;
            int col = i % labelsPerRow;
            int x = col * labelWidth;
            int y = row * labelHeight;
            
            g2d.drawImage(labelImage, x, y, null);
        }
        
        g2d.dispose();
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(sheet, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    /**
     * Generate ESC/POS commands for direct thermal printer printing
     * Suitable for XPrinter TT62B and similar thermal printers
     */
    public byte[] generateESCPOSCommands(Long itemInstanceId) throws WriterException, IOException {
        ItemInstance itemInstance = itemInstanceRepository.findById(itemInstanceId)
                .orElseThrow(() -> new RuntimeException("Item instance not found"));
        
        ByteArrayOutputStream escpos = new ByteArrayOutputStream();
        
        // ESC/POS initialization
        escpos.write(new byte[]{0x1B, 0x40}); // Initialize printer
        
        // Set alignment to center
        escpos.write(new byte[]{0x1B, 0x61, 0x01});
        
        // Bold text for title
        escpos.write(new byte[]{0x1B, 0x45, 0x01}); // Bold on
        String title = itemInstance.getItem().getName();
        if (title.length() > 32) {
            title = title.substring(0, 29) + "...";
        }
        escpos.write(title.getBytes("UTF-8"));
        escpos.write(new byte[]{0x0A}); // Line feed
        escpos.write(new byte[]{0x1B, 0x45, 0x00}); // Bold off
        
        // Set alignment to left
        escpos.write(new byte[]{0x1B, 0x61, 0x00});
        
        // Item details
        escpos.write(new byte[]{0x0A}); // Line feed
        escpos.write(("Office: " + itemInstance.getOwnerOffice().getName() + "\n").getBytes("UTF-8"));
        
        if (itemInstance.getSerialNumber() != null) {
            escpos.write(("S/N: " + itemInstance.getSerialNumber() + "\n").getBytes("UTF-8"));
        }
        
        if (itemInstance.getPurchaseDate() != null) {
            escpos.write(("Purchased: " + itemInstance.getPurchaseDate().toLocalDate() + "\n").getBytes("UTF-8"));
        }
        
        escpos.write(("Status: " + itemInstance.getStatus() + "\n").getBytes("UTF-8"));
        escpos.write(new byte[]{0x0A}); // Extra line feed
        
        // Barcode printing (Code128)
        // Set barcode height
        escpos.write(new byte[]{0x1D, 0x68, 0x50}); // Height = 80 dots
        
        // Set barcode width
        escpos.write(new byte[]{0x1D, 0x77, 0x02}); // Width = 2
        
        // Set HRI position (print text below barcode)
        escpos.write(new byte[]{0x1D, 0x48, 0x02}); // Below
        
        // Print barcode (Code128)
        escpos.write(new byte[]{0x1D, 0x6B, 0x49}); // Code128
        escpos.write((byte) itemInstance.getBarcode().length()); // Length
        escpos.write(itemInstance.getBarcode().getBytes("UTF-8")); // Data
        
        // Feed and cut
        escpos.write(new byte[]{0x0A, 0x0A, 0x0A}); // Line feeds
        escpos.write(new byte[]{0x1D, 0x56, 0x41, 0x00}); // Partial cut
        
        return escpos.toByteArray();
    }

    /**
     * Helper method to generate QR code as BufferedImage
     */
    private BufferedImage generateQRCodeImage(String text, int width, int height) throws WriterException {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.MARGIN, 1);
        
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height, hints);
        
        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }

    /**
     * Generate PDF with multiple barcode labels (vertical layout, 6x4 inches per label)
     * Optimized for printing on thermal barcode printers
     */
    public byte[] generateBarcodeLabelsPDF(java.util.List<Long> itemInstanceIds) throws WriterException, IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        // Create PDF with 6x4 inch page size (432x288 points)
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, new PageSize(432, 288));
        
        // Remove margins for full bleed printing
        document.setMargins(0, 0, 0, 0);
        
        for (Long itemInstanceId : itemInstanceIds) {
            // Generate label image
            byte[] labelBytes = generateSimpleBarcodeLabel(itemInstanceId);
            
            // Add to PDF
            Image labelImage = new Image(ImageDataFactory.create(labelBytes));
            
            // Scale to fit 6x4 inch page
            labelImage.scaleToFit(432, 288);
            labelImage.setFixedPosition(0, 0);
            
            document.add(labelImage);
            
            // Add new page for next label (except for last one)
            if (itemInstanceIds.indexOf(itemInstanceId) < itemInstanceIds.size() - 1) {
                document.add(new com.itextpdf.layout.element.AreaBreak());
            }
        }
        
        document.close();
        return outputStream.toByteArray();
    }

    /**
     * Generate simplified barcode labels for multiple item instances as PNG sheet
     */
    public byte[] generateSimpleBarcodeLabels(java.util.List<Long> itemInstanceIds) throws WriterException, IOException {
        // For multiple labels, create vertical stack
        int labelWidth = 600;
        int labelHeight = 400;
        int totalHeight = labelHeight * itemInstanceIds.size();
        
        BufferedImage sheet = new BufferedImage(labelWidth, totalHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = sheet.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, labelWidth, totalHeight);
        
        for (int i = 0; i < itemInstanceIds.size(); i++) {
            byte[] labelBytes = generateSimpleBarcodeLabel(itemInstanceIds.get(i));
            BufferedImage labelImage = ImageIO.read(new java.io.ByteArrayInputStream(labelBytes));
            
            int y = i * labelHeight;
            g2d.drawImage(labelImage, 0, y, null);
            
            // Add separator line between labels
            if (i < itemInstanceIds.size() - 1) {
                g2d.setColor(Color.LIGHT_GRAY);
                g2d.drawLine(0, y + labelHeight - 1, labelWidth, y + labelHeight - 1);
                g2d.setColor(Color.WHITE);
            }
        }
        
        g2d.dispose();
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(sheet, "PNG", outputStream);
        return outputStream.toByteArray();
    }
}

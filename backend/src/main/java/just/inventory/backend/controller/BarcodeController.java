package just.inventory.backend.controller;

import com.google.zxing.WriterException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import just.inventory.backend.service.BarcodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/barcodes")
@Tag(name = "Barcode", description = "Barcode generation and printing APIs")
public class BarcodeController {

    @Autowired
    private BarcodeService barcodeService;

    @GetMapping("/generate/{barcodeText}")
    @Operation(summary = "Generate barcode image", description = "Generate a Code128 barcode image for the given text")
    public ResponseEntity<byte[]> generateBarcode(
            @PathVariable String barcodeText,
            @RequestParam(defaultValue = "400") int width,
            @RequestParam(defaultValue = "100") int height) {
        try {
            byte[] barcodeImage = barcodeService.generateBarcodeImage(barcodeText, width, height);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("inline", "barcode.png");
            
            return new ResponseEntity<>(barcodeImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/qrcode/{barcodeText}")
    @Operation(summary = "Generate QR code", description = "Generate a QR code image for the given text")
    public ResponseEntity<byte[]> generateQRCode(
            @PathVariable String barcodeText,
            @RequestParam(defaultValue = "200") int width,
            @RequestParam(defaultValue = "200") int height) {
        try {
            byte[] qrImage = barcodeService.generateQRCode(barcodeText, width, height);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("inline", "qrcode.png");
            
            return new ResponseEntity<>(qrImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/label/{itemInstanceId}")
    @Operation(summary = "Generate barcode label", description = "Generate a complete barcode label with item information")
    public ResponseEntity<byte[]> generateBarcodeLabel(@PathVariable Long itemInstanceId) {
        try {
            byte[] labelImage = barcodeService.generateBarcodeLabel(itemInstanceId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment", "barcode-label-" + itemInstanceId + ".png");
            
            return new ResponseEntity<>(labelImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/simple-label/{itemInstanceId}")
    @Operation(summary = "Generate simple barcode label", description = "Generate a simplified vertical barcode label (6x4 inches) with item name, office, and purchase date only")
    public ResponseEntity<byte[]> generateSimpleBarcodeLabel(@PathVariable Long itemInstanceId) {
        try {
            byte[] labelImage = barcodeService.generateSimpleBarcodeLabel(itemInstanceId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment", "barcode-" + itemInstanceId + ".png");
            
            return new ResponseEntity<>(labelImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/labels")
    @Operation(summary = "Generate multiple barcode labels", description = "Generate barcode labels for multiple item instances")
    public ResponseEntity<byte[]> generateBarcodeLabels(@RequestBody List<Long> itemInstanceIds) {
        try {
            byte[] labelsImage = barcodeService.generateBarcodeLabels(itemInstanceIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment", "barcode-labels.png");
            
            return new ResponseEntity<>(labelsImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/simple-labels")
    @Operation(summary = "Generate multiple simple barcode labels", description = "Generate simplified vertical barcode labels (6x4 inches) for multiple item instances")
    public ResponseEntity<byte[]> generateSimpleBarcodeLabels(@RequestBody List<Long> itemInstanceIds) {
        try {
            byte[] labelsImage = barcodeService.generateSimpleBarcodeLabels(itemInstanceIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentDispositionFormData("attachment", "barcode-labels.png");
            
            return new ResponseEntity<>(labelsImage, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/labels-pdf")
    @Operation(summary = "Generate barcode labels as PDF", description = "Generate barcode labels for multiple item instances as a PDF file optimized for 6x4 inch thermal printing")
    public ResponseEntity<byte[]> generateBarcodeLabelsPDF(@RequestBody List<Long> itemInstanceIds) {
        try {
            byte[] pdfBytes = barcodeService.generateBarcodeLabelsPDF(itemInstanceIds);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "barcode-labels.pdf");
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/escpos/{itemInstanceId}")
    @Operation(summary = "Generate ESC/POS commands", description = "Generate ESC/POS commands for direct thermal printer printing")
    public ResponseEntity<byte[]> generateESCPOS(@PathVariable Long itemInstanceId) {
        try {
            byte[] escposCommands = barcodeService.generateESCPOSCommands(itemInstanceId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "print-" + itemInstanceId + ".bin");
            
            return new ResponseEntity<>(escposCommands, headers, HttpStatus.OK);
        } catch (WriterException | IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

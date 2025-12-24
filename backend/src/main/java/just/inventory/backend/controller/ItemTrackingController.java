package just.inventory.backend.controller;

import just.inventory.backend.service.ItemTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tracking")
public class ItemTrackingController {

    @Autowired
    private ItemTrackingService trackingService;

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<?> trackByBarcode(@PathVariable String barcode) {
        try {
            Map<String, Object> trackingInfo = trackingService.trackItemByBarcode(barcode);
            return ResponseEntity.ok(trackingInfo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/barcodes")
    public ResponseEntity<?> trackMultipleBarcodes(@RequestBody BarcodeListRequest request) {
        List<Map<String, Object>> trackingInfo = trackingService.trackMultipleItems(request.getBarcodes());
        return ResponseEntity.ok(trackingInfo);
    }

    // DTO
    public static class BarcodeListRequest {
        private List<String> barcodes;

        public List<String> getBarcodes() {
            return barcodes;
        }

        public void setBarcodes(List<String> barcodes) {
            this.barcodes = barcodes;
        }
    }
}

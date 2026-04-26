package just.inventory.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import just.inventory.backend.model.Office;
import just.inventory.backend.service.OfficeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offices")
@RequiredArgsConstructor
@Tag(name = "Office Management", description = "APIs for managing university offices")
public class OfficeController {

    private final OfficeService officeService;

    @GetMapping
    @Operation(summary = "Get all offices")
    public ResponseEntity<List<Office>> getAllOffices() {
        List<Office> offices = officeService.getAllOffices();
        return ResponseEntity.ok(offices);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get office by ID")
    public ResponseEntity<Office> getOfficeById(@PathVariable Long id) {
        return officeService.getOfficeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/children/{parentId}")
    @Operation(summary = "Get child offices by parent ID")
    public ResponseEntity<List<Office>> getChildOffices(@PathVariable Long parentId) {
        List<Office> childOffices = officeService.getChildOffices(parentId);
        return ResponseEntity.ok(childOffices);
    }

    @PostMapping
    @Operation(summary = "Create a new office")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Office> createOffice(@RequestBody Office office) {
        Office createdOffice = officeService.createOffice(office);
        return ResponseEntity.ok(createdOffice);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an office")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Office> updateOffice(@PathVariable Long id, @RequestBody Office officeDetails) {
        Office updatedOffice = officeService.updateOffice(id, officeDetails);
        return ResponseEntity.ok(updatedOffice);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an office (soft delete)")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteOffice(@PathVariable Long id) {
        officeService.deleteOffice(id);
        return ResponseEntity.noContent().build();
    }
}
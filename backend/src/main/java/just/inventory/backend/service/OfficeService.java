package just.inventory.backend.service;

import just.inventory.backend.model.Office;
import just.inventory.backend.model.Inventory;
import just.inventory.backend.repository.OfficeRepository;
import just.inventory.backend.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OfficeService {

    private final OfficeRepository officeRepository;
    private final InventoryRepository inventoryRepository;

    public List<Office> getAllOffices() {
        return officeRepository.findAll();
    }

    public Optional<Office> getOfficeById(Long id) {
        return officeRepository.findById(id);
    }

    public List<Office> getChildOffices(Long parentId) {
        return officeRepository.findByParentId(parentId);
    }

    public Office createOffice(Office office) {
        Office createdOffice = officeRepository.save(office);

        if (createdOffice.getInventory() == null) {
            Inventory inventory = new Inventory();
            inventory.setOffice(createdOffice);
            inventoryRepository.save(inventory);
            createdOffice.setInventory(inventory);
        }

        return createdOffice;
    }

    public Office updateOffice(Long id, Office officeDetails) {
        Office office = officeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Office not found with id: " + id));

        office.setName(officeDetails.getName());
        office.setNameBn(officeDetails.getNameBn());
        office.setType(officeDetails.getType());
        office.setCode(officeDetails.getCode());
        office.setDescription(officeDetails.getDescription());
        office.setOrder(officeDetails.getOrder());
        office.setIsActive(officeDetails.getIsActive());
        office.setParent(officeDetails.getParent());

        return officeRepository.save(office);
    }

    public void deleteOffice(Long id) {
        Office office = officeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Office not found with id: " + id));

        // Soft delete - set isActive to false instead of actually deleting
        office.setIsActive(false);
        officeRepository.save(office);
    }
}
package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.requests.ChecklistCreateReq;
import org.example.back_end.models.dto.requests.ChecklistItemReq;
import org.example.back_end.models.dto.requests.ChecklistItemUpdateReq;
import org.example.back_end.models.dto.responses.ChecklistItemRes;
import org.example.back_end.models.dto.responses.ChecklistRes;
import org.example.back_end.models.entities.Card;
import org.example.back_end.models.entities.Checklist;
import org.example.back_end.models.entities.ChecklistItem;
import org.example.back_end.models.repositories.CardRepository;
import org.example.back_end.models.repositories.ChecklistItemRepository;
import org.example.back_end.models.repositories.ChecklistRepository;
import org.example.back_end.models.services.ChecklistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChecklistServiceImpl implements ChecklistService {
    private final ChecklistRepository checklistRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final CardRepository cardRepository;

    @Override
    @Transactional
    public ChecklistRes createChecklist(Long cardId, ChecklistCreateReq req) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        double position = 65535.0;
        if (!card.getChecklists().isEmpty()) {
            position = card.getChecklists().get(card.getChecklists().size() - 1).getPosition() + 65535.0;
        }

        Checklist checklist = new Checklist();
        checklist.setCard(card);
        checklist.setTitle(req.title().trim());
        checklist.setPosition(position);
        checklist = checklistRepository.save(checklist);

        return ChecklistRes.builder()
                .id(checklist.getId())
                .title(checklist.getTitle())
                .position(checklist.getPosition())
                .items(List.of())
                .build();
    }

    @Override
    @Transactional
    public void deleteChecklist(Long checklistId) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist", "id", checklistId));
        checklistRepository.delete(checklist);
    }

    @Override
    @Transactional
    public ChecklistItemRes addItem(Long checklistId, ChecklistItemReq req) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new ResourceNotFoundException("Checklist", "id", checklistId));

        double position = 65535.0;
        if (!checklist.getItems().isEmpty()) {
            position = checklist.getItems().get(checklist.getItems().size() - 1).getPosition() + 65535.0;
        }

        ChecklistItem item = new ChecklistItem();
        item.setChecklist(checklist);
        item.setContent(req.text().trim());
        item.setChecked(false);
        item.setPosition(position);
        item = checklistItemRepository.save(item);

        return ChecklistItemRes.builder()
                .id(item.getId())
                .text(item.getContent())
                .done(item.isChecked())
                .position(item.getPosition())
                .build();
    }

    @Override
    @Transactional
    public ChecklistItemRes updateItem(Long itemId, ChecklistItemUpdateReq req) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistItem", "id", itemId));

        if (req.text() != null && !req.text().isBlank()) {
            item.setContent(req.text().trim());
        }
        if (req.done() != null) {
            item.setChecked(req.done());
        }

        item = checklistItemRepository.save(item);

        return ChecklistItemRes.builder()
                .id(item.getId())
                .text(item.getContent())
                .done(item.isChecked())
                .position(item.getPosition())
                .build();
    }

    @Override
    @Transactional
    public void deleteItem(Long itemId) {
        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ChecklistItem", "id", itemId));
        checklistItemRepository.delete(item);
    }
}

package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.ChecklistCreateReq;
import org.example.back_end.models.dto.requests.ChecklistItemReq;
import org.example.back_end.models.dto.requests.ChecklistItemUpdateReq;
import org.example.back_end.models.dto.responses.ChecklistItemRes;
import org.example.back_end.models.dto.responses.ChecklistRes;

public interface ChecklistService {
    ChecklistRes createChecklist(Long cardId, ChecklistCreateReq req);
    void deleteChecklist(Long checklistId);

    ChecklistItemRes addItem(Long checklistId, ChecklistItemReq req);
    ChecklistItemRes updateItem(Long itemId, ChecklistItemUpdateReq req);
    void deleteItem(Long itemId);
}

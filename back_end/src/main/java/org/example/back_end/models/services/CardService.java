package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.CardCreateReq;
import org.example.back_end.models.dto.requests.CardMoveReq;
import org.example.back_end.models.dto.requests.CardUpdateReq;
import org.example.back_end.models.dto.responses.CardActivitiesRes;
import org.example.back_end.models.dto.responses.CardDetailRes;
import org.example.back_end.models.dto.responses.CardSummaryRes;

public interface CardService {
    CardSummaryRes createCard(Long listId, CardCreateReq req);
    CardDetailRes getCardDetail(Long cardId);
    CardSummaryRes updateCard(Long cardId, CardUpdateReq req);
    CardSummaryRes moveCard(Long cardId, CardMoveReq req);
    void deleteCard(Long cardId);

    void addMemberToCard(Long cardId, Long userId);
    void removeMemberFromCard(Long cardId, Long userId);

    void addLabelToCard(Long cardId, Long labelId);
    void removeLabelFromCard(Long cardId, Long labelId);

    CardActivitiesRes getCardActivities(Long cardId);
}

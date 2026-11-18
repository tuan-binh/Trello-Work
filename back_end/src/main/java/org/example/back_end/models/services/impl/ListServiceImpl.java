package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.requests.ListCreateReq;
import org.example.back_end.models.dto.requests.ListReorderReq;
import org.example.back_end.models.dto.requests.ListUpdateReq;
import org.example.back_end.models.dto.responses.CardSummaryRes;
import org.example.back_end.models.dto.responses.LabelRes;
import org.example.back_end.models.dto.responses.ListRes;
import org.example.back_end.models.entities.Board;
import org.example.back_end.models.entities.Card;
import org.example.back_end.models.entities.Checklist;
import org.example.back_end.models.entities.ChecklistItem;
import org.example.back_end.models.entities.ListEntity;
import org.example.back_end.models.repositories.BoardRepository;
import org.example.back_end.models.repositories.CardRepository;
import org.example.back_end.models.repositories.ListEntityRepository;
import org.example.back_end.models.services.ListService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListServiceImpl implements ListService {
    private final ListEntityRepository listRepository;
    private final BoardRepository boardRepository;
    private final CardRepository cardRepository;

    @Override
    @Transactional
    public ListRes createList(Long boardId, ListCreateReq req) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        double position = req.position() != null ? req.position() : 65535.0;
        if (req.position() == null) {
            List<ListEntity> existing = listRepository.findByBoardIdOrderByPositionAsc(boardId);
            if (!existing.isEmpty()) {
                position = existing.get(existing.size() - 1).getPosition() + 65535.0;
            }
        }

        ListEntity list = new ListEntity();
        list.setBoard(board);
        list.setTitle(req.title().trim());
        list.setPosition(position);
        list.setArchived(false);

        list = listRepository.save(list);

        return mapToListRes(list);
    }

    @Override
    @Transactional
    public ListRes updateList(Long listId, ListUpdateReq req) {
        ListEntity list = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", "id", listId));

        if (req.title() != null && !req.title().isBlank()) {
            list.setTitle(req.title().trim());
        }
        if (req.isArchived() != null) {
            list.setArchived(req.isArchived());
        }

        list = listRepository.save(list);
        return mapToListRes(list);
    }

    @Override
    @Transactional
    public void reorderLists(Long boardId, ListReorderReq req) {
        if (req.listOrders() == null) return;
        for (ListReorderReq.ListOrderItem item : req.listOrders()) {
            listRepository.findById(item.listId()).ifPresent(list -> {
                list.setPosition(item.position());
                listRepository.save(list);
            });
        }
    }

    @Override
    @Transactional
    public ListRes sortList(Long listId, String sortBy) {
        ListEntity list = listRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List", "id", listId));

        List<Card> cards = new ArrayList<>(list.getCards());
        if ("TITLE_ASC".equalsIgnoreCase(sortBy)) {
            cards.sort(Comparator.comparing(Card::getTitle, String.CASE_INSENSITIVE_ORDER));
        } else if ("DUE_DATE_ASC".equalsIgnoreCase(sortBy)) {
            cards.sort(Comparator.comparing(Card::getDueDate, Comparator.nullsLast(LocalDateTime::compareTo)));
        }

        double pos = 65535.0;
        for (Card c : cards) {
            c.setPosition(pos);
            pos += 65535.0;
        }
        cardRepository.saveAll(cards);

        return mapToListRes(list);
    }

    private ListRes mapToListRes(ListEntity list) {
        List<CardSummaryRes> cards = list.getCards().stream()
                .sorted(Comparator.comparingDouble(Card::getPosition))
                .map(c -> {
                    int total = 0;
                    int done = 0;
                    for (Checklist cl : c.getChecklists()) {
                        total += cl.getItems().size();
                        for (ChecklistItem item : cl.getItems()) {
                            if (item.isChecked()) done++;
                        }
                    }

                    List<String> memberInitials = c.getMembers().stream()
                            .map(u -> u.getFullName() != null && !u.getFullName().isBlank()
                                    ? u.getFullName().substring(0, 1).toUpperCase()
                                    : "U")
                            .toList();

                    List<LabelRes> cardLabels = c.getLabels().stream().map(lb -> LabelRes.builder()
                            .id(lb.getId())
                            .name(lb.getName())
                            .color(lb.getColor())
                            .build()
                    ).toList();

                    return CardSummaryRes.builder()
                            .id(c.getId())
                            .title(c.getTitle())
                            .description(c.getDescription())
                            .position(c.getPosition())
                            .labels(cardLabels)
                            .checklistTotal(total > 0 ? total : null)
                            .checklistDone(total > 0 ? done : null)
                            .commentsCount(c.getComments().size())
                            .dueDate(c.getDueDate())
                            .isDueComplete(c.isDueComplete())
                            .members(memberInitials)
                            .coverUrl(c.getCoverUrl())
                            .coverColor(c.getCoverColor())
                            .isArchived(c.isArchived())
                            .build();
                }).toList();

        return ListRes.builder()
                .id(list.getId())
                .title(list.getTitle())
                .position(list.getPosition())
                .isArchived(list.isArchived())
                .cards(cards)
                .build();
    }
}

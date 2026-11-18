package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.requests.LabelCreateReq;
import org.example.back_end.models.dto.responses.LabelRes;
import org.example.back_end.models.entities.Board;
import org.example.back_end.models.entities.Label;
import org.example.back_end.models.repositories.BoardRepository;
import org.example.back_end.models.repositories.LabelRepository;
import org.example.back_end.models.services.LabelService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LabelServiceImpl implements LabelService {
    private final LabelRepository labelRepository;
    private final BoardRepository boardRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LabelRes> getBoardLabels(Long boardId) {
        boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        return labelRepository.findByBoardId(boardId).stream().map(l -> LabelRes.builder()
                .id(l.getId())
                .name(l.getName())
                .color(l.getColor())
                .build()
        ).toList();
    }

    @Override
    @Transactional
    public LabelRes createLabel(Long boardId, LabelCreateReq req) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board", "id", boardId));

        Label label = new Label();
        label.setBoard(board);
        label.setName(req.name().trim());
        label.setColor(req.color().trim());
        label = labelRepository.save(label);

        return LabelRes.builder()
                .id(label.getId())
                .name(label.getName())
                .color(label.getColor())
                .build();
    }
}

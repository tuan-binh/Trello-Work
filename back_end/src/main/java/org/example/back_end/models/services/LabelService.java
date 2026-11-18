package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.LabelCreateReq;
import org.example.back_end.models.dto.responses.LabelRes;

import java.util.List;

public interface LabelService {
    List<LabelRes> getBoardLabels(Long boardId);
    LabelRes createLabel(Long boardId, LabelCreateReq req);
}

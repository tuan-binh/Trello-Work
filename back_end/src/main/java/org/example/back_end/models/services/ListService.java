package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.ListCreateReq;
import org.example.back_end.models.dto.requests.ListReorderReq;
import org.example.back_end.models.dto.requests.ListUpdateReq;
import org.example.back_end.models.dto.responses.ListRes;

public interface ListService {
    ListRes createList(Long boardId, ListCreateReq req);
    ListRes updateList(Long listId, ListUpdateReq req);
    void reorderLists(Long boardId, ListReorderReq req);
    ListRes sortList(Long listId, String sortBy);
}

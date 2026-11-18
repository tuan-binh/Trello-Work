package org.example.back_end.models.dto.requests;

import java.util.List;

public record ListReorderReq(
        List<ListOrderItem> listOrders
) {
    public record ListOrderItem(Long listId, Double position) {}
}

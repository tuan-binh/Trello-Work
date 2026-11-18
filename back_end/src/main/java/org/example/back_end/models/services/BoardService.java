package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.BoardCreateReq;
import org.example.back_end.models.dto.requests.BoardUpdateReq;
import org.example.back_end.models.dto.requests.MemberInviteReq;
import org.example.back_end.models.dto.requests.MemberRoleReq;
import org.example.back_end.models.dto.responses.BoardDetailRes;
import org.example.back_end.models.dto.responses.BoardSummaryRes;
import org.example.back_end.models.dto.responses.MemberRes;

import java.util.List;
import java.util.Map;

public interface BoardService {
    List<BoardSummaryRes> getBoards(Long workspaceId, String search, Boolean starred);
    BoardSummaryRes createBoard(BoardCreateReq req);
    BoardDetailRes getBoardDetail(Long boardId);
    BoardSummaryRes updateBoard(Long boardId, BoardUpdateReq req);

    MemberRes inviteMember(Long boardId, MemberInviteReq req);
    MemberRes updateMemberRole(Long boardId, Long memberId, MemberRoleReq req);
    void removeMember(Long boardId, Long memberId);
    Map<String, String> getInviteLink(Long boardId);
}

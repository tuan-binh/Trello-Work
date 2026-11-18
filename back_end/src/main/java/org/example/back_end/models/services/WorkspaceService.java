package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.WorkspaceReq;
import org.example.back_end.models.dto.responses.WorkspaceRes;

import java.util.List;

public interface WorkspaceService {
    List<WorkspaceRes> getAllMyWorkspaces();
    WorkspaceRes createWorkspace(WorkspaceReq req);
}

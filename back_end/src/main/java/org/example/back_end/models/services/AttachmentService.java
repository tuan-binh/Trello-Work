package org.example.back_end.models.services;

import org.example.back_end.models.dto.responses.AttachmentRes;
import org.springframework.web.multipart.MultipartFile;

public interface AttachmentService {
    AttachmentRes uploadAttachment(Long cardId, MultipartFile file, Boolean isCover);
    AttachmentRes toggleCover(Long attachmentId, Boolean isCover);
    void deleteAttachment(Long attachmentId);
}

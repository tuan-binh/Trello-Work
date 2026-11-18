package org.example.back_end.models.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.back_end.exceptions.BadRequestException;
import org.example.back_end.exceptions.ResourceNotFoundException;
import org.example.back_end.models.dto.responses.AttachmentRes;
import org.example.back_end.models.entities.Attachment;
import org.example.back_end.models.entities.Card;
import org.example.back_end.models.entities.User;
import org.example.back_end.models.repositories.AttachmentRepository;
import org.example.back_end.models.repositories.CardRepository;
import org.example.back_end.models.services.AttachmentService;
import org.example.back_end.models.services.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {
    private final AttachmentRepository attachmentRepository;
    private final CardRepository cardRepository;
    private final UserService userService;

    private final String uploadDir = "uploads";

    @Override
    @Transactional
    public AttachmentRes uploadAttachment(Long cardId, MultipartFile file, Boolean isCover) {
        User currentUser = userService.getCurrentUser();
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card", "id", cardId));

        if (file.isEmpty()) {
            throw new BadRequestException("Tệp tin không được để trống");
        }

        try {
            Path root = Paths.get(uploadDir);
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String savedFileName = UUID.randomUUID() + "_" + originalName;
            Path destination = root.resolve(savedFileName);

            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + savedFileName;
            boolean makeCover = Boolean.TRUE.equals(isCover);

            Attachment att = new Attachment();
            att.setCard(card);
            att.setFileName(originalName);
            att.setFileUrl(fileUrl);
            att.setFileSize(file.getSize());
            att.setCover(makeCover);
            att.setUploadedBy(currentUser);

            att = attachmentRepository.save(att);

            if (makeCover) {
                card.setCoverUrl(fileUrl);
                cardRepository.save(card);
            }

            return AttachmentRes.builder()
                    .id(att.getId())
                    .name(att.getFileName())
                    .url(att.getFileUrl())
                    .size(formatFileSize(att.getFileSize()))
                    .isCover(att.isCover())
                    .createdAt(att.getCreatedAt())
                    .build();

        } catch (IOException e) {
            throw new BadRequestException("Không thể lưu tệp: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AttachmentRes toggleCover(Long attachmentId, Boolean isCover) {
        Attachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        boolean coverState = Boolean.TRUE.equals(isCover);
        att.setCover(coverState);
        att = attachmentRepository.save(att);

        Card card = att.getCard();
        if (coverState) {
            card.setCoverUrl(att.getFileUrl());
        } else if (att.getFileUrl().equals(card.getCoverUrl())) {
            card.setCoverUrl(null);
        }
        cardRepository.save(card);

        return AttachmentRes.builder()
                .id(att.getId())
                .name(att.getFileName())
                .url(att.getFileUrl())
                .size(formatFileSize(att.getFileSize()))
                .isCover(att.isCover())
                .createdAt(att.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteAttachment(Long attachmentId) {
        Attachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        Card card = att.getCard();
        if (att.getFileUrl().equals(card.getCoverUrl())) {
            card.setCoverUrl(null);
            cardRepository.save(card);
        }

        attachmentRepository.delete(att);
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}

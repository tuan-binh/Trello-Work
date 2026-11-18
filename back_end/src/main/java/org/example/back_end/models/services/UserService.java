package org.example.back_end.models.services;

import org.example.back_end.models.dto.responses.UserRes;
import org.example.back_end.models.entities.User;

public interface UserService {
    User getCurrentUser();
    UserRes getCurrentUserProfile();
}

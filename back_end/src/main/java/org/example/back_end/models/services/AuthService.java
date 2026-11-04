package org.example.back_end.models.services;

import org.example.back_end.models.dto.requests.LoginReq;
import org.example.back_end.models.dto.requests.RegisterReq;
import org.example.back_end.models.dto.responses.JwtRes;

public interface AuthService {
    void register(RegisterReq req);

    JwtRes login(LoginReq req);
}

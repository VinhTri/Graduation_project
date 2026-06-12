package com.project.app.common.service;

public interface EmailService {
    void sendEmail(String to, String subject, String text);
}

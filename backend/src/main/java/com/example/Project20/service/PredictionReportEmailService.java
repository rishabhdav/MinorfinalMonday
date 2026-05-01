package com.example.Project20.service;

import com.example.Project20.exception.ExternalServiceException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class PredictionReportEmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String fromAddress;

    public PredictionReportEmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                                        @Value("${app.mail.from:${spring.mail.username:}}") String fromAddress) {
        this.mailSenderProvider = mailSenderProvider;
        this.fromAddress = fromAddress;
    }

    public void sendReport(String recipientEmail, String subject, String message, byte[] pdfBytes, String filename) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new ExternalServiceException("Mail sender is not configured", null);
            }
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(message, false);
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));
            mailSender.send(mimeMessage);
        } catch (MessagingException | RuntimeException ex) {
            throw new ExternalServiceException("Unable to send prediction report email", ex);
        }
    }

    public void sendEmail(String recipientEmail, String subject, String message) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new ExternalServiceException("Mail sender is not configured", null);
            }
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(message, false);
            mailSender.send(mimeMessage);
        } catch (MessagingException | RuntimeException ex) {
            throw new ExternalServiceException("Unable to send email", ex);
        }
    }
}

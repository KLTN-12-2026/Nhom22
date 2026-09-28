package com.do_an_tot_nghiep.k28.common.mail;

public record MailRequestedEvent(String to, String subject, String html) {

    @Override
    public String toString() {
        return "MailRequestedEvent[subject=" + subject + "]";
    }
}

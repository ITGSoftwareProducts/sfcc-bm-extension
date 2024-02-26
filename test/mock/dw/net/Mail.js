'use strict';

class Mail {
    constructor() {
        this.to = '';
        this.subject = '';
        this.from = '';
        this.cc = '';
        this.content = '';
        this.contentType = '';
        this.charset = '';
    }

    addTo(recipient) {
        this.to = recipient;
    }

    setSubject(subject) {
        this.subject = subject;
    }

    setFrom(sender) {
        this.from = sender;
    }

    addCc(ccRecipient) {
        this.cc = ccRecipient;
    }

    setContent(content, contentType, charset) {
        this.content = content;
        this.contentType = contentType;
        this.charset = charset;
    }

    send() {
        return true;
    }
}

module.exports = Mail;

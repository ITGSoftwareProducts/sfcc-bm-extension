'use strict';

var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');

/**
 * Send an email
 * @param {Object} options - Email options.
 * @param {String} options.recipient - Email recipients.
 * @param {String} options.template - Email template.
 * @param {String} options.subject - Email subject.
 * @param {String} options.from - Email sender.
 * @param {Object} options.context - Email variables.
 */

var sendMail = function (options) {
    if (!options.from || !(options.template || options.content) || !options.recipient || !options.subject) {
        return;
    }
    var mail = new Mail();
    mail.addTo(options.recipient);
    mail.setSubject(options.subject);
    if (options.ccCustomer) {
        mail.addCc(options.ccCustomer);
    }
    mail.setFrom(options.from);
    var context = options.context;
    var content;
    if (options.content) {
        content = options.content;
    } else {
        var template = new Template(options.template);
        var hashmap = new HashMap();
        if (context) {
            Object.keys(context).forEach(function (key) {
                hashmap.put(key, context[key]);
            });
        }
        content = template.render(hashmap).text;
    }
    mail.setContent(content, 'text/html', 'UTF-8');
    mail.send();
};

module.exports = {
    sendMail: sendMail
};

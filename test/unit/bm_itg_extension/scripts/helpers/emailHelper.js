var assert = require('chai').assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Mail = require('../../../../mock/dw/net/Mail');

var emailHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/emailHelper', {
    'dw/util/Template': function () {
        return {
            render: function () {
                return { text: 'rendered html' };
            }
        };
    },
    'dw/net/Mail': Mail,
    'dw/util/HashMap': function () {
        return {
            result: {},
            put: function (key, context) {
                this.result[key] = context;
            }
        };
    }
});

describe('emailHelper', () => {
    describe('#sendMail', () => {
        it('should send an email with the provided options', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                recipient: 'test@example.com',
                template: 'path/to/your/template',
                subject: 'Test Subject',
                from: 'sender@example.com',
                context: {
                    variable1: 'value1',
                    variable2: 'value2'
                }
            };
            emailHelper.sendMail(options);
            assert.isTrue(mailSpy.calledOnce, 'mail should be sent once');
            mailSpy.restore();
        });

        it('should send email with valid options and ccCustomer', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                recipient: 'test@example.com',
                template: 'path/to/your/template',
                subject: 'Test Subject',
                from: 'sender@example.com',
                ccCustomer: 'cc@example.com',
                context: {
                    variable1: 'value1',
                    variable2: 'value2'
                }
            };
            emailHelper.sendMail(options);
            assert.isTrue(mailSpy.calledOnce, 'mail should be sent once');
            mailSpy.restore();
        });

        it('should send email with valid options and content instead of template', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                recipient: 'test@example.com',
                subject: 'Test Subject',
                from: 'sender@example.com',
                content: '<html><body><h1>Test Email</h1><p>Hello, World!</p></body></html>'
            };
            emailHelper.sendMail(options);
            assert.isTrue(mailSpy.calledOnce, 'mail should be sent once');
            mailSpy.restore();
        });

        it('should not send email if from is missing', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                template: 'path/to/your/template',
                recipient: 'test@example.com',
                subject: 'Test Subject',
                context: {
                    variable1: 'value1',
                    variable2: 'value2'
                }
            };
            emailHelper.sendMail(options);
            assert.isFalse(mailSpy.called, 'mail should not be sent');
            mailSpy.restore();
        });
        it('should not send email if recipient is missing', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                template: 'path/to/your/template',
                from: 'sender@example.com',
                subject: 'Test Subject',
                context: {
                    variable1: 'value1',
                    variable2: 'value2'
                }
            };
            emailHelper.sendMail(options);
            assert.isFalse(mailSpy.called, 'mail should not be sent');
            mailSpy.restore();
        });
        it('should not send email if subject is missing', () => {
            var mailSpy = sinon.spy(Mail.prototype, 'send');
            const options = {
                template: 'path/to/your/template',
                from: 'sender@example.com',
                recipient: 'test@example.com',
                context: {
                    variable1: 'value1',
                    variable2: 'value2'
                }
            };
            emailHelper.sendMail(options);
            assert.isFalse(mailSpy.called, 'mail should not be sent');
            mailSpy.restore();
        });
    });
});

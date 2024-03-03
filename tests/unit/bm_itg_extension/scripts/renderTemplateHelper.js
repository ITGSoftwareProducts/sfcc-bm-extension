'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

describe('renderTemplateHelper', function () {
    beforeEach(() => {
        global.empty = function (value) { return value == null || value === ''; };
    });
    var templateStub = sinon.stub();
    var renderTemplateHelper = proxyquire('../../../../cartridges/bm_itg_extension/cartridge/scripts/renderTemplateHelper', {
        'dw/util/Template': templateStub,
        'dw/util/HashMap': function () {
            return {
                result: {},
                put: function (key, context) {
                    this.result[key] = context;
                }
            };
        }
    });

    describe('#getRenderedHtml', function () {
        it('should the isml template html', function () {
            var context = { test: 'test' };
            var templateName = 'productCardProductRenderedTotalPrice';

            templateStub.returns({
                render: function () {
                    return { text: 'rendered html' };
                }
            });

            var result = renderTemplateHelper.getRenderedHtml(context, templateName);
            assert.equal(result, 'rendered html');
            assert.isTrue(templateStub.calledWith(templateName));
            templateStub.reset();
        });
    });
    describe('#buildHtmlEmailTemplate', function () {
        it('should build HTML email template with given context', function () {
            var context = {
                message: 'Test Message',
                columns: ['Column1', 'Column2'],
                list: [
                    ['Data1', 'Data2'],
                    ['Data3', 'Data4']
                ]
            };

            var expectedHtmlTemplate = '<style>table{font-family:arial,sans-serif;border-collapse:collapse;width:80%;max-width:700px}td,th{border:1px solid #ddd;text-align:left;padding:8px}tr:nth-child(even){background-color:#ddd}</style><h2>Test Message</h><table><tr><th>Column1</th><th>Column2</th></tr><tr><td>Data1</td><td>Data2</td></tr><tr><td>Data3</td><td>Data4</td></tr></table>';

            var result = renderTemplateHelper.buildHtmlEmailTemplate(context);

            assert.strictEqual(result, expectedHtmlTemplate);
        });
        it('should build HTML email template with given context with one item list', function () {
            var context = {
                message: 'Test Message',
                columns: ['Column1', 'Column2'],
                list: [
                    'Data1',
                    'Data2'
                ]
            };

            var expectedHtmlTemplate = '<style>table{font-family:arial,sans-serif;border-collapse:collapse;width:80%;max-width:700px}td,th{border:1px solid #ddd;text-align:left;padding:8px}tr:nth-child(even){background-color:#ddd}</style><h2>Test Message</h><table><tr><th>Column1</th><th>Column2</th></tr><tr><td>Data1</td></tr><tr><td>Data2</td></tr></table>';

            var result = renderTemplateHelper.buildHtmlEmailTemplate(context);

            assert.strictEqual(result, expectedHtmlTemplate);
        });


        it('should handle empty context', function () {
            var context = '';

            var expectedHtmlTemplate = '';

            var result = renderTemplateHelper.buildHtmlEmailTemplate(context);

            assert.strictEqual(result, expectedHtmlTemplate);
        });
    });
});


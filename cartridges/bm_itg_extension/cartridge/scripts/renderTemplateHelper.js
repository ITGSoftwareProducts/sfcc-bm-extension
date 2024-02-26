'use strict';

var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');

/**
 * Gets the render html for the given isml template
 * @param {Object} templateContext - Object that will fill template placeholders
 * @param {string} templateName - The name of the isml template to render.
 * @returns {string} - The rendered isml.
 */
function getRenderedHtml(templateContext, templateName) {
    var context = new HashMap();

    Object.keys(templateContext).forEach(function (key) {
        context.put(key, templateContext[key]);
    });

    var template = new Template(templateName);
    return template.render(context).text;
}

/**
 * Gets the rendered email template for the given context
 * @param {Object} context - Object that will fill html placeholders
 * @returns {string} - The rendered email template.
 */
function buildHtmlEmailTemplate(context) {
    var outputHtml = '';
    if (!empty(context)) {
        var columns = '';
        if (context.columns) {
            for (var i = 0; i < context.columns.length; i++) {
                columns += '<th>' + context.columns[i] + '</th>';
            }
        }

        var rows = '';
        if (context.list) {
            for (var item = 0; item < context.list.length; item++) {
                rows += '<tr>';
                if (context.list[item] instanceof Array) {
                    for (var key = 0; key < context.list[item].length; key++) {
                        rows += '<td>' + context.list[item][key] + '</td>';
                    }
                } else {
                    rows += '<td>' + context.list[item] + '</td>';
                }
                rows += '</tr>';
            }
        }
        outputHtml = '<style>table{font-family:arial,sans-serif;border-collapse:collapse;width:80%;max-width:700px}td,th{border:1px solid #ddd;text-align:left;padding:8px}tr:nth-child(even){background-color:#ddd}</style>';


        if (!empty(context.messageHeader)) {
            outputHtml += context.messageHeader;
        }
        if (!empty(context.message)) {
            outputHtml += '<h2>' + context.message + '</h>';
        }

        if (!empty(rows)) {
            outputHtml += '<table><tr>' + columns + '</tr>' + rows + '</table>';
        }
        if (!empty(context.messageFooter)) {
            outputHtml += context.messageFooter;
        }
    }

    return outputHtml;
}

module.exports = {
    getRenderedHtml: getRenderedHtml,
    buildHtmlEmailTemplate: buildHtmlEmailTemplate
};

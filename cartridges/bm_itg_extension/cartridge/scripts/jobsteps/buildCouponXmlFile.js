// noinspection NestedFunctionJS

'use strict';

/**
 * @module scripts/jobs/synchronizeCustomers
 */

/**
 * @type {dw/system/Log}
 */
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLIndentingStreamWriter = require('dw/io/XMLIndentingStreamWriter');
var FileReader = require('dw/io/FileReader');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');

/**
 * Builds an XML file for coupon configuration based on provided parameters.
 *
 * @param {Object} parameters - An object containing parameters for configuring the coupon XML.
 * @returns {Status} status - Import coupon job status
 *
 * @throws {Error} If there is an issue with file operations or XML writing.
 */
function buildXML(parameters) {
    var couponReplicatorHelper = require('~/cartridge/scripts/helpers/couponReplicatorHelper');
    var constants = require('~/cartridge/scripts/helpers/constants');
    var resultStatus = new Status(Status.OK);
    var couponCodesPath = StringUtils.format('/src{0}{1}/{2}', constants.COUPON_REPLICATOR.IMPEX_PATH, parameters.SiteID, constants.COUPON_REPLICATOR.CODES_FILENAME);

    var couponXmlPath = StringUtils.format('/src{0}{1}/{2}', constants.COUPON_REPLICATOR.IMPEX_PATH, parameters.SiteID, constants.COUPON_REPLICATOR.EXPORTED_FILENAME);
    var couponXML = new File(File.IMPEX + couponXmlPath);
    var readFile = new File(File.IMPEX + couponCodesPath);
    var fileWriter = new FileWriter(couponXML, 'UTF-8');

    var xmlStreamWriter = new XMLIndentingStreamWriter(fileWriter);
    var fileReader = new FileReader(readFile);
    var line;

    try {
        xmlStreamWriter.writeStartDocument('UTF-8', '1.0');
        xmlStreamWriter.writeStartElement('coupons');
        xmlStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/coupon/2008-06-17');

        xmlStreamWriter.writeStartElement('coupon');
        xmlStreamWriter.writeAttribute('coupon-id', parameters.CouponID);

        xmlStreamWriter.writeStartElement('description');
        xmlStreamWriter.writeCharacters(parameters.Description);
        xmlStreamWriter.writeEndElement();

        xmlStreamWriter.writeStartElement('enabled-flag');
        xmlStreamWriter.writeCharacters('false');
        xmlStreamWriter.writeEndElement();

        xmlStreamWriter.writeStartElement('case-insensitive');
        xmlStreamWriter.writeCharacters(parameters.CaseInsensitive);
        xmlStreamWriter.writeEndElement();

        xmlStreamWriter.writeStartElement('redemption-limits');
        xmlStreamWriter.writeStartElement('allow-multiple-codes-per-order');
        xmlStreamWriter.writeCharacters(parameters.MultipleCodesPerBasket);
        xmlStreamWriter.writeEndElement();
        xmlStreamWriter.writeEndElement();

        xmlStreamWriter.writeStartElement('multiple-codes');
        xmlStreamWriter.writeCharacters(null);
        xmlStreamWriter.writeEndElement();

        xmlStreamWriter.writeEndElement();
        if (readFile.exists()) {
            xmlStreamWriter.writeStartElement('coupon-codes');
            xmlStreamWriter.writeAttribute('coupon-id', parameters.CouponID);
            var flag = true;
            while (flag) {
                line = fileReader.readLine();
                if (line !== null) {
                    flag = true;
                    xmlStreamWriter.writeStartElement('code');
                    xmlStreamWriter.writeCharacters(line);
                    xmlStreamWriter.writeEndElement();
                } else {
                    flag = false;
                }
            }

            xmlStreamWriter.writeEndElement();
        }
        fileReader.close();
        xmlStreamWriter.writeEndDocument();
    } finally {
        xmlStreamWriter.close();
        fileWriter.close();
    }
    var jobExecutionObj = couponReplicatorHelper.runCouponReplicatorJob2(parameters.SitesScope, parameters.SiteID);
    if (jobExecutionObj.error) {
        resultStatus = new Status(Status.ERROR, 'ERROR', jobExecutionObj.errorMessage);
    } else if (jobExecutionObj.id) {
        resultStatus = new Status(Status.OK, 'OK', jobExecutionObj.id);
    }
    return resultStatus;
}

module.exports.buildXML = buildXML;

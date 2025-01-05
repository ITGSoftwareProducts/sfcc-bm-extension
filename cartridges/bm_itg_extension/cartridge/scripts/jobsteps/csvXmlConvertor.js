'use strict';

var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLIndentingStreamWriter = require('dw/io/XMLIndentingStreamWriter');
var FileReader = require('dw/io/FileReader');
var CSVStreamReader = require('dw/io/CSVStreamReader');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var StringUtils = require('dw/util/StringUtils');
var xmlCsvConversionHelper = require('~/cartridge/scripts/helpers/xmlCsvConversionHelper');
var csvImportExportHelper = require('~/cartridge/scripts/helpers/csvImportExportHelper');
var commonFileHelper = require('~/cartridge/scripts/helpers/commonFileHelper');
var constants = require('~/cartridge/scripts/helpers/constants');

/**
 * Processes the file.
 * @param {string} file - Path of the files.
 * @param {Object} params - Job params.
 * @returns {Object} status
 */
function processFile(file, params) {
    var fileReader = new FileReader(file, 'UTF-8');
    var XMLReader = new XMLStreamReader(fileReader);
    var folderName = params.CSVFilePath;
    var dirPath = StringUtils.format('{0}{1}src{2}{3}', File.IMPEX, File.SEPARATOR, File.SEPARATOR, folderName);
    commonFileHelper.createDirectory(dirPath);
    var exportFile = new File(dirPath + File.SEPARATOR + params.ExportFileName);
    var fileWriter = new FileWriter(exportFile);
    var csvStreamWriter = new CSVStreamWriter(fileWriter, ',');
    var impexType = params.ImpexType;
    var mainElementName;
    var schema;
    switch (impexType) {
        case 'price_book':
            Logger.info('start converting exported priceBook XML to CSV.', params.ObjectID);
            mainElementName = 'price-table';
            schema = require('~/cartridge/scripts/schemas/pricebookSchema.json');
            break;
        case 'inventory_list':
            Logger.info('start converting exported inventory XML to CSV.', params.ObjectID);
            mainElementName = 'record';
            schema = require('~/cartridge/scripts/schemas/inventorySchema.json');
            var inventoryAttributes = require('~/cartridge/scripts/schemas/inventoryAttributes.json');
            schema = csvImportExportHelper.addCustomAttributes(inventoryAttributes, true, schema, 'record');
            break;
        default:
            break;
    }
    var mappingObject = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, params.DataMappingName);
    if (empty(mappingObject)) {
        return {
            success: false,
            errorMessage: Resource.msg('import.export.no.mapping.defined', 'csvImportExport', null)
        };
    }
    mappingObject = JSON.parse(mappingObject.custom.mappingJson);

    var headers = [];
    for (var i = 0; i < mappingObject.length; i++) {
        var mappingAttr = mappingObject[i];
        // eslint-disable-next-line no-loop-func
        Object.keys(mappingAttr).forEach(function (key) {
            headers[i] = mappingAttr[key];
        });
    }
    csvStreamWriter.writeNext(headers);

    xmlCsvConversionHelper.addCsvRows(XMLReader, csvStreamWriter, mappingObject, schema, mainElementName);
    if (csvStreamWriter && fileWriter) {
        csvStreamWriter.close();
        fileWriter.close();
    }
    XMLReader.close();
    fileReader.close();
    file.remove();
    return {
        success: true
    };
}

/**
 * Creates PriceBook XML
 * @param {dw.io.CSVStreamReader} csvStreamReader - CSVStreamReader
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} params - Params
 * @returns {Object} status
 */
function createPriceBookXML(csvStreamReader, xmlStreamWriter, params) {
    Logger.info('start creating priceBook {0} XML from uploaded CSV.', params.ObjectID);
    try {
        var schema = require('~/cartridge/scripts/schemas/pricebookSchema.json');
        var startDocumentArgs = {
            parentTag1: 'pricebooks',
            parentTag2: 'pricebook',
            namespaceID: 'pricebook'
        };
        xmlCsvConversionHelper.appendStartDocumentTags(xmlStreamWriter, startDocumentArgs);
        xmlCsvConversionHelper.addPriceBookHeader(xmlStreamWriter, params.ObjectID, schema);
        xmlStreamWriter.writeStartElement('price-tables');
        var args = {
            DataMappingName: params.DataMappingName,
            schema: schema,
            innerElementName: 'price-table'
        };
        var status = xmlCsvConversionHelper.writeXmlInnerElements(csvStreamReader, xmlStreamWriter, args);
        if (!status.success) {
            return {
                success: false,
                errorMessage: status.errorMessage
            };
        }
        xmlCsvConversionHelper.appendEndDocumentTags(xmlStreamWriter, 3);

        Logger.info('priceBook {0} XML is created', params.ObjectID);
    } catch (e) {
        Logger.error('Error Message: {0}\n{1} {2}', e.message, e.stack);
        return {
            success: false,
            errorMessage: e.message
        };
    }
    return {
        success: true
    };
}

/**
 * Creates Inventory XML
 * @param {dw.io.CSVStreamReader} csvStreamReader - CSVStreamReader
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} params - Params
 * @returns {Object} status
 */
function createInventoryXML(csvStreamReader, xmlStreamWriter, params) {
    Logger.info('start converting inventory {0} XML from provided CSV.', params.ObjectID);
    try {
        var schema = require('~/cartridge/scripts/schemas/inventorySchema.json');
        var inventoryAttributes = require('~/cartridge/scripts/schemas/inventoryAttributes.json');
        schema = csvImportExportHelper.addCustomAttributes(inventoryAttributes, true, schema, 'record');
        var startDocumentArgs = {
            parentTag1: 'inventory',
            parentTag2: 'inventory-list',
            namespaceID: 'inventory'
        };
        xmlCsvConversionHelper.appendStartDocumentTags(xmlStreamWriter, startDocumentArgs);
        xmlCsvConversionHelper.addInventoryHeader(xmlStreamWriter, params.ObjectID, schema);
        xmlStreamWriter.writeStartElement('records');
        var args = {
            DataMappingName: params.DataMappingName,
            schema: schema,
            innerElementName: 'record'
        };
        var status = xmlCsvConversionHelper.writeXmlInnerElements(csvStreamReader, xmlStreamWriter, args);
        if (!status.success) {
            return {
                success: false,
                errorMessage: status.errorMessage
            };
        }
        xmlCsvConversionHelper.appendEndDocumentTags(xmlStreamWriter, 3);

        Logger.info('inventory {0} XML is created', params.ObjectID);
    } catch (e) {
        Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
        return {
            success: false,
            errorMessage: e.message
        };
    }
    return {
        success: true
    };
}

/**
 * Converts XML to CSV.
 * @param {Object} params - Job params.
 * @returns {Object} status
*/
function convertXmlToCsv(params) {
    var xmlExportPath = params.XMLFilePath;
    var impexPath = File.IMPEX + xmlExportPath;
    var directory = new File(impexPath);

    if (directory != null && directory.isDirectory()) {
        try {
            var patternName = '.xml';
            var sortedFileList = commonFileHelper.getFileList(directory, patternName);
            if (sortedFileList != null) {
                for (var i = 0; i < sortedFileList.length; i++) {
                    var fileName = sortedFileList[i];
                    var file = new File(impexPath + fileName);
                    if (file.exists()) {
                        Logger.info('process xml file {0} in path {1}', file.name, impexPath);
                        var result = processFile(file, params);
                        if (!result.success) {
                            Logger.error('Error Message: {0}', result.errorMessage);
                            return new Status(Status.ERROR, 'ERROR', result.errorMessage);
                        }
                        Logger.info('File {0} has been processed successfully', file.name);
                    }
                }
            }
        } catch (e) {
            Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
            return new Status(Status.ERROR, 'ERROR', e.message);
        }
    }

    return new Status(Status.OK);
}

/**
 * Create the xml file from the given csv file to be imported.
 * @param {Object} params - Job params.
 * @returns {dw.system.Status} status
 */
function convertCsvToXml(params) {
    var csvFilePath = params.CSVFilePath;
    var csvFileName = params.ImportFileName;
    var csvFile = new File(File.IMPEX + '/src/' + csvFilePath + '/' + csvFileName);
    var csvStreamReader = new CSVStreamReader(new FileReader(csvFile));
    var xmlFilePath = params.XMLFilePath;
    commonFileHelper.createDirectory(File.IMPEX + xmlFilePath);

    var impexType = params.ImpexType;

    var path = File.IMPEX + xmlFilePath;
    var dir = new File(path);
    if (!dir.exists()) {
        dir.mkdirs();
    }
    var fileName = impexType + '-xml_import.xml';
    var file = new File(path + fileName);
    var fileWriter = new FileWriter(file, 'UTF-8');
    var xmlStreamWriter = new XMLIndentingStreamWriter(fileWriter);
    var result;
    switch (impexType) {
        case 'price_book':
            result = createPriceBookXML(csvStreamReader, xmlStreamWriter, params);
            break;
        case 'inventory_list':
            result = createInventoryXML(csvStreamReader, xmlStreamWriter, params);
            break;
        default:
            break;
    }
    csvFile.remove();
    if (!result.success) {
        Logger.error('Error Message: {0}', result.errorMessage);
        return new Status(Status.ERROR, 'ERROR', result.errorMessage);
    }
    return new Status(Status.OK);
}


/**
 * Converts XML to CSV.
 * @param {Object} params - Job params.
 * @returns {dw.system.Status} status
*/
function execute(params) {
    var ProcessType = params.ProcessType;
    switch (ProcessType) {
        case 'Export':
            return convertXmlToCsv(params);
        case 'Import':
            return convertCsvToXml(params);
        default:
            break;
    }

    return new Status(Status.OK);
}

exports.execute = execute;

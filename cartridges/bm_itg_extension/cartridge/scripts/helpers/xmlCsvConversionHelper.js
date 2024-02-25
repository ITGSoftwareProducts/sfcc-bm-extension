
'use strict';

var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Resource = require('dw/web/Resource');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var constants = require('~/cartridge/scripts/helpers/constants');

/**
 * Append XML start document tags.
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XML document
 * @param {Object} args - Args
 */
function appendStartDocumentTags(xmlStreamWriter, args) {
    xmlStreamWriter.writeStartDocument('UTF-8', '1.0');
    var namespaceDate = args.namespaceID === 'inventory' ? '/2007-05-31' : '/2006-10-31';
    xmlStreamWriter.writeStartElement(args.parentTag1);
    xmlStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/' + args.namespaceID + namespaceDate);
    xmlStreamWriter.writeStartElement(args.parentTag2);
}

/**
 * Append XML end document tags.
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XML document
 * @param {Object} parentElementsCount - Parent elements count
 */
function appendEndDocumentTags(xmlStreamWriter, parentElementsCount) {
    for (var i = 0; i < parentElementsCount; i++) {
        xmlStreamWriter.writeEndElement();
    }
    xmlStreamWriter.writeEndDocument();
    xmlStreamWriter.close();
}

/**
 * Add XML header.
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} object - Object
 * @param {Object} headerSchema - HeaderSchema
 */
function addXMLHeader(xmlStreamWriter, object, headerSchema) {
    xmlStreamWriter.writeStartElement('header');
    if (headerSchema.attributes && Object.keys(headerSchema.attributes).length) {
        Object.keys(headerSchema.attributes).forEach(function (attr) {
            var attrName = headerSchema.attributes[attr].mappingAttributeId;
            if (object[attrName]) {
                xmlStreamWriter.writeAttribute(attr, object[attrName]);
            }
        });
    }
    if (headerSchema.elements && Object.keys(headerSchema.elements).length) {
        Object.keys(headerSchema.elements).forEach(function (element) {
            var elementName = headerSchema.elements[element].value ? headerSchema.elements[element].value.mappingAttributeId : '';
            var elementValue = object[elementName] || '';
            if (!empty(headerSchema.elements[element].dataType)) {
                elementValue = convertValueType(elementValue, headerSchema.elements[element].dataType)
            }
            if (!empty(elementValue)) {
                xmlStreamWriter.writeStartElement(element);
                xmlStreamWriter.writeCharacters(elementValue);
                xmlStreamWriter.writeEndElement();
            }
        });
    }
    xmlStreamWriter.writeEndElement();
}

/**
 * Add pricebook XML header.
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {string} priceBookID - PriceBookID
 * @param {Object} schema - Schema
 */
function addPriceBookHeader(xmlStreamWriter, priceBookID, schema) {
    var priceBook = PriceBookMgr.getPriceBook(priceBookID);
    addXMLHeader(xmlStreamWriter, priceBook, schema.header);
}

/**
 * Add inventory XML header.
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {string} inventoryListID - InventoryListID
 * @param {Object} schema - Schema
 */
function addInventoryHeader(xmlStreamWriter, inventoryListID, schema) {
    var inventoryList = ProductInventoryMgr.getInventoryList(inventoryListID);
    addXMLHeader(xmlStreamWriter, inventoryList, schema.header);
}

/**
 * Classify csv lines besed on groupBy attrs.
 *
 * @param {string} lines - CSV lines
 * @param {Array} groupByAttrIndexes - GroupByAttrIndex
 * @returns {Object} lineObj
 */
function classifyLines(lines, groupByAttrIndexes) {
    var lineObj = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var keyValue = 'key';
        if (groupByAttrIndexes) {
            for (var j = 0; j < groupByAttrIndexes.length; j++) {
                var groupByAttr = groupByAttrIndexes[j];
                keyValue += line[groupByAttr];
            }
        }
        if (empty(lineObj[keyValue])) {
            lineObj[keyValue] = [];
        }
        lineObj[keyValue].push(line);
    }
    return lineObj;
}

/**
 * Prepare and write XML Children.
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} mappingSchemaObj - Schema Object
 * @param {Object} object - CSV data object
 */
function prepareXMLChild(xmlStreamWriter, mappingSchemaObj, object) {
    if (!mappingSchemaObj || Object.keys(mappingSchemaObj).length < 1) {
        return;
    }
    var objectTemp = object;
    if (mappingSchemaObj.attributes && Object.keys(mappingSchemaObj.attributes).length) {
        Object.keys(mappingSchemaObj.attributes).forEach(function (attr) {
            var attrObj = mappingSchemaObj.attributes[attr]
            var attrName = attrObj.mappingAttributeId;
            var attrDefaultValue = attrObj.defaultValue;
            var valuesArray = objectTemp[attrName] || [attrDefaultValue];
            if (!empty(valuesArray) && !empty(valuesArray[0])) {
                xmlStreamWriter.writeAttribute(attr, valuesArray[0]);
                valuesArray.splice(0, 1);
                objectTemp[attrName] = valuesArray;
            }
        });
    }
    if (mappingSchemaObj.elements && Object.keys(mappingSchemaObj.elements).length) {
        Object.keys(mappingSchemaObj.elements).forEach(function (element) {
            var elementObj = mappingSchemaObj.elements[element];
            if (!empty(elementObj.elements)) {
                var nestedElements = elementObj.elements;
                xmlStreamWriter.writeStartElement(element);
                Object.keys(nestedElements).forEach(function (nestedElement) {
                    if (nestedElements[nestedElement] instanceof Array) {
                        appendCustomAttribute(xmlStreamWriter, nestedElements, objectTemp);
                    }
                });
                xmlStreamWriter.writeEndElement();
            }
            var elName = elementObj.value ? elementObj.value.mappingAttributeId : '';
            var isMultipleValues = elementObj ? elementObj.multipleValues : false;
            var valuesArray = objectTemp[elName];
            if (elName && objectTemp[elName] && valuesArray[0]) {
                var firstElementWritten = false;
                while (!empty(valuesArray[0]) && (!firstElementWritten || isMultipleValues)) {
                    xmlStreamWriter.writeStartElement(element);
                    var elementValue = convertValueType(valuesArray[0], elementObj.dataType);
                    valuesArray.splice(0, 1);
                    objectTemp[elName] = valuesArray;
                    prepareXMLChild(xmlStreamWriter, elementObj, objectTemp);
                    xmlStreamWriter.writeCharacters(elementValue);
                    xmlStreamWriter.writeEndElement();
                    firstElementWritten = true;
                }
            }
        });
    }
}

function convertValueType(value, type) {
    var convertedValue;
    switch (type) {
        case 'dateTime':
            var inputDate = new Date(value);
            convertedValue = inputDate.toISOString();
            break;
        case 'date':
            var inputDate = new Date(value);
            var isoString = inputDate.toISOString();
            convertedValue = isoString.slice(0, 11).replace('T', 'Z');
            break;
        case 'html':
            convertedValue = StringUtils.decodeString(value, StringUtils.ENCODE_TYPE_HTML);
            break;
        case 'boolean':
            if (!empty(value)) {
                convertedValue = stringToBoolean(value);
            } else {
                convertedValue = 'false';
            }
            break;
        default:
            convertedValue = value;
            break;
    }

    return convertedValue;
}

function stringToBoolean(value) {
    switch (value.toLowerCase()) {
        case 'true':
        case 'yes':
            return 'true';
        case 'false':
        case 'no':
            return 'false';
        default:
            return value;
    }

    return value;
}

function appendCustomAttribute(xmlStreamWriter, nestedElements, object) {
    Object.keys(nestedElements).forEach(function (element) {
        nestedElements[element].forEach(function (item) {
            var elementValue = object[item.value.mappingAttributeId];
            var attributes = Object.keys(item.attributes);
            var attribute = attributes[0];
            xmlStreamWriter.writeStartElement(element);
            xmlStreamWriter.writeAttribute(attribute, item.attributes[attribute].mappingAttributeKey);
            xmlStreamWriter.writeCharacters(elementValue);
            xmlStreamWriter.writeEndElement();
        });
    });
}


/**
 * Get csv validation object
 *
 * @param {Array} mappingObject - MappingObject
 * @param {Object} schema - Schema
 * @param {Object} header - Header
 * @returns {Object} object
 */
function getCsvValidationObj(mappingObject, schema, header) {
    var primaryKeyIndex = null;
    var groupByAttrIndexes = [];
    var isInvalidCsv = false;
    for (var index = 0; index < mappingObject.length; index++) {
        var attr = mappingObject[index];
        var primaryKey = schema.primaryKey;
        var groupByAttrs = primaryKey.groupBy ? primaryKey.groupBy.value : null;
        Object.keys(attr).forEach(function (key) {
            if (key === primaryKey.value) {
                primaryKeyIndex = index;
            } else if (groupByAttrs && groupByAttrs.indexOf(key) !== -1) {
                groupByAttrIndexes.push(index);
            }
            if (attr[key] !== header[index]) {
                isInvalidCsv = true;
            }
        });
    }
    return {
        isInvalidCsv: isInvalidCsv,
        primaryKeyIndex: primaryKeyIndex,
        groupByAttrIndexes: groupByAttrIndexes
    };
}

/**
 * Write XML elements
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} linesObj - CSV lines
 * @param {Object} mappingObject - Defined mapping object
 * @param {Object} args - Args
 */
function writeMultipleCsvLinesToXML(xmlStreamWriter, linesObj, mappingObject, args) {
    var mappingSchemaObj = args.schema.elements[args.innerElementName];
    Object.keys(linesObj).forEach(function (key) {
        var object = {};
        var linesArray = linesObj[key];
        for (var k = 0; k < linesArray.length; k++) {
            var counter = 0;
            var line1 = linesArray[k];
            for (var i = 0; i < mappingObject.length; i++) {
                var mappingAttr = mappingObject[i];
                Object.keys(mappingAttr).forEach(function (attr) {
                    if (empty(object[attr])) {
                        object[attr] = [];
                        object[attr].push(line1[counter]);
                    } else {
                        object[attr].push(line1[counter]);
                    }
                    counter++;
                });
            }
        }
        xmlStreamWriter.writeStartElement(args.innerElementName);
        prepareXMLChild(xmlStreamWriter, mappingSchemaObj, object);
        xmlStreamWriter.writeEndElement();
    });
}

/**
 * Write XML elements
 *
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} line - Line
 * @param {Object} mappingObject - Defined mapping object
 * @param {Object} args - Args
 */
function writeCSVLineToXML(xmlStreamWriter, line, mappingObject, args) {
    var mappingSchemaObj = args.schema.elements[args.innerElementName];
    var object = {};
    for (var j = 0; j < mappingObject.length; j++) {
        var mapAttr = mappingObject[j];
        Object.keys(mapAttr).forEach(function (key) {
            object[key] = [line[j]];
        });
    }
    xmlStreamWriter.writeStartElement(args.innerElementName);
    prepareXMLChild(xmlStreamWriter, mappingSchemaObj, object);
    xmlStreamWriter.writeEndElement();
}

/**
 * Write XML elements
 *
 * @param {dw.io.CSVStreamReader} csvStreamReader - CSVStreamReader
 * @param {dw.io.XMLIndentingStreamWriter} xmlStreamWriter - XMLStreamWriter
 * @param {Object} args - Args
 * @returns {Object} status
 */
function writeXmlInnerElements(csvStreamReader, xmlStreamWriter, args) {
    var mappingObject = CustomObjectMgr.getCustomObject(constants.CSV_IMPORT_EXPORT.DATA_MAPPING.CUSTOM_OBJECT_TYPE, args.DataMappingName);
    if (empty(mappingObject)) {
        return {
            success: false,
            errorMessage: Resource.msg('import.export.no.mapping.defined', 'csvImportExport', null)
        };
    }
    mappingObject = JSON.parse(mappingObject.custom.mappingJson);
    var header = csvStreamReader.readNext();
    // validation
    var csvValidationObj = getCsvValidationObj(mappingObject, args.schema, header);
    if (csvValidationObj.isInvalidCsv) {
        return {
            success: false,
            errorMessage: Resource.msg('import.export.mapping.match.error', 'csvImportExport', null)
        };
    }

    var primaryKeyIndex = csvValidationObj.primaryKeyIndex;
    var groupByAttrIndexes = csvValidationObj.groupByAttrIndexes;
    var line = csvStreamReader.readNext();
    while (line) {
        var nextLine;
        if (!empty(line[primaryKeyIndex])) {
            nextLine = csvStreamReader.readNext();
            var lines = [];
            if (nextLine && nextLine[primaryKeyIndex] === line[primaryKeyIndex]) {
                lines.push(line);

                while (nextLine && nextLine[0] === line[0]) {
                    lines.push(nextLine);
                    line = nextLine;
                    nextLine = csvStreamReader.readNext();
                }
                var linesObj = classifyLines(lines, groupByAttrIndexes);
                writeMultipleCsvLinesToXML(xmlStreamWriter, linesObj, mappingObject, args);
            } else {
                writeCSVLineToXML(xmlStreamWriter, line, mappingObject, args);
            }
        }
        line = nextLine;
    }
    return {
        success: true
    };
}

/**
 * Build CSV record.
 * @param {XML} xmlObj - XML Object
 * @param {Object} mappingSchemaObj - Schema object
 * @param {Object} object - Data object
 * @param {string} namespace - XML namespace
 */
function buildRecord(xmlObj, mappingSchemaObj, object, namespace) {
    if (!mappingSchemaObj || Object.keys(mappingSchemaObj).length < 1) {
        return;
    }
    if (mappingSchemaObj.attributes && Object.keys(mappingSchemaObj.attributes).length) {
        Object.keys(mappingSchemaObj.attributes).forEach(function (attr) {
            var attrName = mappingSchemaObj.attributes[attr].mappingAttributeId;
            var attrValue = xmlObj.attribute(attr).toString();
            if (empty(object[attrName])) {
                object[attrName] = [];
            }
            object[attrName].push(attrValue);
        });
    }
    if (mappingSchemaObj.elements && Object.keys(mappingSchemaObj.elements).length) {
        Object.keys(mappingSchemaObj.elements).forEach(function (element) {
            var attrName = mappingSchemaObj.elements[element].value ? mappingSchemaObj.elements[element].value.mappingAttributeId : '';
            var elements = xmlObj.namespace::[element];
            var nestedElements = mappingSchemaObj.elements[element].elements;
            if (nestedElements) {
                Object.keys(nestedElements).forEach(function (nestedElement) {
                    if (nestedElements[nestedElement] instanceof Array) {
                        appendCustomAttributeToCsv(elements, nestedElements, object, namespace);
                    }
                });
            }
            for (var i = 0; i < elements.length(); i++) {
                object.maxRows = Math.max(elements.length(), object.maxRows || 0);
                var elementValue = elements[i].toString();
                if (empty(object[attrName])) {
                    object[attrName] = new Array();
                }
                object[attrName].push(elementValue);
                buildRecord(elements[i], mappingSchemaObj.elements[element], object, namespace);
            }
        });
    }
}

function appendCustomAttributeToCsv(xmlObj, nestedElements, object, namespace) {
    Object.keys(nestedElements).forEach(function (element) {
        nestedElements[element].forEach(function (item) {
            var attributes = Object.keys(item.attributes);
            var attribute = attributes[0]
            var attrName = item.attributes[attribute].mappingAttributeKey;
            var elements = xmlObj.namespace::[element];
            if (elements[0]) {
                if (empty(object[attrName])) {
                    object[attrName] = new Array();
                }
                object[attrName].push(elements[0].toString());
            }
        });
    });
}

/**
 * Add CSV rows
 *
 * @param {dw.io.XMLStreamReader} XMLReader - XMLReader
 * @param {dw.io.CSVStreamWriter} csvStreamWriter - CSVStreamWriter
 * @param {Array} mappingObject - Mapping object of the processType
 * @param {Object} schema - Schema
 * @param {string} mainElementName - Main tag name
 */
function addCsvRows(XMLReader, csvStreamWriter, mappingObject, schema, mainElementName) {
    while (XMLReader.hasNext()) {
        if (XMLReader.next() === XMLStreamConstants.START_ELEMENT) {
            var localElementName = XMLReader.getLocalName();
            if (mainElementName === localElementName) {
                var xmlObj = XMLReader.readXMLObject();
                var object = { maxRows: 0 };
                var namespace = xmlObj.namespace();
                buildRecord(xmlObj, schema.elements[localElementName], object, namespace);
                while (object.maxRows > 0) {
                    object.maxRows -= 1;
                    var record = [];
                    for (var j = 0; j < mappingObject.length; j++) {
                        var mapAttr = mappingObject[j];
                        Object.keys(mapAttr).forEach(function (key) {
                            if (key.indexOf('custom.') !== -1) {
                                key = key.replace(/^custom\./, '');
                            }
                            var valuesArray = object[key];
                            record[j] = !empty(valuesArray) && valuesArray[0] ? valuesArray[0] : '';
                            if (!empty(valuesArray) && valuesArray.length > 1) {
                                valuesArray.splice(0, 1);
                                object[key] = valuesArray;
                            }
                        });
                    }
                    csvStreamWriter.writeNext(record);
                }
            }
        }
    }
}

exports.addPriceBookHeader = addPriceBookHeader;
exports.addInventoryHeader = addInventoryHeader;
exports.writeXmlInnerElements = writeXmlInnerElements;
exports.addCsvRows = addCsvRows;
exports.appendStartDocumentTags = appendStartDocumentTags;
exports.appendEndDocumentTags = appendEndDocumentTags;

'use strict';

var Logger = require('dw/system/Logger').getLogger('BM-Extension');
var Site = require('dw/system/Site');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var HashMap = require('dw/util/HashMap');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var jobResources = require('~/cartridge/scripts/util/jobResources');

var commonHelper = require('~/cartridge/scripts/helpers/commonFileHelper');
var constants = require('~/cartridge/scripts/helpers/constants');

/**
 * Appends the inner contents of the main exported page.
 * @param {XML} contentXML - Content XML of the exported page.
 * @param {string} xmlContent - XML output content.
 * @param {Array} contentMapsList - Content map list.
 * @param {string} namespace - Namespace.
 */
function appendContents(contentXML, xmlContent, contentMapsList, namespace) {
    var contentLinks = contentXML.namespace::['content-links'];
    if (contentLinks) {
        var contents = contentLinks.namespace::['content-link'];
        for (var j = 0; j < contents.length(); j++) {
            var content = contents[j];
            var contentId = content.attribute('content-id').toString();
            var innerContent = getValueFromMap(contentMapsList, contentId);
            xmlContent.appendChild(innerContent);
            appendContents(innerContent, xmlContent, contentMapsList, namespace);
        };
    }
}

/**
 * Builds the pages XML based on the list of pages and contents.
 * @param {Array} pageMapsList - Map of all pageDesigner pages.
 * @param {Array} contentMapsList - Map of all page designer sub contents.
 * @param {Array} contentIds - List of page IDs to be exported.
 * @param {string} fileData - File info (library tag, encodeString, namespace)
 * @returns {XML} xmlContent
 */
function buildPagesXML(pageMapsList, contentMapsList, contentIds, fileData) {
    var pagesXML = {};
    var xmlContent = new XML(StringUtils.format('{0}</library>', fileData.siteLibraryStartElement));
    var namespace = fileData.namespace;
    contentIds.forEach(function (contentId) {
        var pageXML = getValueFromMap(pageMapsList, contentId.trim());
        if (pageXML) {
            xmlContent.appendChild(pageXML);
            appendContents(pageXML, xmlContent, contentMapsList, namespace)
        } else {
            Logger.warn(StringUtils.format(jobResources['content.invalid.value'], contentId));
        }
    });

    if (xmlContent.children().length()) {
        xmlContent = fileData.encodeString + '\n' + xmlContent;
        pagesXML.xmlContent = xmlContent;
    } else {
        Logger.error(jobResources['invalid.content.for.site']);
        pagesXML.errorMsg = jobResources['invalid.content.for.site'];
    }
    return pagesXML;
}
/**
 * Processes the file to get the list of page designer XML contents.
 * @param {string} directory - Path of the files
 * @param {string} patternString - The file extension.
 * @param {Array} pageMapsList - Page Map.
 * @param {Array} contentMapsList - Content Map.
 * @returns {Array} fileList
 */
function processFile(file, siteLibrary, pageMapsList, contentMapsList) {
    var fileReader = new FileReader(file, 'UTF-8');
    var fileReaderTemp = new FileReader(file, 'UTF-8'); // to get document first line
    var xmlReader = new XMLStreamReader(fileReader);
    var namespace;
    var pageDesignerObj;
    var pageMapIndex = 0;
    var contentMapIndex = 0;
    var pageMapsResult = {};
    var contentMapsResult = {};
    try {
        var encodeString = fileReaderTemp.readLine();
        var libraryStartElement = fileReaderTemp.readLine();
        var libraryID = libraryStartElement && libraryStartElement.split('library-id=') && libraryStartElement.split('library-id="')[1] ? libraryStartElement.split('library-id="')[1].replace('">', '') : null;
        if (siteLibrary === libraryID || (empty(libraryID) && siteLibrary == 'Library')) {
            var contentObj;
            while (xmlReader.hasNext()) {
                var eventType = xmlReader.next();
                if (eventType === XMLStreamConstants.START_ELEMENT) {
                    var localElementName = xmlReader.getLocalName();
                    if (localElementName === 'content') {
                        var contentXmlObj = xmlReader.readXMLObject();
                        namespace = contentXmlObj.namespace();
                        var contentId = contentXmlObj.attribute('content-id').toString();
                        var type = contentXmlObj.namespace::type ? (contentXmlObj.namespace::type).toString() : '';
                        if (type) {
                            if (type.indexOf('page.') > -1 && empty(getValueFromMap(pageMapsList, contentId))) {
                                pageMapsResult = addRecordToMap(pageMapsList, contentId, contentXmlObj, pageMapIndex);
                                pageMapIndex = pageMapsResult.index;
                            } else {
                                contentMapsResult = addRecordToMap(contentMapsList, contentId, contentXmlObj, contentMapIndex);
                                contentMapIndex = contentMapsResult.index;
                            }
                        }
                    }
                }
            }
            pageDesignerObj = {
                pageMapsList: pageMapsResult.mapsList,
                contentMapsList: contentMapsResult.mapsList,
                siteLibraryStartElement: libraryStartElement,
                encodeString: encodeString,
                namespace: namespace
            };
        }
    } catch (e) {
        Logger.error(StringUtils.format(jobResources['proccess.xml.error'], e.message))
    } finally {
        xmlReader.close();
        fileReader.close();
        fileReaderTemp.close();
        file.remove();
    }
    return pageDesignerObj;
}

function addRecordToMap(mapsList, contentId, contentXmlObj, currentIndex) {
    var currentMap = new HashMap();
    if (mapsList) {
        for (var i = 0; i < mapsList.length; i++) {
            if (mapsList[i].containsKey(contentId)) {
                currentMap = mapsList[i];
                break;
            }
        }
    }
    if (currentMap.isEmpty()) {
        currentMap = mapsList[currentIndex];
        if (currentMap.length === constants.PAGE_DESIGNER_EXPORT.HASH_MAP_MAX_SIZE) {
            currentIndex += 1;
            mapsList[currentIndex] = new HashMap();
            currentMap = mapsList[currentIndex];
        }
    }
    currentMap.put(contentId, contentXmlObj);
    return {
        mapsList: mapsList,
        index: currentIndex
    };
}

function getValueFromMap(mapList, key) {
    for (var i = 0; i < mapList.length; i++) {
        var currentMap = mapList[i];
        if (currentMap.hasOwnProperty(key)) {
            return currentMap[key];
        }
    }
    return null;
}

/**
 * Export Page Designer Pages.
 * @param {Object} params - Job params.
*/
function execute(params) {
    var pageMapsList = [new HashMap()];
    var contentMapsList =[new HashMap()];
    var exportFileName = params.ExportFileName ? params.ExportFileName : null;
    var contentIds = params.PageIds ? JSON.parse(params.PageIds) : null;
    var pdLibraryPath = params.PDLibraryPath ? params.PDLibraryPath : null;
    var siteLibrary = params.SiteLibrary ? params.SiteLibrary : null;
    var pdImpexPath = StringUtils.format(constants.PAGE_DESIGNER_EXPORT.IMPEX_PATH, File.IMPEX, Site.getCurrent().ID);

    var pageDesignerObj;

    var impexPath = File.IMPEX + pdLibraryPath;
    var directory = new File(impexPath);

    if (exportFileName && contentIds && directory && directory.isDirectory()) {
        try {
            var patternName = '.xml';
            var sortedFileList = commonHelper.getFileList(directory, patternName);
            if (sortedFileList != null && sortedFileList.length > 0) {
                sortedFileList.toArray().forEach(function(fileName) {
                    var file = new File(impexPath + fileName);
                    if (file.exists()) {
                        var fileObj = processFile(file, siteLibrary, pageMapsList, contentMapsList);
                        if (!empty(fileObj))  {
                            pageDesignerObj = fileObj;
                        }
                    }
                });
            }
        } catch (e) {
            Logger.error('Error Message: {0}\n{1}', e.message, e.stack);
        }
    }
    if (!empty(pageDesignerObj) && !empty(pageDesignerObj.pageMapsList)) {
        var fileData = {
            siteLibraryStartElement: pageDesignerObj.siteLibraryStartElement,
            encodeString: pageDesignerObj.encodeString,
            namespace: pageDesignerObj.namespace
        };
        var pagesXml = buildPagesXML(pageDesignerObj.pageMapsList, pageDesignerObj.contentMapsList, contentIds, fileData);
        if (pagesXml.errorMsg) {
            return Status(Status.ERROR, 'ERROR', pagesXml.errorMsg);
        } else if (pagesXml.xmlContent) {
            commonHelper.createFileInImpex(pagesXml.xmlContent, pdImpexPath, exportFileName, '.xml');
        }
    } else {
        Logger.error(jobResources['no.pages.in.site']);
        return Status(Status.ERROR, 'ERROR', jobResources['no.pages.in.site']);
    }
    return new Status(Status.OK);
}

exports.execute = execute;

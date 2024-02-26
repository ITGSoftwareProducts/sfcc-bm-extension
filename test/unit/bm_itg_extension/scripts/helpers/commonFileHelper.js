/* eslint-disable no-undef */
const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
var ArrayList = require('../../../../mock/dw/util/ArrayList');
var StringUtils = require('../../../../mock/dw/util/StringUtils');
const Logger = require('../../../../mock/dw/system/Logger');
const Response = require('../../../../mock/util/Response');
const File = require('../../../../mock/dw/io/File');
const FileReader = require('../../../../mock/dw/io/FileReader');
const FileWriter = require('../../../../mock/dw/io/FileWriter');

describe('CommonFileHelper', function () {
    var commonFileHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/commonFileHelper', {
        'dw/system/Logger': Logger,
        'dw/io/File': File,
        'dw/io/FileReader': FileReader,
        'dw/io/FileWriter': FileWriter,
        'dw/util/ArrayList': ArrayList,
        'dw/util/StringUtils': StringUtils

    }); // Adjust the path accordingly

    beforeEach(function () {
        global.response = Response;
    });
    afterEach(function () {
        sinon.restore();
    });

    describe('#downloadFile', function () {
        it('should download a file successfully', function () {
            sinon.stub(FileReader.prototype, 'readN');
            sinon.stub(Response, 'addHttpHeader');
            sinon.stub(Response.getWriter(), 'write');


            FileReader.prototype.readN.onCall(0).returns('content1');
            FileReader.prototype.readN.onCall(1).returns('content2');
            FileReader.prototype.readN.onCall(2).returns('');

            var result = commonFileHelper.downloadFile('impexPath', 'fileName', 'fileType');
            // Assert the result
            assert.isTrue(result);
            assert.isTrue(FileReader.prototype.readN.called);
            assert.isTrue(Response.addHttpHeader.called);
            assert.isTrue(Response.getWriter().write.called);
            FileReader.prototype.readN.restore();
            Response.addHttpHeader.restore();
            Response.getWriter().write.restore();
        });

        it('should handle errors during file download', function () {
            sinon.stub(FileReader.prototype, 'readN');
            sinon.stub(Response, 'addHttpHeader');
            sinon.stub(Response.getWriter(), 'write');

            FileReader.prototype.readN.throws(new Error('Fake error'));

            // Call the function you want to test
            var result = commonFileHelper.downloadFile('impexPath', 'fileName', 'fileType');

            // Assert the result
            assert.isFalse(result);
            FileReader.prototype.readN.restore();
            Response.addHttpHeader.restore();
            Response.getWriter().write.restore();
        });
        it('should reaturn true if readN called', function () {
            var fileReader = new FileReader();
            var result = fileReader.readN();
            assert.isTrue(result);
        });
    });

    describe('#createFileInImpex', function () {
        it('should create a file successfully', function () {
            // Create mocks and stubs as needed
            sinon.stub(FileWriter.prototype, 'write');
            sinon.stub(File.prototype, 'exists').returns(true);

            // Call the function you want to test
            commonFileHelper.createFileInImpex('content', 'impexPath', 'fileName', '.txt');
           // Assert as needed
            assert.isTrue(FileWriter.prototype.write.called);
            assert.isTrue(FileWriter.prototype.write.calledWith('content'));


            // Restore stubs if needed
            File.prototype.exists.restore();
            FileWriter.prototype.write.restore();
        });
        it('should make new directory and create a file successfully ', function () {
            // Create mocks and stubs as needed
            sinon.stub(FileWriter.prototype, 'write');
            sinon.stub(File.prototype, 'exists').returns(false);

            // Call the function you want to test
            commonFileHelper.createFileInImpex('content', 'impexPath', 'fileName', '.txt');
           // Assert as needed
            assert.isTrue(FileWriter.prototype.write.called);
            assert.isTrue(FileWriter.prototype.write.calledWith('content'));


            // Restore stubs if needed
            File.prototype.exists.restore();
            FileWriter.prototype.write.restore();
        });
    });
    describe('#getFileList', function () {
        it('should return an empty ArrayList if the directory is empty', function () {
            // Mock dependencies
            var emptyDirectoryMock = {
                list: function () {
                    return [];
                }
            };

            // Call the function you want to test
            var result = commonFileHelper.getFileList(emptyDirectoryMock, 'pattern');
            // Assert the result
            assert.instanceOf(result, ArrayList);
            assert.equal(result.size(), 0);
        });

        it('should return files matching the pattern', function () {
            // Mock dependencies
            var directoryMock = {
                list: function () {
                    return ['file1.txt', 'file2.txt', 'file3.xml', 'otherfile.pdf'];
                }
            };

            // Call the function you want to test
            var result = commonFileHelper.getFileList(directoryMock, '.txt');

            // Assert the result
            assert.instanceOf(result, ArrayList);
            assert.equal(result.size(), 2);
            assert.equal(result.get(0), 'file1.txt');
            assert.equal(result.get(1), 'file2.txt');
        });

        it('should handle an empty patternString', function () {
            // Mock dependencies
            var directoryMock = {
                list: function () {
                    return ['file1.txt', 'file2.txt', 'file3.xml', 'otherfile.pdf'];
                }
            };

            // Call the function you want to test
            var result = commonFileHelper.getFileList(directoryMock, '');
            // Assert the result
            assert.instanceOf(result, ArrayList);
            assert.equal(result.size(), 0);
        });
    });
    describe('#createDirectory', function () {
        it('should not create a directory if it already exists', function () {
            // Mock dependencies
            const dirPath = '/path/to/directory';

            sinon.stub(File.prototype, 'exists').returns(true);
            sinon.stub(File.prototype, 'mkdir');

            // Call the function you want to test
            commonFileHelper.createDirectory(dirPath);

            // Assert the interactions
            assert.isTrue(File.prototype.exists.called);
            assert.isFalse(File.prototype.mkdir.called);


            // Restore the stubs
            File.prototype.exists.restore();
            File.prototype.mkdir.restore();
        });

        it('should  create a directory if it is not exist', function () {
            // Mock dependencies
            const dirPath = '/path/to/existing-directory';

            sinon.stub(File.prototype, 'exists').returns(false);
            sinon.stub(File.prototype, 'mkdir').returns(true);

            // Call the function you want to test
            commonFileHelper.createDirectory(dirPath);

            // Assert the interactions
            assert.isTrue(File.prototype.exists.called);
            assert.isTrue(File.prototype.mkdir.called);


            // Restore the stubs
            File.prototype.exists.restore();
            File.prototype.mkdir.restore();
        });

        it('should create a directory successfully', function () {
            var file = new File();
            var mkdir = file.mkdir();
            assert.isTrue(mkdir);
        });
    });
});

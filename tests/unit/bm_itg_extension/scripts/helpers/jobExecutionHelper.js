const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Resource = require('../../../../mock/dw/web/Resource');
const DW = require('../../../../mock/dw');
let jobServicesHelper = {
    getAllJobsExecutions: sinon.stub()
};

describe('JobExecutionHelper', function () {
    const jobExecutionHelper = proxyquire('../../../../../cartridges/bm_itg_extension/cartridge/scripts/helpers/jobExecutionHelper', {
        'dw/system/System': DW.system.System,
        'dw/web/Resource': Resource,
        '~/cartridge/scripts/helpers/jobServicesHelper': jobServicesHelper
    });
    describe('#getJobExecutionReport', function () {
        it('should return a map containing job execution details organized by job ID, with additional metadata such as the beginDate and lastDate of the report', () => {
            const startTime = new Date();
            const endTime = new Date();
            const pageNumber = 1;

            const jobExecutionList = {
                data: {
                    hits: [
                        {
                            job_id: 'job1',
                            start_time: new Date().toISOString().slice(0, 10),
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 1000,
                            status: 'success'
                        },
                        {
                            job_id: 'job2',
                            start_time: new Date().toISOString().slice(0, 10),
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 2000,
                            status: 'success'
                        }
                    ],
                    total: 2,
                    start: 0,
                    count: 2
                }
            };

            jobServicesHelper.getAllJobsExecutions.returns(jobExecutionList);

            const result = jobExecutionHelper.getJobExecutionReport(startTime, endTime, pageNumber);

            assert.deepEqual(result, {
                total: 2,
                jobExecutionObj: {
                    job1: [
                        {
                            job_id: 'job1',
                            start_time: new Date().toISOString().slice(0, 10),
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 1000,
                            status: 'success'
                        }
                    ],
                    job2: [
                        {
                            job_id: 'job2',
                            start_time: new Date().toISOString().slice(0, 10),
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 2000,
                            status: 'success'
                        }
                    ]
                },
                allData: true,
                count: 2,
                start: 0,
                startTime: startTime,
                endTime: endTime
            });
        });
        it('should handle last four hours flag correctly', () => {
            var fourHoursAgo = new Date();
            fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
            const startTime = fourHoursAgo;
            const endTime = new Date();
            const pageNumber = 1;
            const isLastFourHours = 'true';
            jobServicesHelper.getAllJobsExecutions.returns({
                data: {
                    hits: [
                        {
                            job_id: 'job1',
                            start_time: startTime,
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 1000,
                            status: 'success'
                        }
                    ],
                    total: 1,
                    start: 0,
                    count: 1
                }
            });
            var result = jobExecutionHelper.getJobExecutionReport(startTime, endTime, pageNumber, isLastFourHours);
            assert.strictEqual(result.total, 1);
            assert.strictEqual(result.count, 1);
            assert.strictEqual(result.start, 0);
            assert.isTrue(result.allData);
        });
        it('should handle allData flag correctly', () => {
            var fourHoursAgo = new Date();
            fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
            const startTime = fourHoursAgo;
            const endTime = new Date();
            const pageNumber = 1;
            const isLastFourHours = 'true';

            jobServicesHelper.getAllJobsExecutions.returns({
                data: {
                    hits: [
                        {
                            job_id: 'job1',
                            start_time: startTime,
                            end_time: new Date().toISOString().slice(0, 10),
                            duration: 1000,
                            status: 'success'
                        }
                    ],
                    total: 1,
                    start: -1,
                    count: 1
                }
            });
            var result = jobExecutionHelper.getJobExecutionReport(startTime, endTime, pageNumber, isLastFourHours);
            assert.strictEqual(result.total, 1);
            assert.strictEqual(result.count, 1);
            assert.strictEqual(result.start, -1);
            assert.isFalse(result.allData);
        });
    });
    describe('#getJobRatio', function () {
        it('should calculate the ratio of cumulative job execution duration to the total time duration when there are job executions within the specified time range', () => {
            const startTime = new Date();
            const endTime = new Date();
            const pageNumber = 1;

            const jobExecutionList = {
                data: {
                    hits: [
                        { duration: 1000 },
                        { duration: 2000 },
                        { duration: 3000 }
                    ],
                    total: 3,
                    start: 0,
                    count: 3
                }
            };

            jobServicesHelper.getAllJobsExecutions.returns(jobExecutionList);

            const result = jobExecutionHelper.getJobRatio(startTime, endTime, pageNumber);
            assert.deepEqual(result, { success: true, jobRatio: '0.000', warning: false });
        });
    });
});

'use strict';
var $ = jQuery;

let myChart = null;
let dataLabels = [];
let datasets = [];

const getDataLabels = function (dataLabels) { // eslint-disable-line
    const capitalizedLabel = function (label) {
        const firstCharacter = label ? label.charAt(0).toUpperCase() : '';
        return firstCharacter + label.slice(1);
    };
    return dataLabels.map(label => `${capitalizedLabel(label)} Executions`);
};

const formatTime = function (timestamp) {
    const hours = ('0' + timestamp.getHours()).slice(-2);
    const minutes = ('0' + timestamp.getMinutes()).slice(-2);
    const seconds = ('0' + timestamp.getSeconds()).slice(-2);
    const milliseconds = ('00' + timestamp.getMilliseconds()).slice(-3);
    const formatedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    return formatedTime;
};
function pad(number, width = 2) {
    return number.toString().padStart(width, '0');
}

function formatDuration(durationInMilliseconds) {
    const hours = Math.floor(durationInMilliseconds / 3600000);
    const minutes = Math.floor((durationInMilliseconds % 3600000) / 60000);
    const seconds = Math.floor((durationInMilliseconds % 60000) / 1000);
    const milliseconds = durationInMilliseconds % 1000;

    const formattedDuration = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(milliseconds, 3)}`;

    return formattedDuration;
}

const initializeCanvas = function ({ startTime, endTime, data }) {
    if (myChart) {
        // return;
        myChart.destroy();
        myChart = null;
    }
    datasets.push(...data);
    // datasets = [datasets[0]]
    // dataLabels = [dataLabels[0]]

    var startTimeZeroSeconds = new Date(startTime);
    startTimeZeroSeconds.setSeconds(0, 0);

    const chartHeight = 90 + (dataLabels.length * 60);
    $('.chart-area-wrapper2').attr('height', chartHeight);
    $('#myChart').attr('height', chartHeight);

    var ctx = document.getElementById('myChart').getContext('2d');
    var rectangleSet = false;

    const config = {
        type: 'bar',
        data: {
            datasets,
            labels: getDataLabels(dataLabels)
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked: true,
                    ticks: {
                        stepSize: 1,
                        fontColor: '#11181C',
                        padding: 25,
                        align: 'start',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                x: {
                    min: startTimeZeroSeconds,
                    max: endTime,
                    type: 'time',
                    position: 'top',

                    time: {
                        unit: 'minute'
                    },
                    ticks: {
                        autoSkip: false,
                        reverse: false,
                        stepSize: 5,
                        fontColor: '#687076',
                        padding: 12
                    },
                    barPercentage: 0.9,
                    categoryPercentage: 0.9
                }
            },
            animation: {
                onProgress: function () {
                    if (!rectangleSet && myChart) {
                        var scale = window.devicePixelRatio;

                        var sourceCanvas = myChart.canvas;
                        var copyWidth = myChart.scales.y.width - 28;
                        var copyHeight = myChart.scales.y.height + myChart.scales.y.top + 10;

                        var targetCtx = document.getElementById('axis-test').getContext('2d');

                        targetCtx.scale(scale, scale);
                        targetCtx.canvas.width = copyWidth * scale;
                        targetCtx.canvas.height = copyHeight * scale;

                        targetCtx.canvas.style.width = `${copyWidth}px`;
                        targetCtx.canvas.style.height = `${copyHeight}px`;
                        targetCtx.drawImage(sourceCanvas, 0, 0, copyWidth * scale, copyHeight * scale, 0, 0, copyWidth * scale, copyHeight * scale);

                        var sourceCtx = sourceCanvas.getContext('2d');

                        // Normalize coordinate system to use css pixels.
                        sourceCtx.clearRect(0, 0, copyWidth * scale, copyHeight * scale);
                        rectangleSet = true;

                        $('.chart-area-wrapper').scrollLeft(0);
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false,
                    position: 'nearest',
                    external: function (context) {
                        // Tooltip Element
                        let tooltipEl = document.getElementById('chartjs-tooltip');

                        // Create element on first render
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
                            tooltipEl.innerHTML = '<table class="custom-tooltip bg-surface-white  d-flex"></table>';
                            document.body.appendChild(tooltipEl);
                        }

                        // Hide if no tooltip
                        const tooltipModel = context.tooltip;
                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        /**
                        * Returns the lines of the given body item.
                        *
                        * @param {type} bodyItem - The body item.
                        * @returns {type} - The lines of the body item.
                        */
                        function getBody(bodyItem) {
                            return bodyItem.lines;
                        }

                        // Set Text
                        if (tooltipModel.body) {
                            const bodyLines = tooltipModel.body.map(getBody);
                            let innerHtml = '<tbody>';
                            const tooltipData = context.tooltip.dataPoints[0].dataset;
                            bodyLines.forEach(function () {
                                const startTimeEl = '<td class="tooltip-label text-end slate-11 text-sm pe-4"> Start Time </td><td class="text-start">' + formatTime(tooltipData.startTime) + '</td>';
                                const endTimeEl = '<td class="tooltip-label slate-11 text-end text-sm pe-4"> End Time </td><td class="text-start">' + (tooltipData.endTime ? formatTime(tooltipData.endTime) : ' - ') + '</td>';
                                const duration = '<td class="tooltip-label slate-11 text-end text-sm pe-4 pb-3"> Duration </td><td class="pb-3 text-start">' + formatDuration(tooltipData.duration) + '</td>';

                                let statusClass = '';
                                let tooltipStatus = tooltipData.status;
                                if (tooltipStatus === 'OK') {
                                    tooltipStatus = 'Success';
                                }
                                if (tooltipData.status === 'OK') {
                                    statusClass = 'badge success-badge';
                                } else if (tooltipData.status === 'ERROR') {
                                    statusClass = 'badge error-badge';
                                } else if (['PENDING', 'RUNNING'].indexOf(tooltipData.status) !== -1) {
                                    statusClass = 'badge in-progress-badge';
                                } else {
                                    statusClass = 'badge back-order-badge';
                                }
                                const status = '<td class="text-end text-sm pe-4 pt-3"> Exit Status </td><td class="d-flex align-items-center text-start text-sm mt-3 ' + statusClass + '">' + tooltipStatus + '</td>';
                                innerHtml += '<tr class="scheduled-time">' + startTimeEl + '</tr>';
                                innerHtml += '<tr class="scheduled-time">' + endTimeEl + '</tr>';
                                innerHtml += '<tr class="duration">' + duration + '</tr>';

                                const executor = tooltipData.userLogin ? 'Client User' : 'Server';
                                const executorCell = '<td class="tooltip-label slate-11 text-end text-sm pe-4 pt-3 pb-3"> Executor Type </td><td class="text-start">' + executor + '</td>';
                                innerHtml += `<tr class="executor">${executorCell}</tr>`;
                                let userLogin = '';
                                if (tooltipData.userLogin) {
                                    userLogin = '<td class="tooltip-label slate-11 text-end text-sm pe-4 pb-3"> Client User ID </td><td class="text-start pb-3">' + tooltipData.userLogin + '</td>';
                                    innerHtml += '<tr class="user-login">' + userLogin + '</tr>';
                                }
                                innerHtml += '<tr class="status ' + tooltipData.status.toLowerCase() + '">' + status + '</tr>';
                            });
                            innerHtml += '</tbody>';

                            let tableRoot = tooltipEl.querySelector('.custom-tooltip');
                            tableRoot.innerHTML = innerHtml;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        const desiredLeft = (position.left + window.scrollX + tooltipModel.caretX) - tooltipEl.clientWidth;
                        const desiredTop = (position.top + window.scrollY + tooltipModel.caretY) - tooltipEl.clientHeight - 22;

                        // Display, position, and set styles for font
                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.position = 'absolute';
                        tooltipEl.style.left = desiredLeft + 'px';
                        tooltipEl.style.top = desiredTop + 'px';
                        tooltipEl.style.pointerEvents = 'none';
                    }
                }
            }
        }
    };
    $('.empty-search-result').addClass('d-none');
    $('.chart-wrapper').removeClass('d-none');

    myChart = new Chart(ctx, config); // eslint-disable-line
};
function changeTimezone(date, ianatz) {
    var invdate = new Date(date.toLocaleString('en-US', {
        timeZone: ianatz
    }));
    var ms = date.getMilliseconds();
    var diff = date.getTime() - invdate.getTime();
    var convertedDate = new Date(date.getTime() - diff);
    return new Date(convertedDate.setMilliseconds(ms));
}

const getTimeRange = (start, end, timeZone) => {
    var startDateTime = changeTimezone(new Date(start), timeZone);
    var endDateTime = end ? changeTimezone(new Date(end), timeZone) : changeTimezone(new Date(), timeZone);

    var startTime = startDateTime.getTime();
    var endTime = endDateTime.getTime();
    if (endTime - startTime < 60000) {
        return [startTime, startTime + 60000];
    }
    return [startTime, endTime];
};
const mapChartData = function (result) {
    var { endTime, jobExecutionObj, startTime, total, timeZone } = result;
    let jobDatasets = [];
    if (jobExecutionObj) {
        const jobsLabels = Object.keys(jobExecutionObj);
        jobsLabels.forEach((label) => {
            if (dataLabels.indexOf(label) === -1) {
                dataLabels.push(label);
            }
        });

        jobDatasets = Object.entries(jobExecutionObj).reduce((acc, curr) => {
            const [id, executions] = curr;
            const jobIndex = dataLabels.indexOf(id);

            const jobExecutionList = executions.filter((execution) => new Date(execution.start_time) >= new Date(startTime)).map((execution) => {
                var { job_id, start_time: start, end_time: end, status, executor, duration, userLogin } = execution;
                const COLORS = {
                    PENDING: '#ede9fe',
                    RUNNING: '#ede9fe',
                    OK: '#D2F7ED',
                    ERROR: '#FFE5E5',
                    ABORTED: '#FFF8BB',
                    DEFAULT: '#FFF8BB'
                };
                const BORDERS = {
                    PENDING: '#aa99ec',
                    RUNNING: '#aa99ec',
                    OK: '#40C4AA',
                    ERROR: '#E5484D',
                    ABORTED: '#EBBC00',
                    DEFAULT: '#EBBC00'
                };
                const dataArray = new Array(jobIndex + 1);
                dataArray[jobIndex] = getTimeRange(start, end, timeZone);
                start = changeTimezone(new Date(start), timeZone);
                end = end ? changeTimezone(new Date(end), timeZone) : null;
                return {
                    // eslint-disable-next-line camelcase
                    label: `${id} - ${job_id}`,
                    data: [...dataArray],
                    backgroundColor: COLORS[status] || COLORS.DEFAULT,
                    borderWidth: '1',
                    borderRadius: 8,
                    borderColor: BORDERS[status] || BORDERS.DEFAULT,
                    borderSkipped: false,
                    startTime: start,
                    userLogin: userLogin,
                    endTime: end,
                    duration: duration,
                    executor: executor,
                    status: status
                };
            });
            acc.push(...jobExecutionList);
            return acc;
        }, []);
    }
    startTime = changeTimezone(new Date(startTime), timeZone);
    endTime = changeTimezone(new Date(endTime), timeZone);
    return {
        jobDatasets,
        startTime,
        endTime,
        total
    };
};

const printChartInfo = function ({ startTime, endTime, total }) {
    const startDate = new Date(startTime).toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
    const endDate = new Date(endTime).toLocaleDateString(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
    const options = { hour: 'numeric', minute: 'numeric' };
    const sTime = new Date(startTime).toLocaleTimeString(undefined, options);
    const eTime = new Date(endTime).toLocaleTimeString(undefined, options);
    if (startDate === endDate) {
        $('.chart-info .date').text(startDate);
    } else {
        $('.chart-info .date').text(`${startDate} - ${endDate}`);
    }

    $('.chart-info .start-time').text(sTime);
    $('.chart-info .space').text('-');
    $('.chart-info .end-time').text(eTime);

    if (total === 1) {
        $('.chart-info .total-executions').text(`${total} Execution`);
    } else if (total > 1) {
        $('.chart-info .total-executions').text(`${total} Executions`);
    } else {
        // Handle the case when total is less than 1 if needed
        $('.chart-info .total-executions').text('');
    }
};

const updateChart = function ({ jobDatasets, startTime, endTime, total }) {
    printChartInfo({ startTime, endTime, total });

    if (total === 0) {
        if (myChart) {
            myChart.destroy();
        }
        $('.empty-search-result').removeClass('d-none');
        $('.empty-search-result .empty-job-execution-msg1').text('No job executions were found in the selected time frame.');
        $('.chart-wrapper').addClass('d-none');
        $('.empty-job-execution-msg2').addClass('d-none');
        return;
    }
    initializeCanvas({ startTime, endTime, data: jobDatasets });
};

const checkChart = function () {
    var target = document.getElementById('axis-test').getContext('2d');
    if (myChart) {
        myChart.destroy();
        myChart = null;
        datasets = [];
        dataLabels = [];
        target.clearRect(0, 0, target.canvas.width, target.canvas.height);
    }
};

module.exports = {
    checkChart: checkChart,
    initializeCanvas: initializeCanvas,
    mapChartData: mapChartData,
    printChartInfo: printChartInfo,
    updateChart: updateChart
};

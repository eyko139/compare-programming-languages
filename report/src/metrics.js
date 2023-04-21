import Chart from 'chart.js/auto';
const semver = require('semver')

import reportFilesJSON from './loadtest-results.json';

const reportFiles = {...reportFilesJSON};

let loadTestData = {};
let requestCountData = {};
let requestCountTableData = [];
let buildDurationData = {};
let startupDurationData = {};
let imageSizeData = {};
let cpuDataSet = {};
let memDataSet = {};
let containerImageSizeChart;
let requestCountChart;
let buildDurationChart;
let startupDurationChart;
let requestDurationChart;
let cpuChart;
let memChart;
let requestCountTable;
let imageSizeChart;
let imageSizeTable;


function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return 0;
    const k = 1024;
    const dm = 2;
    const result = parseFloat((bytes / Math.pow(k, 2)).toFixed(dm))
    return result;

}


function prepareContainerImageSizesData(prefix, containerImageData){
    const imageSize = containerImageData["image-size"];

    if(!imageSizeData.labels){
        imageSizeData.labels=[];
    }

    if(!imageSizeData.datasets){
        imageSizeData.datasets=[];
    }
    if (!imageSizeData.service) {
        imageSizeData.service = prefix
    }
    if (!imageSizeData.total) {
        imageSizeData.total =  []
    }
    imageSizeData.labels.push(prefix);
    imageSizeData.service = prefix
    imageSizeData.total.push({
        "label": prefix,
        "data": [{
            "y": formatBytes(imageSize),
            "x": prefix
        }]
    });
    imageSizeData.datasets.push({
        "label": prefix,
        "data": [{
            "y": formatBytes(imageSize),
            "x": prefix
        }]
    });
}

function prepareStartupDurationData(prefix, data) {

    if(!startupDurationData.labels){
        startupDurationData.labels=[];
    }

    if(!startupDurationData.datasets){
        startupDurationData.datasets=[{
            "label": "startupTime",
            "data": [],
        }];
    }
    if (!startupDurationData.total) {
        startupDurationData.total =  []
    }
    startupDurationData.labels.push(prefix);
    startupDurationData.datasets[0].data.push(data.startup_time_in_seconds);
    startupDurationData.total.push(...startupDurationData.datasets)



}


function prepareBuildDurationData(prefix, buildDuration) {

    if(!buildDurationData.labels){
        buildDurationData.labels=[];
    }

    if(!buildDurationData.datasets){
        buildDurationData.datasets=[{
            "label": "buildDuration",
            "data": [],
        }];
    }
    if (!buildDurationData.total) {
        buildDurationData.total = []
    }

    buildDurationData.labels.push(prefix);
    buildDurationData.datasets[0].data.push(buildDuration.buildDuration);
    buildDurationData.total.push(...buildDurationData.datasets)

}

function prepareLoadTestData(prefix, loadTestResults){
    console.log("prepare-loadtest-data-"+prefix, loadTestResults);
    const httpRequestDurationAvg = loadTestResults.metrics["http_req_duration"].values.avg;
    const httpRequestDurationMax = loadTestResults.metrics["http_req_duration"].values.max;
    const httpRequestDurationMed = loadTestResults.metrics["http_req_duration"].values.med;
    const httpRequestDurationMin = loadTestResults.metrics["http_req_duration"].values.min;
    const httpRequestDurationP90 = loadTestResults.metrics["http_req_duration"].values["p(90)"];
    const httpRequestDurationP95 = loadTestResults.metrics["http_req_duration"].values["p(95)"];
    const totalRequests = loadTestResults.metrics["http_reqs"].values.count;
    const totalErrors = loadTestResults.metrics["http_req_failed"].values.passes;


    // prepare request count data
    if(!requestCountData.labels){
        requestCountData.labels=[];
    }
    requestCountData.labels.push(prefix);

    if(!requestCountData.datasets){
        requestCountData.datasets=[{
            "label": "totalRequests",
            "data": [],
        }, {
            "label": "failedRequests",
            "data": [],
        }];
    }

    if (!requestCountData.total) {
        requestCountData.total = []
    }

    requestCountData.datasets[0].data.push(totalRequests);
    requestCountData.datasets[1].data.push(totalErrors);

    requestCountTableData.push({
        "name": prefix,
        "totalRequests": totalRequests,
        "failedRequests": totalErrors,
    });
    requestCountData.total.push(requestCountData.datasets[0])
    requestCountData.total.push(requestCountData.datasets[1])



    // prepare duration data
    if(!loadTestData.labels){
        loadTestData.labels=["average", "median", "max", "min", "p90", "p95"];
    }

    if(!loadTestData.datasets){
        loadTestData.datasets=[];
    }
    if (!loadTestData.total) {
        loadTestData.total = []
    }
    loadTestData.datasets[loadTestData.datasets.length]= {
        label: prefix,
        data: [httpRequestDurationAvg, httpRequestDurationMed, httpRequestDurationMax, httpRequestDurationMin, httpRequestDurationP90, httpRequestDurationP95]
    };
    loadTestData.total.push(...loadTestData.datasets);



}

function unifyValues(values){
    const result = [];
    var min = Math.min(...values.map(item => item["timestamp"]));
    values.map(item => {
        result.push({
            x: item["timestamp"] - min,
            y: item["cpu-usage"].replace("m",""),
        })
    });
    return result;


}


function unifyValuesMemory(values){
    const result = [];
    var min = Math.min(...values.map(item => item["timestamp"]));
    values.map(item => {
        result.push({
            x: item["timestamp"] - min,
            y: item["memory-usage"].replace("Mi",""),
        })
    });
    return result;


}

function prepareMemData(prefix, perfData){
    const values = perfData["memory-data"];
    let unifiedVal = unifyValuesMemory(values);

    if(!memDataSet.labels){
        memDataSet.labels=[];
    }

    if(!memDataSet.datasets){
        memDataSet.datasets=[];
    }
    if (!memDataSet.total) {
        memDataSet.total = []
    }

    memDataSet.labels.push(prefix);
    memDataSet.datasets.push(
        {
            label: prefix,
            data: unifiedVal,
        },
    );

    memDataSet.total.push(...memDataSet.datasets)

}

function prepareCpuData(prefix, perfData){
    const values = perfData["cpu-data"];
    let unifiedVal = unifyValues(values);

    if(!cpuDataSet.labels){
        cpuDataSet.labels=[];
    }

    if(!cpuDataSet.datasets){
        cpuDataSet.datasets=[];
    }
    if (!cpuDataSet.total) {
        cpuDataSet.total = []
    }

    cpuDataSet.labels.push(prefix);
    cpuDataSet.datasets.push(
        {
            label: prefix,
            data: unifiedVal,
        });
    cpuDataSet.total.push(...cpuDataSet.datasets)
}


async function buildRequestCountTable() {
    console.log("requestCountTableData", requestCountTableData)
    requestCountTableData.sort((a, b) => (b.totalRequests) - (a.totalRequests));
    console.log("sorted-requestCountTableData", requestCountTableData)
    const table = document.getElementById("request_count_table");
    var rowCount = table.rows.length;
    var tableHeaderRowCount = 1;
    for (var i = tableHeaderRowCount; i < rowCount; i++) {
        table.deleteRow(tableHeaderRowCount);
    }


    requestCountTableData.map(item => {
        const row = table.insertRow();
        const name = row.insertCell(0);
        const totalRequests = row.insertCell(1);
        const failedRequests = row.insertCell(2);
        name.innerHTML = item.name;
        var totalRequestsValue = (item.totalRequests).toLocaleString(
            undefined, // leave undefined to use the visitor's browser
            // locale or a string like 'en-US' to override it.
            { minimumFractionDigits: 2 }
        );
        totalRequests.innerHTML = totalRequestsValue;
        totalRequests.style.textAlign = "right";

        var failedRequestsValue = (item.failedRequests).toLocaleString(
            undefined, // leave undefined to use the visitor's browser
            // locale or a string like 'en-US' to override it.
            { minimumFractionDigits: 2 }
        );
        failedRequests.innerHTML = failedRequestsValue;
        failedRequests.style.textAlign = "right";
    });
}

async function loadServiceData(prefix, version, serviceReports) {
    console.log("REPORTS", serviceReports)
    console.log("VERSION", version)

    for (const [testType, testPath] of Object.entries(serviceReports)) {
        const reportData = await fetch(testPath)
        .then(response => response.json())
        .catch((err) => new Error("error parsing data for", testPath, err));

        console.log("reportData", reportData)
        prepareTestData(`${prefix}-${version}`, testType, reportData);
    }
}

const prepareTestData = (prefix, testType, data) => {
    switch(testType){
        case 'loadtest-results':
            prepareLoadTestData(prefix, data);
            break;
        case 'container-image-size':
            prepareContainerImageSizesData(prefix, data);
            break;
        case 'perf-cpu':
            prepareCpuData(prefix, data);
            break;
        case 'perf-mem':
            prepareMemData(prefix, data);
            break;
        case 'build-duration':
            prepareBuildDurationData(prefix, data);
            break;
        case 'startup-time':
            prepareStartupDurationData(prefix, data);
            break;
        default: new Error ("unknown test type", testType)
    }
}


async function prepareChartData(filterOptions){
    const filteredData = filterOptions ? filterOptions : reportFiles;
    console.log("STARTING", filteredData)
    for (const service in filteredData) {
        const serviceReportsByVersion = filteredData[service];
        let latestVersion;
        let latestReport;
        for (const [version, report] of Object.entries(serviceReportsByVersion)) {
            if (!latestVersion || !latestReport) {
                latestVersion = version;
                latestReport = report
            }
            if (semver.lt(latestVersion, version)) {
                latestVersion = version;
                latestReport = report
            }
        }
        buildVersionSelector(service, serviceReportsByVersion, latestVersion);
        await loadServiceData(service, latestVersion, latestReport)
    }
    await buildRequestCountTable();
}


const buildVersionSelector = (service, versions, initiallySelected) => {
    if (document.getElementById(`${service}-selector`)) {
        return 
    }
    const selectorContainer = document.getElementById("versionSelect");
    const selector = document.createElement("select");
    selector.id = `${service}-selector`
    for (const version in versions) {
        const option = document.createElement("option");
        option.value = version;
        option.text = `${version} - last run: ${new Date(versions[version].lastRun).toLocaleString()}`;
        selector.appendChild(option);
        if (version === initiallySelected) {
            option.selected = true;
        }
    }
    selector.addEventListener("change", async function(e) {
        updateChartData({service: service, version: e.target.value})
    });
    selectorContainer.appendChild(document.createTextNode(service));
    selectorContainer.appendChild(selector);
}

const updateChartData = async (filterOptions) => {
   let filteredReports =  {...reportFiles}

   const charts = [containerImageSizeChart, requestCountChart, requestDurationChart, startupDurationChart, cpuChart, memChart];
    loadTestData = {};
    requestCountData = {};
    requestCountTableData = [];
    buildDurationData = {};
    startupDurationData = {};
    imageSizeData = {};
    cpuDataSet = {};
    memDataSet = {};
    filteredReports = {
        ...filteredReports,
        [filterOptions.service]: {
          [filterOptions.version]: filteredReports[filterOptions.service][filterOptions.version]
        }
    }
    await prepareChartData(filteredReports);
    charts.forEach(chart => {
        requestDurationChart.data = loadTestData;
        containerImageSizeChart.data = imageSizeData;
        requestCountChart.data = loadTestData;
        startupDurationChart.data = startupDurationData;
        cpuChart.data = cpuDataSet;
        memChart.data = memDataSet;
        chart && chart.update();
   })
}


(async function() {

    await prepareChartData();

    console.log("start drawing charts");
    // container sizes
    console.log("image sizes", imageSizeData)
    containerImageSizeChart = new Chart(
        document.getElementById('container_image_size'),
        {
            type: 'bar',
            options: {
                plugins: {
                    legend: true,
                    title: {
                        display: true,
                        text: "Container Image Size"
                    },
                },
                scales: {
                    x: {
                        display: true,
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Services',
                        },
                    },
                    y: {
                        display: true,
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Size in MB',
                        },
                    }
                },
            },
            data: imageSizeData,
        }
    );

    // startup duration
    console.log("startup-duration-data", startupDurationData)
    startupDurationChart = new Chart(
        document.getElementById('startup_duration_chart'),
        {
            type: 'bar',
            data: startupDurationData,
            options: {
                barValueSpacing: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Startup Duration"
                    },
                    legend: {
                        display: true,
                        position: "right",
                        fullWidth: true,

                    }
                },
                scales: {
                    x: {
                        display: true,
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Services',
                        },
                    },
                    y: {
                        display: true,
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Startup duration in seconds',
                        },
                    }
                }
            }
        });

    //build duration
    console.log("build-duration-data", buildDurationData)
    new Chart(
        document.getElementById('build_duration_chart'),
        {
            type: 'bar',
            data: buildDurationData,
            options: {
                barValueSpacing: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Build Duration"
                    },
                    legend: {
                        display: true,
                        position: "top",
                        fullWidth: true,

                    }
                },
                scales: {
                    x: {
                        display: true,
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Services',
                        },
                    },
                    y: {
                        display: true,
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Build duration in seconds',
                        },
                    }
                }
            }
        });

    // request count chart
    console.log("request_count-data", requestCountData)
    requestCountChart = new Chart(
        document.getElementById('request_count_chart'),
        {
            type: 'bar',
            data: requestCountData,
            options: {
                responsive: true,
                barValueSpacing: 2,
                plugins: {
                    title: {
                        display: true,
                        text: "Http Request Counts"
                    },
                    legend: {
                        display: true,
                        position: "top",
                        fullWidth: true,

                    }
                },
                scales: {
                    x: {
                        display: true,
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Services',
                        },
                    },

                    y: {
                        display: true,
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Amount of Requests',
                        },
                    }
                }
            }
        });

    // request duration charts
    console.log("request_duration-data", loadTestData)
    requestDurationChart = new Chart(
        document.getElementById('http_req_duration'),
        {
            type: 'bar',
            options: {
              responsive: true,
              categoryPercentage: 0.8,
              barPercentage: 0.8,
              plugins: {
                  beforeInit: function(chart, options) {
                      chart.legend.afterFit = function() {
                          this.height = this.height + 50;
                      };
                  },
                  legend: {
                      display: true,
                      position: "right",
                      fullWidth: true,

                  },
                  title: {
                      display: true,
                      text: "Http Request Duration - log scale"
                  },
              },
              scales: {
                  x: {
                      type: 'category',
                      labels: loadTestData.labels,
                      title: {
                          display: true,
                          text: 'Durations',
                      },
                  },
                  y: {
                      display: true,
                      type: 'logarithmic',
                      // type: 'linear',
                      title: {
                          display: true,
                          text: 'Time in ms',
                      },
                  }
              },
            },
            data: loadTestData,

        }
    );


    // resource data
    // cpu - loadtest results
    console.log("cpu_data", cpuDataSet);
    cpuChart = new Chart(
        document.getElementById('perf_cpu'),
        {
            type: 'line',
            options: {
                parsing: {
                    xAxisKey: 'x',
                    yAxisKey: 'y'
                },
                plugins: {
                    legend: true,
                    title: {
                        display: true,
                        text: "CPU Usage"
                    },
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Time in seconds',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'CPU Usage',
                        },
                    }
                },
            },
            data: cpuDataSet,
        }
    );



    console.log("memDataSet", memDataSet);
    memChart = new Chart(
        document.getElementById('perf_mem'),
        {
            type: 'line',
            options: {
                parsing: {
                    xAxisKey: 'x',
                    yAxisKey: 'y'
                },
                plugins: {
                    legend: true,
                    title: {
                        display: true,
                        text: "Memory Usage"
                    },
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Time in seconds',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Memory Usage in MB',
                        },
                    }
                },
            },
            data: memDataSet,
        }
    );

})();

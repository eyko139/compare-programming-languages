const fs = require('fs');
const glob = require('glob');
const path = require("path");



glob('./dist/reports/**/*.json', (err, files) => {
    if (err) {
        return console.error(err)
    }

    // Print all files
    console.log(files)

    // Iterate over all files
    let resultJSON = {};
    let services = [];
    files.forEach(file => {
        console.log(file)
        const servicePath = path.dirname(file).split(path.sep);
        console.log(servicePath)
        if (!servicePath || !servicePath.length) {
            throw new Error("could not resolve path to report file, must be /<service_name>/<version>/<file>.json", file)
        }
        const serviceName = servicePath[servicePath.length - 2]
        const serviceVersion = servicePath[servicePath.length - 1]
        console.log("serviceName", serviceName);
        console.log("serviceVersion", serviceVersion);
        if(!resultJSON[serviceName]){
            resultJSON[serviceName]=[];
        }
        let basename = path.basename(file, '.json');
        const relativePath = path.relative("./dist", file);
        resultJSON = {
            ...resultJSON,
            [serviceName]: {
                ...resultJSON[serviceName],
                [serviceVersion]: {
                    ...resultJSON[serviceName][serviceVersion],
                    [basename]: relativePath
                }
            }
        }
    })

    console.log(resultJSON)

    const data = JSON.stringify(resultJSON)

// write file to disk
    fs.writeFile('./src/loadtest-results.json', data, 'utf8', err => {
        if (err) {
            console.log(`Error writing file: ${err}`)
        } else {
            console.log(`File is written successfully!`)
        }
    })

})
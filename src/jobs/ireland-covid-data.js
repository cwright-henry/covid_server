const fs = require('fs');
const JSZip = require('jszip')
const https = require('https');

/**
 * Number of retries for each request
 */
const MAX_RETRIES = 5;

/**
 * Ireland Covid Data File
 * 
 * Source URL
 * https://services1.arcgis.com/eNO7HHeQ3rUcBllm/arcgis/rest/services/Covid19CountyStatisticsHPSCIreland/FeatureServer/0/query?f=json&cacheHint=true&resultOffset=0&resultRecordCount=32000&where=(TimeStamp%20BETWEEN%20CURRENT_TIMESTAMP%20-%20120%20AND%20CURRENT_TIMESTAMP)&orderByFields=TimeStamp%20ASC&outFields=ConfirmedCovidCases%2CPopulationCensus16%2CTimeStamp%2CCountyName%2CLat%2CLong&resultType=standard&returnGeometry=false&spatialRel=esriSpatialRelIntersects
 */
const COVID_DATA_FILE = {
    request: {
        host: 'services1.arcgis.com',
        path: '/eNO7HHeQ3rUcBllm/arcgis/rest/services/Covid19CountyStatisticsHPSCIreland/FeatureServer/0/query?f=json&cacheHint=true&resultOffset=0&resultRecordCount=32000&where=(TimeStamp%20BETWEEN%20CURRENT_TIMESTAMP%20-%20120%20AND%20CURRENT_TIMESTAMP)&orderByFields=TimeStamp%20ASC&outFields=ConfirmedCovidCases%2CPopulationCensus16%2CTimeStamp%2CCountyName%2CLat%2CLong&resultType=standard&returnGeometry=false&spatialRel=esriSpatialRelIntersects',
        port: 443,
        method: 'GET',
        timeout: 600000, // 10 minute timeout
        headers: {       // Fake the user agent
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
        }
    },
    file: './covid_data/ireland_covid_data.json',
    tempFile: './covid_data/ireland_covid_data.json.tmp',
    name: 'Ireland Covid Data',
    retries: 0,
    expectedFileSize: 400000
};

/**
 * Make the request and pipe to backup file
 */
const makeRequest = (options) => {
    return new Promise((resolve, reject) => {
        const writeFileStream = fs.createWriteStream(options.tempFile);
        const request = https.request(options.request, (reponse) => {
            if (reponse.statusCode >= 200 && reponse.statusCode <= 299) {
                reponse.pipe(writeFileStream);
            }
            else {
                reject(`${options.name}: Invalid status code ${reponse.statusCode}`)
            }
        });

        // Request Events
        request.end();
        request.on('error', e => reject(e));
        request.on('timeout', () => {
            request.abort();
            reject(`${options.name}: Request Timeout`)
        })

        // Stream Events
        writeFileStream.on('finish', () => {
            fs.stat(options.tempFile, (err, stats) => {
                if (err) {
                    console.log(`${options.name}: Unable to read tmp file`, err)
                    return reject(err)
                }
                if(stats.size > options.expectedFileSize) {
                    resolve(true)
                }
                else {
                    reject(err)
                }
            });
        });
        writeFileStream.on('error', (e) => {
            reject(e)
        })
    })
}

/**
 * Copy contents to actual file
 */
const getData = (options) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`${options.name}: Requesting Data...`)
            await makeRequest(options)
            const writeFileStream = fs.createWriteStream(options.file);
            const readFileStream = fs.createReadStream(options.tempFile);
            readFileStream.pipe(writeFileStream);

            // All Data should be flushed at this point - clean up time!
            writeFileStream.on('finish', () => {
                fs.unlink(options.tempFile, (err) => {
                    if (err) {
                        console.error(`${options.name}: Error removing temp file`, err);
                        return;
                    }
                    resolve(true);
                });
            })
            writeFileStream.on('error', (e) => {
                reject(e)
            })
        }
        catch (e) {
            reject(e)
        }
    });
}

/**
 * Connect to service if failed then try again for RETRIES 
 */
const getCovidData = async () => {
    try {
        ++COVID_DATA_FILE.retries;
        await getData(COVID_DATA_FILE);
        COVID_DATA_FILE.retries = 0;
    }
    catch (e) {
        console.log(e);
        if (COVID_DATA_FILE.retries < MAX_RETRIES) {
            setTimeout(() => {
                getCovidData();
            }, 5000)
        }
        else {
            COVID_DATA_FILE.retries = 0;
        }
    }
}

module.exports = {
    getIrelandCovidData: getCovidData,
    CovidIrelandDataFileName: COVID_DATA_FILE.file
}
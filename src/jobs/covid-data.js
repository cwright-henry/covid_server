const fs = require('fs');
const JSZip = require('jszip')
const https = require('https');

/**
 * Number of retries for each request
 */
const MAX_RETRIES = 5;

/**
 * Covid Data File
 * 
 * https://spreadsheets.google.com/feeds/list/1qRN1CTiEBqQkxfOUI8_wYfXiWxoVjHKiwruslmfOqSs/1/public/values?alt=json
 */
const COVID_DATA_FILE = {
    request: {
        host: 'api.covid19api.com',
        path: '/export',
        port: 443,
        method: 'GET',
        timeout: 600000, // 10 minute timeout
        headers: {
            'accept': 'application/zip'
        }
    },
    file: './covid_data/covid_data.zip',
    backupFile: './covid_data/covid_data_backup.zip', // Temporary solution till we get a valid file
    tempFile: './covid_data/covid_data.zip.tmp',
    name: 'Covid Data',
    retries: 0
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
            fs.readFile(options.tempFile, async (err, data) => {
                if (err) {
                    console.log(`${options.name}: Unable to read tmp file`, err)
                    reject(err)
                }
                try {
                    await new JSZip().loadAsync(data);
                    fs.stat(options.tempFile, (err, bacStats) => {
                        console.log(`${options.name}: Valid Backup file of size = ${bacStats.size}`)
                        resolve(true);
                    });
                }
                catch (e) {
                    fs.stat(options.tempFile, (err, bacStats) => {
                        console.log(`${options.name}: Corrupted file of size = ${bacStats.size}`)
                        console.log(e)
                        reject(e)
                    })
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
    getCovidData,
    CovidDataFileName: COVID_DATA_FILE.backupFile
}
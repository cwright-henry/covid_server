const fs = require('fs');
const cheerio = require('cheerio')
const https = require('https');

const uuid = () => {
    return parseInt(Math.random().toString().slice(2, 11))
}

/**
 * Covid Vacine File
 * 
 * https://covid-19tracker.milkeninstitute.org
 */
const COVID_VACINE_FILE = {
    request: {
        host: 'covid-19tracker.milkeninstitute.org',
        path: '/',
        port: 443,
        method: 'GET',
        timeout: 600000, // 10 minute timeout
        headers: {       // Fake the user agent
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/51.0.2704.79 Chrome/51.0.2704.79 Safari/537.36',
        }
    },
    file: './covid_data/covid_vacine.json',
    name: 'Covid Vacine Data',
    retries: 0,
}

/**
 * Number of retries for each request
 */
const MAX_RETRIES = 5;

/**
 * Make the request and pipe to backup file
 */
const makeRequest = (options) => {
    return new Promise((resolve, reject) => {
        let buffers = []

        let req = https.request(options.request, (response) => {
            response.on("data", (data) => {
                buffers.push(data);
            });

            response.on("end", () => {
                if (response.statusCode == 200)
                    return resolve(Buffer.concat(buffers))
                return reject(Buffer.concat(buffers));
            });
        });

        req.on('error', (error) => {
            return reject(error, null);
        });
        req.end();
    });
}

function checkAndMarkUpdates(json, options) {
    return new Promise((resolve, reject) => {
        fs.readFile(options.file, 'utf8', function (err, data) {
            if (err) {
                // file does not exist so set last updated on all items
                for (const item of json) {
                    item.updated = Date.now()
                }
                resolve()
                return;
            }

            try {
                const prevJSON = JSON.parse(data);
                for (const item of json) {
                    const prevEntry = prevJSON.find(prevItem => prevItem.vaccine === item.vaccine)
                    if (prevEntry) {
                        // Check against entry file
                        if (prevEntry.entry !== item.entry) {
                            item.updated = Date.now()
                        }
                        else {
                            item.updated = prevEntry.updated;
                        }
                    }
                    // New item so add now as last update
                    else {
                        item.updated = Date.now()
                    }
                }
                resolve()
            }
            catch (e) {
                reject(e)
            }
        });
    });
}

function parseHtmlAndSave(data, options) {
    return new Promise(async (resolve, reject) => {
        try {
            const $ = cheerio.load(data);
            const json = [];
            const parseRow = (context, type) => {
                const developer = $('.is_developer', context).text()
                const vaccine = $('.is_vaccines', context).text()
                const stage = $('.is_stage', context).text();
                const nextStage = $('.chart_row-expanded', context)
                const funder = $('div:nth-child(4)', $('div:nth-child(2)', nextStage)).text();
                const relatedUse = $('div:nth-child(4)', $('div:nth-child(3)', nextStage)).text();
                const nextSteps = $('div:nth-child(4)', $('div:nth-child(4)', nextStage)).text();
                const clinicalTrials = $('div:nth-child(4)', $('div:nth-child(5)', nextStage)).text();
                return {
                    id: uuid(),
                    developer,
                    vaccine,
                    stage,
                    funder,
                    relatedUse,
                    nextSteps,
                    clinicalTrials,
                    type,
                    entry: `${developer} ${vaccine} ${stage} ${funder} ${relatedUse} ${nextSteps} ${clinicalTrials} ${type}`
                }
            }

            $('#vaccine_DNA-Based .chart_row').each(function () {
                json.push(parseRow(this, 'dna-based'))
            });
            $('#vaccine_inactivated-virus .chart_row').each(function () {
                json.push(parseRow(this, 'inactivated-virus'))
            });
            $('#vaccine_live-atten .chart_row').each(function () {
                json.push(parseRow(this, 'live-atten'))
            });
            $('#vaccine_Non-replicating-viral-vector .chart_row').each(function () {
                json.push(parseRow(this, 'non-replicating-viral-vector'))
            });
            $('#vaccine_Protein-subunit .chart_row').each(function () {
                json.push(parseRow(this, 'protein-subunit'))
            });
            $('#vaccine_Replicating-viral-vector .chart_row').each(function () {
                json.push(parseRow(this, 'replicating-viral-vector'))
            });
            $('#vaccine_RNA-based-vaccine .chart_row').each(function () {
                json.push(parseRow(this, 'rna-based-vaccine'))
            });
            $('#vaccine_Virus-like-particle .chart_row').each(function () {
                json.push(parseRow(this, 'virus-like-particle'))
            });
            $('#vaccine_Unknown .chart_row').each(function () {
                json.push(parseRow(this, 'other'))
            });

            await checkAndMarkUpdates(json, options)

            fs.writeFile(options.file, JSON.stringify(json), function (err) {
                if (err) {
                    reject(err)
                    return;
                }
                resolve(true)
            });
        }
        catch (e) {
            reject(e)
        }
    })
}

/**
 * Retrieve the html page, parse the data and save the result
 */
const getCovidVaccineData = async () => {
    try {
        ++COVID_VACINE_FILE.retries;
        console.log(`${COVID_VACINE_FILE.name}: Requesting Data...`)
        const data = await makeRequest(COVID_VACINE_FILE);
        await parseHtmlAndSave(data, COVID_VACINE_FILE);
        console.log(`${COVID_VACINE_FILE.name}: Success`)
        COVID_VACINE_FILE.retries = 0;
    }
    catch (e) {
        console.log(e);
        if (COVID_VACINE_FILE.retries < MAX_RETRIES) {
            setTimeout(() => {
                getCovidVaccineData();
            }, 5000)
        }
        else {
            COVID_VACINE_FILE.retries = 0;
        }
    }
}

fs.access(COVID_VACINE_FILE.file, fs.F_OK, (err) => {
    if (err) {
        getCovidVaccineData()
    }
})

module.exports = {
    getCovidVaccineData,
    VACCINE_FILE: COVID_VACINE_FILE.file
}

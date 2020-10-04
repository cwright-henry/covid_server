const fs = require('fs');
const https = require('https');
const express = require('express');
const CronJob = require('cron').CronJob;
const PORT = 3000;
const app = express()

/**
 * API data
 */
const opts = {
	host: 'api.covid19api.com',
	path: '/export',
	port: 443,
	method: 'GET',
	timeout: 5000,
	headers: {
		'accept': 'application/zip'
	}

};

/**
 * Data Files - in case the download is corrupted use a backup
 */
const DATA_FILE = './covid_data/data.file';
const DATA_BAC_FILE = './covid_data/data.file.bac'

/**
 * Number of retries
 */
const RETRIES = 5;
let currentRetries = 0;

/**
 * Make the request and pipe to backup file
 */
const makeRequest = () => {
	return new Promise((resolve, reject) => {
		const writeFileStream = fs.createWriteStream(DATA_BAC_FILE);
		const request = https.request(opts, (reponse) => {
			if (reponse.statusCode >= 200 && reponse.statusCode <= 299) {
				reponse.pipe(writeFileStream);
			}
			else {
				reject(`Invalid status code ${reponse.statusCode}`)
			}
		});

		// Request Events
		request.end();
		request.on('error', e => reject(e));
		request.on('timeout', () => {
			request.abort();
			reject('Request Timeout')
		})
		request.once('socket', (socket) => {
			socket.once('connect', () => {
				console.log('connected.')
			});
		});

		// Stream Events
		writeFileStream.on('finish', function () {
			fs.stat(DATA_FILE, (err, stats) => {
				if (err) { // 
					resolve(true);
				}
				else {
					fs.stat(DATA_BAC_FILE, (err, bacStats) => {
						if (stats.size <= bacStats.size) {
							resolve(true);
						}
						else {
							reject('Corrupted file')
						}
					});
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
const getData = () => {
	return new Promise(async (resolve, reject) => {
		try {
			console.log('Requesting Data...')
			await makeRequest()
			const writeFileStream = fs.createWriteStream(DATA_FILE);
			const readFileStream = fs.createReadStream(DATA_BAC_FILE);
			readFileStream.pipe(writeFileStream);

			// All Data should be flushed at this point.
			writeFileStream.on('finish', () => {
				fs.stat(DATA_FILE, (err, stats) => {
					console.log(`New Data File Size ${stats.size}`)
				});
				resolve(true);
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
const connectToService = async () => {
	try {
		++currentRetries;
		await getData();
		currentRetries = 0;
	}
	catch (e) {
		console.log(e);
		if (currentRetries < RETRIES) {
			setTimeout(() => {
				connectToService();
			}, 2000)
		}
		else {
			currentRetries = 0;
		}
	}
}

/**
 * Cron Job - every hour try and refresh the contents of
 * our data file
 */
const cronJob = new CronJob('0 * * * *', function () {
	console.log(`Running cron at ${new Date()}`)
	connectToService()
}, null, true, 'UTC');
cronJob.start();

/**
 * Routing
 */
app.get('/covid/api/export', (req, res) => {
	const readFileStream = fs.createReadStream(DATA_FILE);
	readFileStream.pipe(res);
	readFileStream.on('close', () => {
		res.end();
	});
});

/**
 * When we start up check that the file exists
 */
fs.stat(DATA_FILE, (err, stats) => {
	if (err) {
		connectToService()
	}
});

/**
 * Start Application
 */
app.listen(PORT, () => {
	console.log(`Server listeing on ${PORT}`)
});
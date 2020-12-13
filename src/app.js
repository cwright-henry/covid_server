const fs = require('fs');
const express = require('express');
const CronJob = require('cron').CronJob;
const helmet = require("helmet");
const { getIrelandCovidData, CovidIrelandDataFileName } = require('./jobs/ireland-covid-data') 
const { getCovidVaccineData, CovidVaccineFileName } = require('./jobs/covid-vacine-data')
const { getCovidData, CovidDataFileName } = require('./jobs/covid-data')

/**
 * Lets get ready to rumble!
 */
const PORT = 3000;
const app = express()
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.disable('x-powered-by');


/**
 * Cron Jobs - Covid Data every hour on the hour
 */
const covidDataJob = new CronJob('0 * * * *', function () {
	console.log(`Running covid data cron at ${new Date()}`)
	getCovidData();
}, null, true, 'UTC');
covidDataJob.start();

/**
 * Cron Jobs - Covid Vaccine Data once a day at mid-night.
 */
const covidVacineJob = new CronJob('0 0 * * *', function () {
	console.log(`Running covid vaccine data cron at ${new Date()}`)
	getCovidVaccineData();
}, null, true, 'UTC');
covidVacineJob.start();

/**
 * Cron Jobs - Ireland Covid Data every 2 hours as not sure
 * when this source is updated
 */
const covidIrelandDataJob = new CronJob('0 */2 * * *', function () {
	console.log(`Running covid ireland data cron at ${new Date()}`)
	getIrelandCovidData();
}, null, true, 'UTC');
covidIrelandDataJob.start();

/**
 * Routing
 */
app.get('/covid/api/covid-data', (req, res) => {
	const readFileStream = fs.createReadStream(CovidDataFileName);
	readFileStream.pipe(res);
	readFileStream.on('close', () => {
		res.end();
	});
});

app.get('/covid/api/covid-vaccine-data', (req, res) => {
	const readFileStream = fs.createReadStream(CovidVaccineFileName);
	res.setHeader('Content-Type', 'application/json');
	readFileStream.pipe(res);
	readFileStream.on('close', () => {
		res.end();
	});
});

app.get('/covid/api/covid-ireland-data', (req, res) => {
	const readFileStream = fs.createReadStream(CovidIrelandDataFileName);
	res.setHeader('Content-Type', 'application/json');
	readFileStream.pipe(res);
	readFileStream.on('close', () => {
		res.end();
	});
});

/**
 * When we start up check that the file exists
 */
fs.access(CovidDataFileName, fs.F_OK, (err) => {
	if (err) {
		getCovidData();
	}
})

fs.access(CovidVaccineFileName, fs.F_OK, (err) => {
	if (err) {
		getCovidVaccineData()
	}
})

fs.access(CovidIrelandDataFileName, fs.F_OK, (err) => {
	if (err) {
		getIrelandCovidData()
	}
})

/**
 * Start Application
 */
app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`)
});
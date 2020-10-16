const fs = require('fs');
const express = require('express');
const CronJob = require('cron').CronJob;
const app = express()
const { getCovidVaccineData, CovidVaccineFileName } = require('./jobs/covid-vacine-data')
const { getCovidData, CovidDataFileName } = require('./jobs/covid-data')

/**
 * Port to rum on
 */
const PORT = 3000;

/**
 * Cron Jobs - Covid Data every hour
 */
const covidDataJob = new CronJob('0 * * * *', function () {
	console.log(`Running covid data cron at ${new Date()}`)
	getCovidData();
}, null, true, 'UTC');
covidDataJob.start();

/**
 * Cron Jobs - Covid Vaccine Data once a day.
 */
const covidVacineJob = new CronJob('0 0 * * *', function () {
	console.log(`Running covid vaccine data cron at ${new Date()}`)
	getCovidVaccineData();
}, null, true, 'UTC');
covidVacineJob.start();

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

/**
 * Start Application
 */
app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`)
});
const CronJob = require('cron').CronJob;
const { getCovidVaccinationData, getCovidVaccinationLocationData } = require('./covid-vaccines-distribution')
const { getIrelandCovidData } = require('./ireland-covid-data')
const { getCovidVaccineData } = require('./covid-vacine')
const { getAll } = require('./covid-data')

/**
 * Cron Jobs - Covid Data every hour
 * 
 * Check out source, 'Once a day around 23:59 (UTC)':-
 * https://github.com/CSSEGISandData/COVID-19/tree/master/csse_covid_19_data/csse_covid_19_time_series
 */
const covidDataJob = new CronJob('0 * * * *', function () {
	console.log(`Running covid data cron at ${new Date()}`)
	getAll();
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
 * Cron Jobs - Covid Vaccination Data every six hours.
 */
const covidVaccinationJob = new CronJob('0 */6 * * *', function () {
	console.log(`Running covid vaccination data cron at ${new Date()}`)
	getCovidVaccinationData();
}, null, true, 'UTC');
covidVaccinationJob.start();

/**
 * Cron Jobs - Covid Vaccination Location Data once a day at mid-night..
 */
const covidVaccinationLocationJob = new CronJob('0 0 * * *', function () {
	console.log(`Running covid vaccination location data cron at ${new Date()}`)
	getCovidVaccinationLocationData();
}, null, true, 'UTC');
covidVaccinationLocationJob.start();
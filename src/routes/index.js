const fs = require('fs');

const { COVID_VACCINTAION_FILE, COVID_VACCINTAION_LOCATION_FILE } = require('../jobs/covid-vaccines-distribution')
const { IRELAND_COVID_FILE } = require('../jobs/ireland-covid-data')
const { VACCINE_FILE } = require('../jobs/covid-vacine')
const { GLOBAL_CONFIRMED_COVID_FILE,
	US_CONFIRMED_COVID_FILE,
	GLOBAL_DEATHS_COVID_FILE,
	US_DEATHS_COVID_FILE,
	GLOBAL_RECOVERED_COVID_FILE } = require('../jobs/covid-data')


module.exports = (app) => {
	app.get('/covid/api/covid-data-confirmed-global', (req, res) => {
		const readFileStream = fs.createReadStream(GLOBAL_CONFIRMED_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	app.get('/covid/api/covid-data-confirmed-us', (req, res) => {
		const readFileStream = fs.createReadStream(US_CONFIRMED_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	app.get('/covid/api/covid-data-deaths-global', (req, res) => {
		const readFileStream = fs.createReadStream(GLOBAL_DEATHS_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	app.get('/covid/api/covid-data-deaths-us', (req, res) => {
		const readFileStream = fs.createReadStream(US_DEATHS_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	app.get('/covid/api/covid-data-recovered-global', (req, res) => {
		const readFileStream = fs.createReadStream(GLOBAL_RECOVERED_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	/**
	 * WORLD COVID VACCINE DATA
	 */
	app.get('/covid/api/covid-vaccine-data', (req, res) => {
		const readFileStream = fs.createReadStream(VACCINE_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	/**
	 * IRELAND COVID DATA
	 */
	app.get('/covid/api/covid-ireland-data', (req, res) => {
		const readFileStream = fs.createReadStream(IRELAND_COVID_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	/**
	 * WORLD COVID VACCINATION DATA
	 */
	 app.get('/covid/api/covid-vaccinations-data', (req, res) => {
		const readFileStream = fs.createReadStream(COVID_VACCINTAION_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});

	/**
	 * WORLD COVID VACCINATION LOCATION DATA
	 */
	 app.get('/covid/api/covid-vaccinations-location-data', (req, res) => {
		const readFileStream = fs.createReadStream(COVID_VACCINTAION_LOCATION_FILE);
		res.setHeader('Content-Type', 'application/json');
		readFileStream.pipe(res);
		readFileStream.on('close', () => {
			res.end();
		});
	});
}
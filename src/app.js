const express = require('express');
const CronJob = require('cron').CronJob;
const jobs = require('./jobs')
const PORT = 3000;
const app = express()

/**
 * A application forever cache updated when jobs run on the hour
 */
const myCache = {}

/**
 * Cron Jobs - should run on the hour
 */
const jobCoverage = new CronJob('0 */2 * * *', function () {
	console.log(`Running job at ${new Date()}`)
	jobs.runAll().then(data => {
		myCache['coverage'] = data
	}).catch(error => {
		console.log(error)
	})
}, null, true);
jobCoverage.start();


/**
 * Kick off the jobs now
 */
jobs.runAll().then(data => {
	console.log(`Loading data at ${new Date()}`)
	myCache['coverage'] = data
}).catch(error => {
	console.log(error)
})

/**
 * Routing
 */
require('./routes')(app, myCache)

/**
 * Start Application
 */
app.listen(PORT, () => {
	console.log(`Server listeing on ${PORT}`)
});
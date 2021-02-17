const fs = require('fs');
const { confirmedGlobal } = require('./confirmedGlobal')
const { confirmedUS } = require('./confirmedUS')
const { deathsGlobal } = require('./deathsGlobal')
const { deathsUS } = require('./deathsUS')
const { recoveredGlobal } = require('./recoveredGlobal')
const { makeRequest } = require('./daStream')

fs.access(confirmedGlobal.file, fs.F_OK, async (err) => {
	if (err) {
		await makeRequest(confirmedGlobal);
	}
})

fs.access(confirmedUS.file, fs.F_OK, async (err) => {
	if (err) {
		await makeRequest(confirmedUS);
	}
})

fs.access(deathsGlobal.file, fs.F_OK, async (err) => {
	if (err) {
		await makeRequest(deathsGlobal);
	}
})

fs.access(deathsUS.file, fs.F_OK, async (err) => {
	if (err) {
		await makeRequest(deathsUS);
	}
})

fs.access(recoveredGlobal.file, fs.F_OK, async (err) => {
	if (err) {
		await makeRequest(recoveredGlobal);
	}
})

// Leave the heavy lifting of merging
// these files to the client
module.exports = {
	getAll: async () => {
		try {
			await Promise.all([
				makeRequest(confirmedGlobal),
				makeRequest(confirmedUS),
				makeRequest(deathsGlobal),
				makeRequest(deathsUS),
				makeRequest(recoveredGlobal),
			])
		}
		catch (e) {
			// Each job clears up after itself
			console.log(e)
		}
	},
	GLOBAL_CONFIRMED_COVID_FILE: confirmedGlobal.file,
	US_CONFIRMED_COVID_FILE: confirmedUS.file,
	GLOBAL_DEATHS_COVID_FILE: deathsGlobal.file,
	US_DEATHS_COVID_FILE: deathsUS.file,
	GLOBAL_RECOVERED_COVID_FILE: recoveredGlobal.file
}

const { getCovidVaccinationData, COVID_VACCINTAION_FILE } = require('./vaccinations')
const { getCovidVaccinationLocationData, COVID_VACCINTAION_LOCATION_FILE } = require('./vaccineLocations')

module.exports = {
	getCovidVaccinationData,
	getCovidVaccinationLocationData,
	COVID_VACCINTAION_FILE,
	COVID_VACCINTAION_LOCATION_FILE
}
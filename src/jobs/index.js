const API = require('../api');
const Parser = require('./parsing')
const IrelandParser = require('./parseIE')
const Utils = require('../utils')

class Coverage {
    static COUNTRY_URL = "https://restcountries.eu/rest/v2/all";
    static CASES_URL = "https://api.covid19api.com/all";
    static IRELAND_URL = "https://services1.arcgis.com/eNO7HHeQ3rUcBllm/arcgis/rest/services/Covid19CountyStatisticsHPSCIrelandOpenData/FeatureServer/0/query?where=TimeStampDate%20%3E%3D%20TIMESTAMP%20%272020-03-12%2000%3A00%3A00%27%20&outFields=CountyName,PopulationCensus16,Lat,Long,ConfirmedCovidCases,TimeStampDate&outSR=4326&f=json"

    static async getAll() {
        console.log('Starting load')
        Utils.showMemoryUsage()
        const countryData = await API.load(Coverage.COUNTRY_URL);
        const casesData = await API.load(Coverage.CASES_URL);
        const irelandData = await API.load(Coverage.IRELAND_URL);
        console.log('Loaded all data')
        Utils.showMemoryUsage()

        const countries = Parser.parse(countryData, casesData);
        const ireland = IrelandParser.parseIreland(irelandData);
        const ieData = countries.find(item => item.countryCode === "IE");
        if (ieData) {
            ieData.geojson = ireland.geojson;
            ieData.population = ireland.population;
            ieData.series.provinces = ireland.provinces;
        }

        const coverage = Parser.createSeriesCoverage(countries);
        console.log('Parsed coverage file - done')
        Utils.showMemoryUsage()
        return {
            countries, coverage
        }
    }
}

const runAll = async () => {
    return await Coverage.getAll()
}

module.exports = {
    runAll
}
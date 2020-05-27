const Sorting = require('./sorting');
const Utils = require('./utils');

const tsSorter = Sorting.timeseriesSorter('desc')

const numberFormat = new Intl.NumberFormat({ maximumFractionDigits: 0, minimumFractionDigits: 0 });

const createFeatureCollection = () => {
    return {
        type: 'FeatureCollection',
        features: []
    }
}

const createFeature = (county, stats) => {
    return {
        type: 'Feature',
        properties: {
            name: county.name,
            population: numberFormat.format(county.population || 0),
            totalConfirmed: numberFormat.format(stats.totalConfirmed || 0),
            totalConfirmedRaw: stats.totalConfirmed || 0,
            latestConfirmed: numberFormat.format(stats.latestConfirmed || 0),
            latestConfirmedRaw: stats.latestConfirmed || 0
        },
        geometry: {
            type: 'Point',
            coordinates: [county.lng, county.lat]
        }
    }
}

/**
 * For each county create a timeseries.
 * Create a geoJson for each TimeStampDate.
 * Correct the population
 * 
 * @param {*} data 
 */
const parseIreland = data => {
    let population = 0;
    const history = [];
    const counties = [];
    const geojson = createFeatureCollection();

    for (let i = 0; i < data.features.length; i++) {
        const attributes = data.features[i].attributes;
        let county = counties.find(item => item.name === attributes.CountyName);
        if (!county) {
            county = {
                uuid: Utils.uuid(),
                name: attributes.CountyName,
                population: attributes.PopulationCensus16,
                lat: attributes.Lat,
                lng: attributes.Long,
                ts: {
                    confirmedSeries: [],
                    confirmedDailySeries: []
                },
                stats: {
                    totalConfirmed: 0,
                    latestConfirmed: 0
                }
            }
            population += county.population;
            counties.push(county)
        }
        county.ts.confirmedSeries.push([attributes.TimeStampDate, attributes.ConfirmedCovidCases || 0])
    }

    for (const county of counties) {
        county.ts.confirmedSeries.sort(tsSorter)
        for (let i = 1; i < county.ts.confirmedSeries.length; i++) {
            const current = county.ts.confirmedSeries[i];
            const previous = county.ts.confirmedSeries[i - 1];
            county.ts.confirmedDailySeries.push([current[0], current[1] - previous[1]])

            if (i === county.ts.confirmedSeries.length - 1) {
                county.stats.totalConfirmed = county.ts.confirmedSeries[i][1];
                county.stats.latestConfirmed = current[1] - previous[1];
                geojson.features.push(createFeature(county, {
                    totalConfirmed: county.stats.totalConfirmed,
                    latestConfirmed: county.stats.latestConfirmed
                }))
            }
        }
    }

    return { provinces: counties, population, geojson };
}

module.exports = {
    parseIreland
}

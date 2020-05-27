const Sorting = require('./sorting');

const numberFormat = new Intl.NumberFormat({ maximumFractionDigits: 0, minimumFractionDigits: 0 });
const totalConfirmedSorter = Sorting.sortGeoJson("totalConfirmedRaw", "asc");
const totalRecoveredSorter = Sorting.sortGeoJson("totalRecoveredRaw", "asc");
const totalDeathsSorter = Sorting.sortGeoJson("totalDeathsRaw", "asc");
const lastConfirmedSorter = Sorting.sortGeoJson("latestConfirmedRaw", "asc");
const latestRecoveredSorter = Sorting.sortGeoJson("latestRecoveredRaw", "asc");
const latestDeathsSorter = Sorting.sortGeoJson("latestDeathsdRaw", "asc");

const createFeatureCollection = () => {
    return {
        type: 'FeatureCollection',
        features: []
    }
}

/**
 * Create a Feature entry, the formatted value is used for display
 * and the raw value used for the color gradient.
 * 
 * @param {*} region
 */
const createFeature = (region, stats) => {
    return {
        type: 'Feature',
        properties: {
            name: region.countryName || region.name,
            population: numberFormat.format(region.population || 0),
            countryCode: region.countryCode || '',
            totalConfirmed: numberFormat.format(stats.totalConfirmed || 0),
            totalConfirmedRaw: stats.totalConfirmed || 0,
            totalRecovered: numberFormat.format(stats.totalRecovered || 0),
            totalRecoveredRaw: stats.totalRecovered || 0,
            totalDeaths: numberFormat.format(stats.totalDeaths || 0),
            totalDeathsRaw: stats.totalDeaths || 0,
            latestConfirmed: numberFormat.format(stats.latestConfirmed || 0),
            latestConfirmedRaw: stats.latestConfirmed || 0,
            latestRecovered: numberFormat.format(stats.latestRecovered || 0),
            latestRecoveredRaw: stats.latestRecovered || 0,
            latestDeaths: numberFormat.format(stats.latestDeaths || 0),
            latestDeathsRaw: stats.latestDeaths || 0
        },
        geometry: {
            type: 'Point',
            coordinates: [region.lng, region.lat]
        }
    }
}

/**
 * Each country get a GeoJson object
 * 
 * @param {*} country 
 */
const createGeoJsonForCountry = country => {
    const geoJson = createFeatureCollection()

    if (country.series.provinces.length > 0) {
        for (const province of country.series.provinces) {
            geoJson.features.push(createFeature(province, province.stats));
        }
    }
    else {
        geoJson.features.push(createFeature(country, country.series.stats));
    }

    return geoJson;
}

/**
 * One geoJson for all countries
 * 
 * @param {*} countries
 */
const createGeoJsonForCountries = countries => {
    const totalConfirmed = createFeatureCollection();
    const totalRecovered = createFeatureCollection();
    const totalDeaths = createFeatureCollection();
    const latestConfirmed = createFeatureCollection();
    const latestRecovered = createFeatureCollection();
    const latestDeaths = createFeatureCollection();

    for (const country of countries) {
        if (country.series.stats.totalConfirmed > 0) {
            totalConfirmed.features.push(createFeature(country, {
                totalConfirmed: country.series.stats.totalConfirmed
            }))
        }
        if (country.series.stats.totalRecovered > 0) {
            totalRecovered.features.push(createFeature(country, {
                totalRecovered: country.series.stats.totalRecovered
            }))
        }
        if (country.series.stats.totalDeaths > 0) {
            totalDeaths.features.push(createFeature(country, {
                totalDeaths: country.series.stats.totalDeaths
            }))
        }
        if (country.series.stats.latestConfirmed > 0) {
            latestConfirmed.features.push(createFeature(country, {
                latestConfirmed: country.series.stats.latestConfirmed
            }))
        }
        if (country.series.stats.latestRecovered > 0) {
            latestRecovered.features.push(createFeature(country, {
                latestRecovered: country.series.stats.latestRecovered
            }))
        }
        if (country.series.stats.latestDeaths > 0) {
            latestDeaths.features.push(createFeature(country, {
                latestDeaths: country.series.stats.latestDeaths
            }))
        }
    }

    totalConfirmed.features.sort(totalConfirmedSorter)
    totalRecovered.features.sort(totalRecoveredSorter)
    totalDeaths.features.sort(totalDeathsSorter)
    latestConfirmed.features.sort(lastConfirmedSorter)
    latestRecovered.features.sort(latestRecoveredSorter)
    latestDeaths.features.sort(latestDeathsSorter)

    return { totalConfirmed, totalRecovered, totalDeaths, latestConfirmed, latestRecovered, latestDeaths };
}

/**
 * 	Create history for all countries to be used for animation
 * 	Take any confirmed ts - first one and iterate over the dates
 * 	Remove 0 values and split series
 * 	Sort the final feature set
 * 
 *  @param {*} countries
 */
const createGeoJsonHistoryForCountries = countries => {
    const history = [];
    const baseSeeries = countries[0].series.ts.confirmedSeries;
    for (let i = 1; i < baseSeeries.length; i++) {
        const totalConfirmed = createFeatureCollection();
        const totalRecovered = createFeatureCollection();
        const totalDeaths = createFeatureCollection();
        const latestConfirmed = createFeatureCollection();
        const latestRecovered = createFeatureCollection();
        const latestDeaths = createFeatureCollection();

        for (const country of countries) {
            if (country.series.ts.confirmedSeries[i][1] > 0) {
                totalConfirmed.features.push(createFeature(country, {
                    totalConfirmed: country.series.ts.confirmedSeries[i][1]
                }))
            }
            if (country.series.ts.recoveredSeries[i][1] > 0) {
                totalRecovered.features.push(createFeature(country, {
                    totalRecovered: country.series.ts.recoveredSeries[i][1]
                }))
            }
            if (country.series.ts.deathSeries[i][1] > 0) {
                totalDeaths.features.push(createFeature(country, {
                    totalDeaths: country.series.ts.deathSeries[i][1]
                }))
            }
            if (country.series.ts.confirmedDailySeries[i - 1][1] > 0) {
                latestConfirmed.features.push(createFeature(country, {
                    latestConfirmed: country.series.ts.confirmedDailySeries[i - 1][1]
                }))
            }
            if (country.series.ts.recoveredDailySeries[i - 1][1] > 0) {
                latestRecovered.features.push(createFeature(country, {
                    latestRecovered: country.series.ts.recoveredDailySeries[i - 1][1]
                }))
            }
            if (country.series.ts.deathDailySeries[i - 1][1] > 0) {
                latestDeaths.features.push(createFeature(country, {
                    latestDeaths: country.series.ts.deathDailySeries[i - 1][1]
                }))
            }
        }
        totalConfirmed.features.sort(totalConfirmedSorter)
        totalRecovered.features.sort(totalRecoveredSorter)
        totalDeaths.features.sort(totalDeathsSorter)
        latestConfirmed.features.sort(lastConfirmedSorter)
        latestRecovered.features.sort(latestRecoveredSorter)
        latestDeaths.features.sort(latestDeathsSorter)
        history.push({ date: baseSeeries[i][0], totalConfirmed, totalRecovered, totalDeaths, latestConfirmed, latestRecovered, latestDeaths })
    }

    return history;
}

module.exports = {
    createGeoJsonHistoryForCountries,
    createGeoJsonForCountries,
    createGeoJsonForCountry
}
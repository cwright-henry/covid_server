const Utils = require('./utils');
const GeoJson = require('./geojson');

/**
 * Replace long names with shorter - this helps the map
 */
const replacements = [
	{ longName: "Bolivia (Plurinational State of)", shortName: 'Bolivia' },
	{ longName: "Congo (Democratic Republic of the)", shortName: 'Congo (Democratic Republic)' },
	{ longName: "Iran (Islamic Republic of)", shortName: 'Iran' },
	{ longName: "Lao People's Democratic Republic", shortName: 'Lao' },
	{ longName: "Moldova (Republic of)", shortName: 'Moldova' },
	{ longName: "Palestine, State of", shortName: 'Palestine' },
	{ longName: "Korea (Republic of)", shortName: 'South Korea' },
	{ longName: "Tanzania, United Republic of", shortName: 'Tanzania' },
	{ longName: "Macedonia (the former Yugoslav Republic of)", shortName: 'Macedonia' },
	{ longName: "United Kingdom of Great Britain and Northern Ireland", shortName: 'United Kingdom' },
	{ longName: "United States of America", shortName: 'United States' },
	{ longName: "Venezuela (Bolivarian Republic of)", shortName: 'Venezuela' }
];

const findReplacementName = name => {
	const replacement = replacements.find(item => item.longName === name);
	return replacement ? replacement.shortName : name;
}

const parse = (countries, cases) => {
	const data = [];
	for (const country of countries) {
		const entries = cases.filter(
			item => country.alpha2Code === item.CountryCode
		);
		if (entries.length > 0) {
			const name = findReplacementName(country.name);
			const item = {
				uuid: Utils.uuid(),
				countryName: name,
				filteredName: name.toLowerCase(),
				countryCode: country.alpha2Code,
				countryCode3: country.alpha3Code,
				flag: country.flag,
				population: country.population,
				lat: country.latlng[0],
				lng: country.latlng[1],
				borders: country.borders,
				area: country.area /* Square kilometers */,
				regionName: country.region,
				subRegionName: country.subregion,
				regionCode: country.regionalBlocs[0]
					? country.regionalBlocs[0].acronym
					: "Other",
				series: createdSeriesForCountry(
					entries,
					country.alpha2Code
				)
			};
			item.geojson = GeoJson.createGeoJsonForCountry(item)
			data.push(item)
		}
	}
	return data;
}

/**
 * Coverage/summary of all the countries
 * 
 * @param {*} countries List of supported countries
 */
const createSeriesCoverage = countries => {
	const coverage = {
		population: 0,
		data: [],
		geoJson: null,
		history: null,
		stats: null,
		ts: null
	};

	for (let i = 0; i < countries.length; i++) {
		const country = countries[i]; // Weird bug here, as first entry gets accumalated with rest of them
		coverage.population += country.population;
		for (let j = 0; j < country.series.data.length; j++) {
			merge(coverage.data, country.series.data[j]);
		}

		delete country.series.data;
	}
	const seriesData = createSeriesData(coverage.data);
	coverage.stats = seriesData.stats;
	coverage.ts = seriesData.ts;
	coverage.history = GeoJson.createGeoJsonHistoryForCountries(countries)
	return coverage;
};

/**
 * Creates timeseries, latest and totals for confirmed, recovered and fatalities.
 * Assumes that dates are ordered - is this correct?
 * 
 * @param {*} series Either a country. province or city
 */
const createSeriesData = (series) => {
	// Timeseries
	const confirmedSeries = [];
	const recoveredSeries = [];
	const deathSeries = [];
	const confirmedDailySeries = [];
	const recoveredDailySeries = [];
	const deathDailySeries = [];

	// Latest Figures
	let latestConfirmed = 0;
	let latestRecovered = 0;
	let latestDeaths = 0;

	// Total Figures
	let totalConfirmed = 0;
	let totalRecovered = 0;
	let totalDeaths = 0;

	// Create cummalative timeseries -
	// If there is a missing data item in the series it can really screw things
	// up
	let prevConfirmed = 0;
	let prevRecovered = 0;
	let prevDeaths = 0;
	for (let i = 0; i < series.length; i++) {
		const entry = series[i];
		const currentConfirmed = prevConfirmed > entry.confirmed ? prevConfirmed : entry.confirmed;
		const currentRecovered = prevRecovered > entry.recovered ? prevRecovered : entry.recovered;
		const currentDeaths = prevDeaths > entry.deaths ? prevDeaths : entry.deaths
		confirmedSeries.push([entry.date, currentConfirmed]);
		recoveredSeries.push([entry.date, currentRecovered]);
		deathSeries.push([entry.date, currentDeaths]);
		prevConfirmed = currentConfirmed;
		prevRecovered = currentRecovered;
		prevDeaths = currentDeaths;
	}

	// Create totals
	if (confirmedSeries.length > 0) {
		totalConfirmed = confirmedSeries[confirmedSeries.length - 1][1];
	}
	if (recoveredSeries.length > 0) {
		totalRecovered = recoveredSeries[recoveredSeries.length - 1][1];
	}
	if (deathSeries.length > 0) {
		totalDeaths = deathSeries[deathSeries.length - 1][1];
	}

	// Create daily time series and latest figures
	for (let i = 1; i < confirmedSeries.length; i++) {
		const date = confirmedSeries[i][0];
		const diff =
			confirmedSeries[i][1] -
			confirmedSeries[i - 1][1];
		confirmedDailySeries.push([date, diff]);
	}
	if (confirmedDailySeries.length > 0) {
		latestConfirmed = confirmedDailySeries[
			confirmedDailySeries.length - 1
		][1];
	}

	for (let i = 1; i < recoveredSeries.length; i++) {
		const date = recoveredSeries[i][0];
		const diff =
			recoveredSeries[i][1] -
			recoveredSeries[i - 1][1];
		recoveredDailySeries.push([date, diff]);
	}
	if (recoveredDailySeries.length > 0) {
		latestRecovered = recoveredDailySeries[
			recoveredDailySeries.length - 1
		][1];
	}

	for (let i = 1; i < deathSeries.length; i++) {
		const date = deathSeries[i][0];
		const diff =
			deathSeries[i][1] - deathSeries[i - 1][1];
		deathDailySeries.push([date, diff]);
	}
	if (deathDailySeries.length > 0) {
		latestDeaths = deathDailySeries[
			deathDailySeries.length - 1
		][1];
	}

	return {
		ts: {
			confirmedSeries,
			recoveredSeries,
			deathSeries,
			confirmedDailySeries,
			recoveredDailySeries,
			deathDailySeries,
		},
		stats: {
			latestConfirmed,
			latestRecovered,
			latestDeaths,
			totalConfirmed,
			totalRecovered,
			totalDeaths,
		}
	}
}

/**
 * Merge 2 timeseries based on date, if entry does not exist
 * clone an existing one, keyed of date
 * 
 * @param {*} data 
 * @param {*} newData 
 */
const merge = (data, newData) => {
	const dataItem = data.find(item => item.date === newData.date);
	if (dataItem) {
		dataItem.confirmed += newData.confirmed;
		dataItem.deaths += newData.deaths;
		dataItem.recovered += newData.recovered;
	} else {
		data.push({ ...newData });
	}
};

/**
 * Ignore cities - US only
 * 
 * @param {*} entries 
 * @param {*} countryCode 
 */
const createdSeriesForCountry = (entries, countryCode) => {
	const series = {
		data: [],
		provinces: []
	};

	const stats = (entries, i) => {
		return {
			confirmed: entries[i].Confirmed,
			deaths: entries[i].Deaths,
			recovered: entries[i].Recovered,
			date: new Date(entries[i].Date).getTime()
		};
	};

	for (let i = 0; i < entries.length; i++) {
		if (entries[i].Province === "") {
			series.data.push(stats(entries, i));
		} else {
			let province = series.provinces.find(
				item => item.name === entries[i].Province
			);
			if (!province) {
				province = {
					uuid: Utils.uuid(),
					name: entries[i].Province,
					lat: entries[i].Lat,
					lng: entries[i].Lon,
					data: [],
					cities: []
				};
				series.provinces.push(province);
			}
			province.data.push(stats(entries, i));
		}
	}

	// Ensure that all cities add to province as this missed in previous step
	let hasCities = false;
	if (series.provinces.length > 0) {
		for (let j = 0; j < series.provinces.length; j++) {
			if (series.provinces[j].cities.length > 0) {
				hasCities = true;
			}
		}
	}

	if (
		hasCities ||
		countryCode === "AU" ||
		countryCode === "CA" ||
		countryCode === "CN"
	) {
		series.data = [];
		for (let j = 0; j < series.provinces.length; j++) {
			for (let x = 0; x < series.provinces[j].data.length; x++) {
				merge(series.data, series.provinces[j].data[x]);
			}
		}
	}

	Object.assign(series, createSeriesData(series.data))
	for (let province of series.provinces) {
		Object.assign(province, createSeriesData(province.data))
	}

	return series;
}

module.exports = {
	parse,
	createSeriesCoverage
}
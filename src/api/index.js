const axios = require('axios')

const load = url => {
	return axios.get(url, {
	}).then(response => response.data);
}

module.exports = {
	load
}
const express = require('express')
const axios = require('axios')
const config = require('./config')
const app = express()

const token = config.token
const weather_api_key = config.weather_api_key
const weather_api_url = config.weather_api_url + '&apikey=' + config.weather_api_key

var dataCache = {}
var timeToLive = 60 * 60 * 1000  // 60 minutes
var cities = []

function isCacheExpired(city) {
  return dataCache[city] && ( (dataCache[city].fetchDate.getTime() + timeToLive) < new Date().getTime() )
}

app.use((request, response, next) => {
		response.append('Access-Control-Allow-Origin', '*')
		response.append('Access-Control-Allow-Headers', 'origin, content-type, accept, token')
	if (request.method == 'OPTIONS') {
		response.send('ok')
	} else {
		next()
	}
})

app.use((request, response, next) => {
    if(!request.headers['token'] || request.headers['token'] != token){
    	response.status(401).send('Bad Api Key')
    } else {
    	next()
  	}
})

app.get('/api/weather/daily/:city', (request, response) => {
	const count = request.query.count || 3
 	const city = request.params.city
 	const winds = [
	 	{speed: 1.5, name:	"Calm air"},
	 	{speed: 5.4, name:	"Gentle Breeze"},
	 	{speed: 7.9, name:	"Moderate"},
	 	{speed: 10.7, name:	"Strong"}
	]
	const wind_directions = [
	 	{dir: 22, name:	"North"},
		{dir: 68, name:	"NorthEast"},
		{dir: 112, name: "East"},
		{dir: 158, name:	"SouthEast"},
		{dir: 202, name:	"South"},
		{dir: 248, name:	"SouthWest"},
		{dir: 292, name:	"West"},
		{dir: 338, name:	"NorthWest"},
		{dir: 360, name:	"North"},
	]


 	if (Object.keys(dataCache).length === 0 || !dataCache[city] || isCacheExpired(city)) {

		axios.get(weather_api_url + '&q=' + city + '&cnt=' + count)
	  .then(res => {
	  	let data = {
				  "location": {
				    "name": res.data.city.name,
				    "country": res.data.country
				  },
				  "forecast": res.data.list.map((day) => {
				  	return {
				  		"date": new Date(day.dt * 1000).toISOString().slice(0, 10),
				      "summary": day.weather[0].description,
				      "temp": {"day": day.temp.day, "night": day.temp.night},
				      "wind": { 
				      	"direction": wind_directions.find(w => day.deg < w.dir).name, 
				      	"speed": winds.find(w => day.speed < w.speed).name }
				  	}
				  }),
				  "fetchDate": new Date()
	    }
	  	dataCache[city] = data

	    response.json(data)
	  })
	  .catch(error => {
	    response.status(400).send(error.message)
	  })

	} else {
		response.json(dataCache[city])
	}
    
})

app.listen(3000)



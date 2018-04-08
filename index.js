// DB
const argv = require('yargs').argv;
const mongoose = require('mongoose');
const dbUrl = 'mongodb://localhost/weatherApp_v2';
mongoose.connect(dbUrl);
const db = mongoose.connection;
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const port = process.env.PORT || 3000;
const getJSON = require('get-json')
const interval = argv.interval || 5000;
const debug = argv.debug || false;


// Models
const Source = require("./models/source");
const Location = require("./models/location");

db.once('open', function() {

	// Parser Setting
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'));

	// Ping
	app.get('/ping', function(req, res){
		res.sendStatus(200);
	});

	// Add new source
	app.post('/source', async function(req, res){
		if(req.body.url){
			try{
				var source = new Source({url: req.body.url});
				var record = await source.save();
				res.json({error: false, source: record})
			}catch(err){
				res.json({error: true, message: err.message})
			}
		}else{
			res.json({error: true, message: 'missing url param in body'})
		}
	});

	app.get('/locations', async function(req, res){
		var filter = {};

		// If user is filtering locations based on lat/lng/radius
		if(req.query.filter){
			// Validate request
			if(!isValidLatitude(req.query.filter.latitude)){
				return res.json({error: true, message: 'Invalid latitude'})
			}

			if(!isValidlongitude(req.query.filter.longitude)){
				return res.json({error: true, message: 'Invalid longitude'})
			}

			if(!isValidRadius(req.query.filter.radius)){
				return res.json({error: true, message: 'Invalid radius'})
			}

			// Calculate offset
			var latitudeOffset = req.query.filter.radius * 0.000001619593482036009;
			var longitudeOffset = req.query.filter.radius * 0.000003239186964072018;

			filter = { 
				latitude: { $gte: req.query.filter.latitude - latitudeOffset, $lte: praseFloat(req.query.filter.latitude) + latitudeOffset},
				longitude: { $gte: req.query.filter.longitude - longitudeOffset, $lte: praseFloat(req.query.filter.longitude) + longitudeOffset}
			}
		}

		try{
			var locations = await Location.find(filter, {location: 1, latitude: 1, longitude: 1});
			res.json({error: false, locations: locations})
		}catch(err){
			res.json({error: true, message: err.message})
		}
	});

	app.get('/location/measurements', async function(req, res){
		if(!req.query.location){
			return res.json({error: true, message: 'invalid location param'});
		}
			
		try{
			var location = await Location.findOne({location: req.query.location}, {measurements: 1});
			if(location){
				// Filter locations
				if(req.query.from && req.query.to){
					req.query.from = parseInt(req.query.from);
					req.query.to = parseInt(req.query.to);

					location.measurements = location.measurements.filter(function(measurement){
						return measurement.timestamp >= req.query.from && measurement.timestamp <= req.query.to;
					})
				}

				res.json({error: false, measurements: location.measurements})
			}else{
				res.json({error: true, message: 'Error getting location.'})
			}	
		}catch(err){
			res.json({error: true, message: err.message})
		}
	});

	app.listen(port, function(){
		console.log('Web server listening on port ' + port);
	});

	// Fetch locations
	fetchLocationsLoop();

	async function fetchLocationsLoop(){
		try{
			var sources = await Source.find({});
			for(let source of sources){
				var locations = await getJsonPromise(source.url);
				for(key in locations){
					var location = await Location.findOne({location: locations[key].location})
					if(!location){
						location = await new Location({
							location: locations[key].location,
							latitude: locations[key].latitude,
							longitude: locations[key].longitude,
							measurements: []
						});

						// Debug
						if(debug){
							console.log('Created new location: ' + locations[key].location);
						}
					}

					location.measurements.push({ temperature: locations[key].temperature, timestamp: +new Date() });
					await location.save();

					// Debug
					if(debug){
						console.log('Added temperature: ' + locations[key].temperature + ' to location: ' + locations[key].location);
					}
				}
			}
		}catch(err){
			if(debug){
				console.log(err);
			}
		}

		setTimeout(function(){
			fetchLocationsLoop(debug)
		}, interval);
	}


	// Helper functions
	function isValidLatitude(lat){
		return lat && lat >= -90 && lat <= 90; 
	}

	function isValidlongitude(lng){
		return lng && lng >= -180 && lng <= 180; 
	}

	function isValidRadius(radius){
		return radius && radius > 0;
	}

	// Wrapper for the getJson 
	function getJsonPromise(url){
		return new Promise(function(resolve, reject){
			getJSON(url, function(err, data){
				if(err){
					return reject(err);
				}

				resolve(data);
			})
		})
	}
});



db.on('error', function(err){
	console.log(err);
});


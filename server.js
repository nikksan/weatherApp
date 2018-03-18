const MongoClient = require('mongodb').MongoClient;
// Database Name
const dbName = 'weatherApp';
const url = 'mongodb://localhost:27017';
const port = 3000;
const bodyParser = require('body-parser')

// Connect using MongoClient
MongoClient.connect(url, function(err, client) {
	if(err){
		return console.log(err);
	}

	var express = require('express');
	var app = express();
	
	// Parser Setting
	app.use(bodyParser.json());
	// in latest body-parser use like below.
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static('public'));

	const locationsCollection = client.db(dbName).collection('locations');

	// Ping
	app.get('/ping', function(req, res){
		res.send(200);
	});

	//Get all locations
	app.get('/locations', function(req, res){
	  	if(isObjectEmpty(req.query)){
		  	locationsCollection.find({}).toArray(function(err, results){
		  		if(err){
		  			return res.json({error: true })
		  		}else if(results === null){
		  			return res.json({error: true })
		  		}

		  		var locations = [];
		  		for(var key in results){
		  			locations.push({
		  				location: results[key].location,
			  			latitude: results[key].latitude,
			  			longitude: results[key].longitude
		  			});
		  		}

		  		res.json({error: false, locations: locations});
		  	});	
	  	}else if(isValidLatitude(req.query.latitude) && isValidLongtitude(req.query.longitude) && isValidRadius(req.query.radius)){
	  		var latitudeOffset = req.query.radius * 0.000001619593482036009;
	  		var longitudeOffset = req.query.radius * 0.000003239186964072018;

	  		// Convert them to numbers
	  		req.query.latitude = +req.query.latitude;
	  		req.query.longitude = +req.query.longitude;

	  		locationsCollection.find({}).toArray(function(err, results){
	  			if(err){
	  				return res.json({error: true})
		  		}else if(results === null){
		  			return res.json({error: true})
		  		}

		  		var locations = [];
		  		for(var key in results){
		  			if( 
		  				results[key].latitude > req.query.latitude - latitudeOffset &&
		  				results[key].latitude < req.query.latitude + latitudeOffset && 
		  				results[key].longitude > req.query.longitude - longitudeOffset && 
		  				results[key].longitude < req.query.longitude + longitudeOffset
		  			)
			  			locations.push({
			  				location: results[key].location,
				  			latitude: results[key].latitude,
				  			longitude: results[key].longitude
			  			});
		  		}

		  		res.json({error: false, locations: locations});
	  		});
	  	}else{
	  		res.json({error: true });
	  	}

	});

	//getet info about a single location
	/*
	app.get('/location', function(req, res){
	  if(!req.query.location){
	  	res.json({error: true, message: 'You need to supply location parameter.'});
	  }else{
	  	locationsCollection.findOne({location: req.query.location}, function(err, result){
	  		if(err){
	  			return res.json({error: true})
	  		}else if(result === null){
	  			return res.json({error: true, message: 'No such location'})
	  		}

	  		var location = {
	  			location: result.location,
	  			latitude: result.latitude,
	  			longitude: result.longitude	
	  		}
	  		res.json({error: false, location: location});
	  	});
	  }
	});
	*/

	//Get measurements for single location
	app.get('/location/measurements', function(req, res){
		if(!req.query.location){
	  		res.json({error: true, message: 'Invalid request'});
		  }else{
		  	locationsCollection.findOne({location: req.query.location}, function(err, result){
		  		if(err){
		  			return res.json({error: true})
		  		}else if(result === null){
		  			return res.json({error: true, message: 'No such location'})
		  		}

		  		if(req.query.from && req.query.to){
		  			//Swap if nessesary
		  			if(req.query.from > req.query.to){
		  				var tmp = req.query.from;
		  				req.query.from = req.query.to;
		  				req.query.to = tmp;
		  			}
		  			

		  			var measurements = [];
		  			for(var key in result.measurements){
		  				if(	result.measurements[key].timestamp >= req.query.from &&
		  					result.measurements[key].timestamp <= req.query.to)
		  				{
		  					measurements.push(result.measurements[key]);
		  				}
		  			}
		  			res.json({error: false, measurements: measurements});
		  		}else{
		  			res.json({error: false, measurements: result.measurements});
		  		}
		  		
		  	});
		  }
	});

	// Create new location
	app.post('/location', function(req, res){
		if(!req.body.location || !isValidLatitude(req.body.latitude) || !isValidLongtitude(req.body.longitude)){
			res.json({error: true, message: 'Invalid POST data'});
		}else{
			locationsCollection.findOne({location: req.body.location}, function(err, result){
				if(err){
		  			return res.json({error: true})
		  		}

		  		if(result){
		  			return res.json({error: true, 'message': 'Location already exists'})
		  		}

		  		let location = {
		  			location: req.body.location,
		  			latitude: req.body.latitude,
		  			longitude: req.body.longitude,
		  			measurements: []
		  		};

		  		locationsCollection.insert(location, function(err){
		  			if(err){
			  			return res.json({error: true})
			  		}else{
			  			return res.json({error: false})
			  		}
		  		});
			});
		}
	});

	// Add data to an existing location
	app.post('/location/measurements', function(req, res){
		if(!req.body.location || !req.body.temperature){
			res.json({error: true, message: 'Invalid POST data'});
		}else{
			locationsCollection.findOne({location: req.body.location}, function(err, result){
				if(err || result == null){
					return res.json({error: true})
				}

				// Proceed to add the measurement
				var measurements = result.measurements;
				measurements.push({
					timestamp: req.body.timestamp || +new Date,
					temperature: req.body.temperature
				});

				locationsCollection.update({location: req.body.location}, {$set: {measurements: measurements}}, function(err){
					if(err){
						return res.json({error: true})
					}

					return res.json({error: false});
				});
			});
		}
	})


	app.listen(port, function(){
		console.log('Web server listening on port ' + port);
	});
});

// Helper functions
function isObjectEmpty(obj){
	return Object.keys(obj).length === 0 && obj.constructor === Object
}

function isValidLatitude(lat){
	return lat && lat >= -90 && lat <= 90; 
}

function isValidLongtitude(lng){
	return lng && lng >= -180 && lng <= 180; 
}

function isValidRadius(radius){
	return radius && radius > 0;
}

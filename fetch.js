const http = require('http');
const timeout = 5000; //5 seconds
const MongoClient = require('mongodb').MongoClient;
// Database Name
const dbName = 'weatherApp';
const url = 'mongodb://localhost:27017';

// Connect using MongoClient
MongoClient.connect(url, function(err, client) {
	if(err){
		console.log(err);
		return;
	}

	const locationsCollection = client.db(dbName).collection('locations');

	(function fetchTemperatureLoop(){
		console.log('Started http request..');
		http.get('http://dsnet.tu-plovdiv.bg/t_mix_json.php', function(resp){
			var data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});

			resp.on('end', () => {
				if(data.isJson()){
					var locations = JSON.parse(data).toArray();
					(function locationsLoop(){
						var location = locations.pop();
						locationsCollection.findOne({location: location.location}, function(err, result){
							if(err){
								console.log(err);
								return;
							}

							if(result){
								//Exists
								var measurements = result.measurements;
								measurements.push({timestamp: +new Date, temperature: location.temperature})
								locationsCollection.update({location: location.location}, {$set: {measurements: measurements}}, function(err){
									if(err){
										console.log(err);
										return;
									}

									console.log('Added new temperature for location: ' + location.location);
									continueLocationsLoop();
								});
							}else{
								//Doesnt exist
								location.measurements = [];
								location.measurements.push({timestamp: +new Date, temperature: location.temperature});
								locationsCollection.insert(location, function(err){
									if(err){
										console.log(err);
										return;
									}

									console.log('Created new location: ' + location.location);
									continueLocationsLoop();
								});
							}
							
						});

						function continueLocationsLoop(){
							if(locations.length){
								locationsLoop()
							}else{
								setTimeout(fetchTemperatureLoop, timeout);
							}
						}		
					})();
				}
			});
		}).on("error", (err) => {
			console.log("Error: " + err.message);
			console.log("Continue anyways..");
			setTimeout(fetchTemperatureLoop, timeout);
		});
	})();
});

String.prototype.isJson = function(){
	try{
		JSON.parse(this);
	}catch(e){
		return false;
	}
	return true;
}

Object.prototype.toArray = function(){
	var arr = [];
	for(var key in this){
		if(this.hasOwnProperty(key)){
			arr.push(this[key]);
		}	
	}
	return arr;
}
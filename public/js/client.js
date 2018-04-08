var map;
var mapEl = document.getElementById('map');
var pins = {};

$(document).ready(function(){
	initMap();
});

function initMap(){
	map = new google.maps.Map(mapEl, {
		center: { lat: 42.1165671, lng: 24.73678769999999 },
		zoom: 8
	});	

	/* Testing */
	API.getLocations({}, function(locations){
		console.log(locations);
	});

	API.getMeasurements({location: 'AONSU', from: 1523132764659, to: 1523132769786 }, function(measurements){
		console.log(measurements);
	});

	API.addSource({url: 'dadas'}, function(source){
		console.log(source);
	}, function(err){
		console.log(err);
	})
}


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

	// Add locations on the map
	API.getLocations({}, function(locations){
		for(let location of locations){
			pins[location.location] = {};

			pins[location.location].marker = new google.maps.Marker({
				position: {lat: location.latitude, lng: location.longitude},
				map: map,
				title: location.location
			});

			let content;
			if(location.last_measurement){
				let date = new Date(location.last_measurement.timestamp)
				content = date.toString() + ':' + '<b>' + location.last_measurement.temperature + ' C' + '</b>';
			}else{
				content = 'No temperature was ever recorded for this location.';
			}

			pins[location.location].infowindow = new google.maps.InfoWindow({
				content: content
			});

        	// Add event listener to the marker
        	pins[location.location].marker.addListener('click', function() {
        		pins[location.location].infowindow.open(map, this);
        	});

        	typeof callback == 'function' ? callback() : void(0);
        }
    });
}





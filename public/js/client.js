// Google maps stuff
var map,
markers = [],
mapEl,
mapConfig = { center: { lat: 42.1381833, lng: 24.7756837 }, zoom: 13 },
chartEl;

// jQuery references
var $filterDateStart,
$filterDateEnd,
$buttonFilter,
$inputSource,
$buttonAddSource,
$buttonOpenSourceModal,
$sourceModal,
$buttonRefreshLocations,
$buttonSetCurrentLocation,
$buttonFilterLocationsByRadius,
$inputRadius,
$inputLat,
$inputLng;



$(document).ready( init );

function init(){
    cacheDOM();
    bindEvents();
    initMap();
    initChart();
    initDatepickers();
    renderLocations();   
}

function cacheDOM() {
    mapEl = document.getElementById('map');
    chartEl = document.getElementById('chart');

    $filterDateStart = $('#filter-date-start');
    $filterDateEnd = $('#filter-date-end');
    $buttonFilter = $('#button-filter-measurements');
    $inputSource = $('#source-input')
    $buttonAddSource = $('#button-add-source');
    $buttonOpenSourceModal = $('#button-open-source-modal');
    $sourceModal = $('#source-modal')
    $buttonRefreshLocations = $('#button-refresh-locations')
    
    $buttonSetCurrentLocation = $('#button-set-current-location');
    $buttonFilterLocationsByRadius = $('#button-filter-radius');
    $inputRadius = $('#input-radius');
    $inputLat = $('#input-latitude');
    $inputLng = $('#input-longitude');
}

function bindEvents() {
    $buttonFilter.on('click', handleButtonFilterClick);
    $buttonAddSource.on('click', handleButtonAddSourceClick)
    $buttonOpenSourceModal.on('click', handleButtonTriggerSourceModal)
    $buttonRefreshLocations.on('click', handleButtonRefreshLocationsClick)

    $buttonSetCurrentLocation.on('click', onButtonSetCurrentLocationClick );
    $buttonFilterLocationsByRadius.on('click', onButtonFilterLocationsByRadiusClick )
}

function onButtonSetCurrentLocationClick(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position){
            $inputLat.val(position.coords.latitude);
            $inputLng.val(position.coords.longitude)
        }, function(err){
            switch(err.code) {
                case err.PERMISSION_DENIED:
                    alert("User denied the request for Geolocation.");
                break;
                case err.POSITION_UNAVAILABLE:
                    alert("Location information is unavailable.");
                break;
                case err.TIMEOUT:
                    alert("The request to get user location timed out.");
                break;
                case err.UNKNOWN_ERROR:
                    alert("An unknown error occurred.");
                break;
            }
        }, { timeout: 1500, enableHighAccuracy: true });
    }else{
        alert("Browser doesnt support geolocation");
    }
}

function onButtonFilterLocationsByRadiusClick(){
    if(!isValidRadius($inputRadius.val())){
        alert('Please enter a valid radius');
        return;
    }


    if(!isValidLatitude($inputLat.val())){
        alert('Please enter a valid latitude');
        return;
    }

    if(!isValidlongitude($inputLng.val())){
        alert('Please enter a valid longitude');
        return;
    }


    var data = {
        filter: {
            radius: $inputRadius.val(),
            latitude: $inputLat.val(),
            longitude: $inputLng.val()
        }
    }

    renderLocations(data);
}

// Handlers
function handleButtonTriggerSourceModal() {
    $sourceModal.modal();
}

function handleButtonAddSourceClick() {
    API.addSource({
        url: $inputSource.val()
    }, function() {
        alert('You succefully added a new source');
        $inputSource.val('');
    }, function(errText) {
        alert(errText)
    })
}


function handleButtonFilterClick() {
    if ($filterDateStart.val() && $filterDateEnd.val()) {
        // Convert to timestamps
        var dateStartTS = +new Date($filterDateStart.val());
        var dateEndTS = +new Date($filterDateEnd.val());


        API.getMeasurements({from: dateStartTS, to: dateEndTS }, function(locations) {
            drawMeasurementsChart(locations);
        }, function(err) {
            console.log(err);
        });
    } else {
        alert('You have to enter both start and end date.');
    }
}

function handleButtonRefreshLocationsClick(){
    renderLocations();
}



function initMap() {
    map = new google.maps.Map(mapEl, mapConfig);
}

function renderLocations(filter){
    filter = filter || {};
    
    // Clear all markers from the map
    removeMarkers();

    // Get Locations
    API.getLocations(filter, function(locations) {
        for (let location of locations) {
            let marker = new google.maps.Marker({
                position: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                map: map,
                title: location.location
            });

            let content = location.location;

            // Append last measurement
            if (location.measurements.length) {
                content += ' - ' + location.measurements[0].temperature + '°C' + ' taken '+ humanTimeDiff( location.measurements[0].timestamp );
            }

            let infowindow = new google.maps.InfoWindow({
                content: content
            });

            marker.addListener('click', function() {
                infowindow.open(map, marker);
            });

            // Keep a reference for each active marker
            markers.push(marker);
        }
    })
}

function initChart() {
    google.charts.load('current', {
        'packages': ['corechart', 'line']
    });
}

function drawMeasurementsChart(locations) {
    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');

    var rows = [];
    for(let i = 0; i < locations.length; i++){
        data.addColumn('number', locations[i].location);
        for(let j = 0; j < locations[i].measurements.length; j++){
            rows[j] = rows[j] || [ new Date(locations[i].measurements[j].timestamp) ];
            rows[j][i+1] = locations[i].measurements[j].temperature;
        }
    }

    data.addRows(rows); 

    var chart = new google.visualization.LineChart(chartEl);
    chart.draw(data);
}

function initDatepickers() {
    $filterDateStart.datepicker();
    $filterDateEnd.datepicker();
}


function humanTimeDiff(timestamp, from){
    from = from || +new Date;

    let diff = from - timestamp;
    switch (true) {
        case (diff < 1000 * 60):
        return Math.floor(diff / 1000) + ' sec(s) ago';
        case (diff < 60000 * 60):
        return Math.floor(diff / 60000) + ' min(s) ago';
        case (diff < 3600000 * 24):
        return Math.floor(diff / 3600000) + ' hour(s) ago';
        case (diff < 86400000 * 31):
        return Math.floor(diff / 86400000) + ' day(s) ago';
        case (diff < 2678400000 * 12):
        return Math.floor(diff / 2678400000) + ' month(s) ago';
        default:
        return Math.floor(diff / 32140800000) + ' year(s) ago';
    }
}


function removeMarkers(){
    for(let marker of markers){
        marker.setMap(null);
    }
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

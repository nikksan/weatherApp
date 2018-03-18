// API
var API = {
	getLocations: function(data, success, error){
		$.ajax({
			url: '/locations',
			data: data,
			dataType: 'json',
			success: function(data){
				if(!data.error){
					success(data.locations);
				}else{
					error(data.message);
				}
			},
			error: function(){
				error(err.responseText);
			}
		})
	},
	getMeasurements: function(data, success, error){
		$.ajax({
			url: '/location/measurements',
			data: data,
			dataType: 'json',
			success: function(data){
				if(!data.error){
					success(data.measurements);
				}else{
					error(data.message);
				}
			},
			error: function(){
				error(err.responseText);
			}
		})
	},
	addLocation: function(data, success, error){
		$.ajax({
			url: '/location',
			type: 'POST',
			data: data,
			dataType: 'json',
			success: function(data){
				if(!data.error){
					success();
				}else{
					error(data.message);
				}
			},
			error: function(){
				error(err.responseText);
			}
		})
	},
	addMeasurement: function(data, success, error){
		$.ajax({
			url: '/location/measurements',
			type: 'POST',
			data: data,
			dataType: 'json',
			success: function(data){
				if(!data.error){
					success();
				}else{
					error(data.message);
				}
			},
			error: function(){
				error(err.responseText);
			}
		})
	}
}
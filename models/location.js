const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  location: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  latitude: { 
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  measurements: [{
    timestamp: {
      type: Number,
      required: true
    },
    temperature:{
      type: Number,
      required: true
    }

  }] 
});



const Location = mongoose.model('Location', LocationSchema);

module.exports = Location;


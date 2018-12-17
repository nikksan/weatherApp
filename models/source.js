const mongoose = require("mongoose");
const getJSON = require('get-json')

const SourceSchema = new mongoose.Schema({
  url: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  created_at: {
   type: Date 
 }
});

SourceSchema.pre('save', async function(next){
  if(!this.created_at){
    this.created_at = new Date();
  }

  if(!isValidURL(this.url)){
    next(new Error('You re trying to insert invalid url.'))
  }else{
   next();
 }
});

module.exports = mongoose.model('Source', SourceSchema);

function isValidURL(str) {
 var urlregex = /^(https?):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
 
 return urlregex.test(str);
}

/*
function checkUrlContents(url){
 return new Promise(function(resolve, reject){
  getJSON(this.url, function(error, response){
    if(error){
      reject('Error fething data from: ' + url);
    }else{
      if(response.constructor.name !== 'Object' || Object.keys(response).length === 0){
        reject('Malformed data.');
      }

      for(key in response){
        if(!response[key].latitude || !response[key].longitude || !response.location || !response.temperature){
          reject('Malformed data.');
        }
      }

      resolve();
    }
  });
});
}
*/
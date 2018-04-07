const mongoose = require("mongoose");

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

SourceSchema.pre('save', function(next){
  if(!this.created_at){
    this.created_at = new Date();
  }

  if(!isValidURL(this.url)){
    next(new Error('You re trying to insert invalid url.'))
  }else{
    next();
  }
});

const Source = mongoose.model('Source', SourceSchema);

module.exports = Source;

function isValidURL(str) {
   var urlregex = /^(https?):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
   return urlregex.test(str);
}
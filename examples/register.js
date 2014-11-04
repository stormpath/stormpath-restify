var restify = require('restify');
var _ = require('underscore');

var client = restify.createJsonClient({
  url: 'http://127.0.01:8080'
});

var prompt = require('prompt');

var promptProperties = {
  givenName: {
    message: '',
    description: "First Name: ".green,
    required: true
  },
  surname: {
    message: '',
    description: "Last Name: ".green,
    required: true
  },
  email: {
    message: '',
    description: "Email: ".green,
    pattern:  /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    required: true
  },
  password: {
    message: '',
    description: "Password (hidden while typing): ".green,
    required: true,
    hidden: true
  },
};

function getInfo(props,cb){
  prompt.start();
  prompt.message = '';
  prompt.delimiter = "";
  prompt.get({ properties: props}, cb);
}

var lastProps = {};

function postInfo(err,properties){
  if(err){
    console.error(err.message);
    process.exit();
  }
  _.extend(lastProps,properties);
  client.post('/accounts',lastProps,function(err,req,res,body){
    if(err && err.statusCode===409){
      console.log('Email already registered, please try another'.red);
      getInfo({email:promptProperties.email},postInfo);
    }else if(err && err.statusCode===400 && err.message.match(/password/i)){
      console.log(body.message.red);
      console.log('Please try another password'.red);
      getInfo({password:promptProperties.password},postInfo);
    }else if(err){
      console.error(err.message,body,err.statusCode);
      process.exit(1);
    }else if(res.statusCode===201){
      console.log(body.message);
      process.exit();
    }else{
      console.log("Unknown state".red);
      process.exit();
    }
  });
}

console.log('Welcome to the Things API - please register for an account'.blue.underline);

getInfo(promptProperties,postInfo);
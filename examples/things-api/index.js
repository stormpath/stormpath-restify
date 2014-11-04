/*
    This is an example of the code that you would put
    in your client library

    You will want to publish this as a module on NPM
    so that your customers can use it in their own
    applications

    For example, you could publish this module as `things-api`

*/
var oauthClient = require('stormpath-restify/oauth-client');

module.exports = {
  createClient: function(opts){
    opts.url = opts.url || 'http://localhost:8080';

    // This creates an instance of the oauth client,
    // which will handle all HTTP communication with your API

    var myOauthClient = oauthClient.createClient(opts);

    // Here we directly bind our convenience methods
    // to the basic GET/POST handlers in the myOauthClient.

    myOauthClient.getCurrentUser = myOauthClient.get.bind(myOauthClient,'/me');
    myOauthClient.getThings = myOauthClient.get.bind(myOauthClient,'/things');

    myOauthClient.addThing = function addThing(thing,cb){
      if(typeof thing!=='object'){
        cb(new Error('Things must be be an object'));
      }else{
        myOauthClient.post('/things',thing,cb);
      }
    };

    // Here we want to do some custom logic before and after
    // we talk to the api

    myOauthClient.deleteThing = function deleteThing(thing,cb){
      if(typeof thing!=='object'){
        process.nextTick(function(){
          cb(new Error('Things must be be an object'));
        });
      }
      if(typeof thing.href!=='string'){
        process.nextTick(function(){
          cb(new Error('Missing property: href'));
        });
      }
      myOauthClient.del(thing.href,function(err){
        if(err){
          cb(err); // If the API errors, just pass that along
        }else{
          // Here you could do something custom before
          // calling back to the original callback
          cb();
        }
      });
    };
    return myOauthClient;
  }
};
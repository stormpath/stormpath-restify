/*
    This is an example of the code that you would put
    in your own npm module.

    You will want to publish this as a module on NPM
    so that your customers can use it in their own
    applications

    For example, you could publish this module as `things-api`

*/
var oauthClient = require('stormpath-restify/oauth-client');

module.exports = {
  creeateClient: function(opts){
    opts.url = opts.url || 'http://localhost:8080';

    // This creates an instance of the oauth client,
    // which will handle all HTTP communication with your API

    var client = oauthClient.createClient(opts);

    // Here we directly bind our convenience methods
    // to the basic GET/POST handlers in the client.

    client.getThings = client.get.bind(client,'/things');
    client.addThing = client.post.bind(client,'/things');

    // Here we want to do some custom logic before
    // we talk to the api

    client.addThingWithValidation = function addThingWithValidation(thing,cb){
      if(typeof thing!=='object'){
        cb(new Error('Things must be be an object'));
      }else{
        client.addThing(thing,cb);
      }
    };

    // Here we want to do some custom logic before and after
    // we talk to the api

    client.deleteThing = function deleteThing(thing,cb){
      if(typeof thing!=='object'){
        cb(new Error('Things must be be an object'));
      }
      if(typeof thing.href!=='string'){
        cb(new Error('Missing property: href'));
      }
      client.del(thing.href,function(err){
        if(err){
          cb(err); // If the API errors, just pass that along
        }else{
          // Otherwise, print something then call back
          console.log('Deleted thing',thing);
          cb();
        }
      });
    };
    return client;
  }
};
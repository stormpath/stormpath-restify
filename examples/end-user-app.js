/*
  This is what a consumer of your API would look like,
  this is how they would use your client (my-api-client.js)
  to consume your API

  Here were are requiring the example API client, but when you
  publish your API you will want to create your own module for it.
  For example, if you published your API client as `things-api`:

  var thingsApi = require('things-api');
*/
var util = require('util');
var thingsApi = require('./my-api-client.js');
// var

var client = thingsApi.creeateClient({
  key:'4GNW13QPNZ29ZKBJBM6TN4FC6',
  secret:'m1NFEaFFzfX/Ja5k4vhH1C9FLkFUjIqhA3mBvvI5a9E'
});

client.addThing(
  {
    myNameIs: 'on no..'
  },
  function(err,thing) {
    if(err){
      console.error(err);
    }else{
      console.log(thing);
    }
    client.getThings(function(err,things) {
      if(err){
        console.error(err);
      }else{
        console.log('Things is now..');
        console.log(util.format('%s',things));

        client.deleteThing(thing,function(err){
          if(err){
            console.error(err);
          }else{
            client.getThings(function(err,things) {
              if(err){
                console.error(err);
              }else{
                console.log('Things is now..');
                console.log(things);
              }
            });
          }
        });
      }
    });
});




// setInterval(getThings,2000);
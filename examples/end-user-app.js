/*
  This is what a consumer of your API would look like,
  this is how they would use your client (my-api-client.js)
  to consume your API

  Here were are requiring the example API client, but when you
  publish your API you will want to create your own module for it.
  For example, if you published your API client as `things-api`:

  var thingsApi = require('things-api');
*/

var prettyjson = require('prettyjson');
var thingsApi = require('./my-api-client.js');
// var

var client = thingsApi.creeateClient({
  key:'4GNW13QPNZ29ZKBJBM6TN4FC6',
  secret:'m1NFEaFFzfX/Ja5k4vhH1C9FLkFUjIqhA3mBvvI5a9E'
});

client.getCurrentUser(function(err,user) {
  if(err){
      console.error(err);
  }else{
    console.log('Who am I?');
    console.log(user.fullName + ' (' + user.email + ')');
    client.addThing(
      {
        myNameIs: 'what?'
      },
      function(err,thing) {
        if(err){
          console.error(err);
        }else{
          client.getThings(function(err,things) {
            if(err){
              console.error(err);
            }else{
              console.log('Things collection has these items:');
              console.log(prettyjson.render(things));

              client.deleteThing(thing,function(err){
                if(err){
                  console.error(err);
                }else{
                  client.getThings(function(err,things) {
                    if(err){
                      console.error(err);
                    }else{
                      console.log('Things now has these items:');
                      console.log(prettyjson.render(things));
                    }
                  });
                }
              });
            }
          });
        }
    });
  }
});




// setInterval(getThings,2000);
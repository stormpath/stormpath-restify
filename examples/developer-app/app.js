/*
  This shows how a developer can require your client
  library and use it to work with your API
*/

var prettyjson = require('prettyjson');
var thingsApi = require('things-api');
// var

var client = thingsApi.creeateClient({
  key: 'DEVELOPER API KEY',
  secret: 'DEVELOPER API SECRET'
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

/*
    This is an example of the code that you would put
    in your own npm module.
*/
var oauthClient = require('stormpath-restify/oauth-client');

module.exports = {
  Client: function(opts){
    opts.url = opts.url || 'http://localhost:8080';
    var client = oauthClient.createClient(opts);
    client.getThings = client.get.bind(client,'/things');
    client.addThing = client.post.bind(client,'/things');
    return client;
  }
};
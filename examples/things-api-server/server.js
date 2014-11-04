/*
  Example Restify server that uses Stormpath for authentication,
  via Oauth2 client-credentials workflow and JWT tokens.

  It is a simple Things API which allows anonymous users
  to read resources.  Authenticated users can create
  resources and trusted users can delete resources.
*/
var restify = require('restify');

var stormpathConfig = {
  apiKeyId: 'YOUR_STORMPATH_API_KEY',
  apiKeySecret: 'YOUR_STORMPATH_API_SECRET',
  appHref: 'YOUR_STORMPATH_APP_HREF'
};

var stormpathFilters =
  require('stormpath-restify').createFilterSet(stormpathConfig);

var oauthFilter = stormpathFilters.createOauthFilter();
var trustedFilter = stormpathFilters.createGroupFilter({
  inGroup: 'trusted'
});
var newAccountFilter = stormpathFilters.newAccountFilter();
var accountVerificationFilter = stormpathFilters.accountVerificationFilter();

var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || '8080';

var thingDatabse = require('./things-db');

var db = thingDatabse({
  baseHref: 'http://' + host + ( port ? (':'+ port): '' ) + '/things/'
});

var server = restify.createServer({
  name: 'Things API Server'
});

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.use(function logger(req,res,next) {
  console.log(new Date(),req.method,req.url);
  next();
});

server.post('/oauth/token',oauthFilter);

server.post('/accounts',newAccountFilter);

server.get('/verifyAccount',accountVerificationFilter);

server.get('/me',[oauthFilter,function(req,res){
  res.json(req.account);
}]);

server.get('/things',function(req,res){
  res.json(db.all());
});

server.get('/things/:id',function(req,res,next){
  var id = req.params.id;
  var thing = db.getThingById(id);
  if(!thing){
    next(new restify.errors.ResourceNotFoundError());
  }else{
    res.json(thing);
  }
});

server.post('/things',[oauthFilter,function(req,res){
  res.json(db.createThing(req.body));
}]);

server.del('/things/:id',[oauthFilter,trustedFilter,function(req,res,next){
  var id = req.params.id;
  var thing = db.getThingById(id);
  if(!thing){
    next(new restify.errors.ResourceNotFoundError());
  }else{
    db.deleteThingById(id);
    res.send(204);
  }
}]);

server.on('uncaughtException',function(request, response, route, error){
  console.error(error.stack);
  response.send(error);
});

server.listen(port,host, function() {
  console.log('%s listening at %s', server.name, server.url);
});

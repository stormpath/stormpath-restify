var restify = require('restify');

var oauthFilter = require('stormpath-restify/filters').createOauthFilter();
var trustedFilter = require('stormpath-restify/filters').createGroupFilter(['trusted']);

var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || '8080';

var server = restify.createServer({
  name: 'Things API Server'
});

var thingDatabse = require('./things-db');

var db = thingDatabse({
  baseHref: 'http://' + host + ( port ? (':'+ port): '' ) + '/things/'
});

server.use(restify.bodyParser());

server.use(function logger(req,res,next) {
  console.log(new Date(),req.method,req.url);
  next();
});

server.post('/oauth/token',oauthFilter);

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

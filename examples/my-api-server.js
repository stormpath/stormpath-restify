var restify = require('restify');
var _ = require('underscore');
var uuid = require('uuid');

var oauthFilter = require('stormpath-restify/filters').createOauthFilter();

var host = process.env.HOST || '127.0.0.1';
var port = process.env.PORT || '8080';

var server = restify.createServer({
  name: 'Things API Server'
});

var things = {};

var aThing = {
  id: uuid(),
  hello: 'world'
};

things[aThing.id] = aThing;

function thingAsResource(thing){
  var resource = _.extend({
    href: 'http://' + host + ( port ? (':'+ port): '' ) + '/things/' + thing.id
  },thing);
  delete resource.id;
  return resource;
}
function thingsAsCollection(){
  return Object.keys(things).map(function(id){
    return thingAsResource(things[id]);
  });
}
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
  res.json(thingsAsCollection());
});

server.get('/things/:id',function(req,res,next){
  var id = req.params.id;
  if(!id || !things[id]){
    next(new restify.errors.ResourceNotFoundError());
  }else{
    res.json(thingAsResource(things[id]));
  }
});

server.post('/things',[oauthFilter,function(req,res){
  var newThing = _.extend({
    id: uuid()
  },req.body);
  things[newThing.id] = newThing;
  res.json(thingAsResource(newThing));
}]);

server.del('/things/:id',[function(req,res,next){
  var id = req.params.id;
  if(!id || !things[id]){
    next(new restify.errors.ResourceNotFoundError());
  }else{
    delete things[id];
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

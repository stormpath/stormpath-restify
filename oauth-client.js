var util = require('util');
var assert = require('assert-plus');
var restify = require('restify');
var JsonClient = require('restify/lib/clients/json_client');
function OauthClient(options) {

  options.name = options.name || 'OauthClient';

  JsonClient.call(this, options);

  this._authClient = restify.createJsonClient({
    url: 'http://localhost:8080'
  });
  this._authClient.basicAuth(options.key,options.secret);
  this._expiresAt = false;
}

util.inherits(OauthClient, JsonClient);

module.exports = {
  createClient: function createClient(options){
    if (typeof (options) === 'string') {
        options = {
            url: options
        };
    }

    var assert = require('assert-plus');
    var bunyan = require('restify/lib/bunyan_helper');
    var shallowCopy = require('restify/lib/utils').shallowCopy;

    assert.object(options, 'options');

    var opts = shallowCopy(options);
    opts.agent = options.agent;
    opts.name = opts.name || 'restify';
    opts.type = opts.type || 'application/octet-stream';
    opts.log = opts.log || bunyan.createLogger(opts.name);

    var client = new OauthClient(opts);

    client.get = client._readInterceptor.bind(client,'GET');
    client.head = client._readInterceptor.bind(client,'GET');
    client.opts = client._readInterceptor.bind(client,'OPTIONS');
    client.del = client._readInterceptor.bind(client,'DELETE');
    client.post = client._writeInterceptor.bind(client,'POST');
    client.put = client._writeInterceptor.bind(client,'PUT');
    client.patch = client._writeInterceptor.bind(client,'PATCH');

    return (client);
  }
};

OauthClient.prototype._authenticate = function _authenticate(cb){
  var self = this;
  var validToken = self._expiresAt && ((self._expiresAt - new Date().getTime())>0);
  if(validToken){
    cb();
  }else{
    self._authClient.post('/oauth/token?grant_type=client_credentials',function(err,req,res,body){
      if(err){
        cb(err);
      }else{
        self.headers.authorization = 'Bearer ' + body.access_token;
        self._expiresAt = new Date().getTime() + ((body.expires_in-5)*1000);
        cb();
      }
    });
  }
};

OauthClient.prototype._readInterceptor = function(verb,options,callback){
  var self = this;
  self._authenticate(function(err){
    if(err){
      callback(err);
    }else{
      self.read(
        self._options(verb, options),
        function(err,req,res,body){
          callback(err,body);
        }
      );
    }
  });
};

OauthClient.prototype._writeInterceptor = function(verb,options,body,callback){
  var self = this;
  assert.object(body, 'body');
  self._authenticate(function(err){
    if(err){
      callback(err);
    }else{
      var opts = self._options(verb, options);
      self.write(opts, body, function(err,req,res,body){
        callback(err,body);
      });
    }
  });
};

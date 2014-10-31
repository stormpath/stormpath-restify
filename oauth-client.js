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

OauthClient.prototype.del = function del(options, callback) {
    var opts = this._options('DELETE', options);

    return (this.read(opts, callback));
};


OauthClient.prototype.get = function get(options, callback) {
    var self = this;
    self._authenticate(function(err){
      if(err){
        callback(err);
      }else{
        self.read(
          self._options('GET', options),
          function(err,req,res,body){
            callback(err,body);
          }
        );
      }
    });
};

OauthClient.prototype.post = function post(options, body, callback) {
    var self = this;
    assert.object(body, 'body');
    self._authenticate(function(err){
      // console.log('_authenticate callback');
      if(err){
        callback(err);
      }else{
        var opts = self._options('POST', options);
        console.log('opts POST',opts.headers.authorization);
        self.write(opts, body, function(err,req,res,body){
          callback(err,body);
        });
      }
    });
};


// OauthClient.prototype.get = function get(options, callback) {
//     var opts = this._options('GET', options);

//     return (this.read(opts, callback));
// };



// OauthClient.prototype.head = function head(options, callback) {
//     var opts = this._options('HEAD', options);

//     return (this.read(opts, callback));
// };

// OauthClient.prototype.opts = function http_options(options, callback) {
//     var _opts = this._options('OPTIONS', options);

//     return (this.read(_opts, callback));
// };


// OauthClient.prototype.post = function post(options, callback) {
//     var opts = this._options('POST', options);

//     return (this.request(opts, callback));
// };


// OauthClient.prototype.put = function put(options, callback) {
//     var opts = this._options('PUT', options);

//     return (this.request(opts, callback));
// };


// OauthClient.prototype.patch = function patch(options, callback) {
//     var opts = this._options('PATCH', options);


//     return (this.request(opts, callback));
// };
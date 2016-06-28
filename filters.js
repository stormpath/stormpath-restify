var Promise = require("bluebird");
var pkg = require('./package.json');
var _ = require('underscore');


function handleError(handler,err,req,res,next){
  var self = this;
  if(typeof self.errorHandler==='function'){
    self.errorHandler(err,req,res,next);
  }
  else if(typeof handler==='function'){
    handler(err,req,res,next);
  }else{
    res.json(err.status || 500,err);
  }
}

function createOauthFilter(_options){
  var self = this;
  var opts = typeof _options === 'object' ? _options : {};
  return function _authenticateApiRequest(req,res,next){
    self.getApplication.then(function(application){
      application.authenticateApiRequest(_.extend({
        request:req
      },opts),function(err,authResult){
        if(err){
          self.handleError(opts.errorHandler,err,req,res,next);
        }else if(authResult.tokenResponse){
          res.send(authResult.tokenResponse);
        }else{
          authResult.getAccount(function(err,account){
            if(err){
              self.handleError(opts.errorHandler,err,req,res,next);
            }else{
              req.account = account;
              next();
            }
          });
        }
      });
    });
  };
}

function newAccountFilter(_options){
  var self = this;
  var opts = typeof _options === 'object' ? _options : {};

  return function _handleAccountCreationRequest(req,res,next){
    self.getApplication.then(function(application){
      application.createAccount(req.body,function(err){
        if(err){
          self.handleError(opts.errorHandler,err,req,res,next);
        }else{
          res.json(201,{message:'Please check your email for verification'});
        }
      });
    });
  };
}


function accountVerificationFilter(_options){
  var self = this;
  var opts = typeof _options === 'object' ? _options : {};


  return function _handleAccountVerificationRequest(req,res,next){
    self.getCurrentTenant.then(function(tenant){
      tenant.verifyAccountEmail(req.params.sptoken,function(err,account){
        if(err){
          self.handleError(opts.errorHandler,err,req,res,next);
        }else{
          account.createApiKey(function(err,apiKey){
            if(err){
              self.handleError(opts.errorHandler,err,req,res,next);
            }else{
              var body = 'Api Key Id: ' + apiKey.id + '\n' + 'Api Key Secret: ' + apiKey.secret;
              res.writeHead(200, {
                'Content-Length': Buffer.byteLength(body),
                'Content-Type': 'text/plain'
              });
              res.write(body);
            }
          });
        }
      });
    });
  };
}

function createGroupFilter(_options){
  var self = this;
  var opts = typeof _options === 'object' ? _options : {};

  if(!opts.inGroup){
    throw new Error('inGroup is the only supported filter at this time.  PR welcome!');
  }

  opts.inGroup = typeof opts.inGroup === 'string' ? [opts.inGroup] : opts.inGroup;

  return function groupFilter(req,res,next){
    req.account.getGroups(function(err,collection){
      if(err){
        next(err);
      }else{
        collection.detect(function(group,cb){
          cb(opts.inGroup.indexOf(group.name) >= 0);
        },function(result){
          if(result){
            next();
          }else{
            if(typeof errorHandler==='function'){
              self.handleError(opts.errorHandler,err,req,res,next);
            }else{
              res.send(403);
            }
          }
        });
      }
    });
  };
}

function createFilterSet(_options){
  var opts = typeof _options === 'object' ? _options : {};
  var self = this;
  var stormpath = opts.stormpathLib || require('stormpath');

  opts.userAgent = 'restify-stormpath/' + pkg.version + ' ' + 'restify/' + require('restify/package').version;

  if(typeof opts.errorHandler==='function'){
    self.errorHandler = opts.errorHandler;
  }
  if(opts.spClient){
    self.spClient = opts.spClient;
  }else{
    self.spClient = new stormpath.Client(opts);
  }
  console.log('Initializing Stormpath');
  self.getApplication = new Promise(function(resolve,reject){
    self.spClient.on('ready', function(){
      self.spClient.getApplication(self.spClient.config.application.href,
        function(err,app){
          if(err){
            reject(err);
          }else{
            resolve(app);
          }
        }
      );
    });
  });
  self.getApplication.then(function(app){
    console.log('Using Stormpath application \'' + app.name + '\'');
  });
  self.getApplication.catch(function(err){
    throw err;
  });
  self.getCurrentTenant = new Promise(function(resolve,reject){
    self.spClient.on('ready', function(){
      self.spClient.getCurrentTenant(
        function(err,tenant){
          if(err){
            reject(err);
          }else{
            resolve(tenant);
          }
        }
      );
    });
  });
  self.getCurrentTenant.catch(function(err){
    throw err;
  });
  self.createOauthFilter = createOauthFilter.bind(self);
  self.createGroupFilter = createGroupFilter.bind(self);
  self.newAccountFilter = newAccountFilter.bind(self);
  self.accountVerificationFilter = accountVerificationFilter.bind(self);
  self.handleError = handleError.bind(self);
  return this;
}

module.exports = {
  createFilterSet: createFilterSet
};
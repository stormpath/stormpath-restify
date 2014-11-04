var Promise = require("bluebird");
var pkg = require('./package.json');


function createOauthFilter(_options,stormpathLib){
  var opts = typeof _options === 'object' ? _options : {};
  var self = this;
  var stormpath = stormpathLib || require('stormpath');
  var apiKeyId = opts.apiKeyId || process.env['STORMPATH_API_KEY_ID'] || "";
  var apiKeySecret = opts.apiKeySecret || process.env['STORMPATH_API_KEY_SECRET'] || "";
  var appHref = opts.appHref || process.env['STORMPATH_APP_HREF'] || "";

  if(opts.spClient){
    self.spClient = opts.spClient;
  }else{
    self.spClient = new stormpath.Client({
      apiKey: new stormpath.ApiKey(apiKeyId,apiKeySecret),
      userAgent: 'restify-stormpath/' + pkg.version + ' ' + 'restify/' + require('restify/package').version,
    });
  }
  console.log('Initializing Stormpath');
  var getApplication = new Promise(function(resolve,reject){
    self.spClient.getApplication(appHref,
      function(err,app){
        if(err){
          reject(err);
        }else{
          resolve(app);
        }
      }
    );
  });
  getApplication.then(function(app){
    console.log('Using Stormpath application \'' + app.name + '\'');
  });
  getApplication.catch(function(err){
    throw err;
  });

  return function _authenticateApiRequest(req,res,next){
    getApplication.then(function(application){
      application.authenticateApiRequest({
        request:req,
        ttl: 10
      },function(err,authResult){
        if(err){
          next(err);
        }else if(authResult.tokenResponse){
          res.send(authResult.tokenResponse);
        }else{
          authResult.getAccount(function(err,account){
            if(err){
              next(err);
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

function newAccountFilter(_options,stormpathLib){
  var opts = typeof _options === 'object' ? _options : {};
  var self = this;
  var stormpath = stormpathLib || require('stormpath');
  var apiKeyId = opts.apiKeyId || process.env['STORMPATH_API_KEY_ID'] || "";
  var apiKeySecret = opts.apiKeySecret || process.env['STORMPATH_API_KEY_SECRET'] || "";
  var appHref = opts.appHref || process.env['STORMPATH_APP_HREF'] || "";
  var errorHandler = opts.errorHandler;

  if(opts.spClient){
    self.spClient = opts.spClient;
  }else{
    self.spClient = new stormpath.Client({
      apiKey: new stormpath.ApiKey(apiKeyId,apiKeySecret),
      userAgent: 'restify-stormpath/' + pkg.version + ' ' + 'restify/' + require('restify/package').version,
    });
  }
  console.log('Initializing Stormpath');
  var getApplication = new Promise(function(resolve,reject){
    self.spClient.getApplication(appHref,
      function(err,app){
        if(err){
          reject(err);
        }else{
          resolve(app);
        }
      }
    );
  });
  getApplication.then(function(app){
    console.log('Using Stormpath application \'' + app.name + '\'');
  });
  getApplication.catch(function(err){
    throw err;
  });

  function handleError(err,req,res,next){
    console.log('handleError',err);
    if(typeof errorHandler==='function'){
      errorHandler(err,req,res,next);
    }else{
      res.json(err.status,err);
    }
  }

  return function _handleAccountCreationRequest(req,res,next){

    getApplication.then(function(application){

      application.createAccount(req.body,function(err){
        if(err){
          handleError(err,req,res,next);
        }else{
          res.json(201,{message:'Please check your email for verification'});
        }
      });
    });

  };
}

function accountVerificationFilter(_options,stormpathLib){
  var opts = typeof _options === 'object' ? _options : {};
  var self = this;
  var stormpath = stormpathLib || require('stormpath');
  var apiKeyId = opts.apiKeyId || process.env['STORMPATH_API_KEY_ID'] || "";
  var apiKeySecret = opts.apiKeySecret || process.env['STORMPATH_API_KEY_SECRET'] || "";

  var errorHandler = opts.errorHandler;

  if(opts.spClient){
    self.spClient = opts.spClient;
  }else{
    self.spClient = new stormpath.Client({
      apiKey: new stormpath.ApiKey(apiKeyId,apiKeySecret),
      userAgent: 'restify-stormpath/' + pkg.version + ' ' + 'restify/' + require('restify/package').version,
    });
  }
  var getCurrentTenant = new Promise(function(resolve,reject){
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
  getCurrentTenant.catch(function(err){
    throw err;
  });

  function handleError(err,req,res,next){
    if(typeof errorHandler==='function'){
      errorHandler(err,req,res,next);
    }else{
      next(err);
    }
  }

  return function _handleAccountVerificationRequest(req,res,next){

    getCurrentTenant.then(function(tenant){
      tenant.verifyAccountEmail(req.params.sptoken,function(err,account){
        if(err){
          handleError(err,req,res,next);
        }else{
          account.createApiKey(function(err,apiKey){
            if(err){
              handleError(err,req,res,next);
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

function createGroupFilter(_targetGroups,errorHandler){
  var targetGroups;

  if(Array.isArray(_targetGroups)){
    targetGroups = _targetGroups;
  }else if(typeof _targetGroups==='string'){
    targetGroups = [_targetGroups];
  }else{
    throw new Error('createGroupFilter: targetGroups must be a string or array of strings');
  }

  return function groupFilter(req,res,next){
    req.account.getGroups(function(err,collection){
      if(err){
        next(err);
      }else{
        collection.detect(function(group,cb){
          cb(targetGroups.indexOf(group.name) > -1);
        },function(result){
          if(result){
            next();
          }else{
            if(typeof errorHandler==='function'){
              errorHandler(req,res,next,err);
            }else{
              res.send(403);
            }
          }
        });
      }
    });
  };
}

module.exports = {
  createOauthFilter: createOauthFilter,
  createGroupFilter: createGroupFilter,
  newAccountFilter: newAccountFilter,
  accountVerificationFilter: accountVerificationFilter
};
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

module.exports = {
  createOauthFilter: createOauthFilter
};
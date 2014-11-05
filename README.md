# stormpath-restify

Stormpath-Restify is a filter ("middleware") provider for the Restify
API framework.  It helps you secure your API by making it easy to
create accounts for your API users and provision API keys for them.

[Stormpath](https://stormpath.com) is a User Management API that reduces
development time for any application with scalable user infrastructure.

This module provides a set of filters which allow you
to add the following to your API:

* Register new API accounts
* Verify new API accounts (via email)
* Provision API keys for new API accounts
* API Key Authentication using JWT Bearer tokens
* Oauth2 Client-credentials worklow for generating Bearer tokens
* Access control based on the group membership of an account

For a walk through of how to enable these features, please
see our blog post (TBD) or view the
[examples section](https://github.com/stormpath/stormpath-restify/tree/master/examples)
of this repo.

## Installation

To get started, you need to install this package via npm:

```bash
  $ npm install stormpath-restify
```

You can then require it in your Restify server application:

```javascript
  var stormpathRestify = require('stormpath-restify')
```

## HTTPS - You MUST use it

<span style="color:red">Warning: You MUST use HTTPS in production</span>

Oauth itself does NOT make your authentication strategies secure.  Sensitive
information is still sent over the wire, and you MUST use HTTPS on your
sever.  Failing to do this will compromise your entire API.

## Creating a filter set

To make use of the filters you must first create a filter set which is
bound to your Stormpath Application (this is how we use Stormpath to manage
all the state about your API accounts).

You will need a free Developer account, available at
[api.stormpath.com/register](https://api.stormpath.com/register).
Once you have obtained your Stormpath credentials and Application Href
you can generate a filter set for that application:

```javascript
  var stormpathConfig = {
    apiKeyId: 'YOUR_STORMPATH_API_KEY',
    apiKeySecret: 'YOUR_STORMPATH_API_SECRET',
    appHref: 'YOUR_STORMPATH_APP_HREF'
  };

  var stormpathFilters = stormpathRestify.createFilterSet(stormpathConfig);
```

Alternatively you can export those values as these environment variables,
and they will be automatically read (you do not have to pass in a config
object to createFilterSet):

```bash
export STORMPATH_API_KEY_SECRET=XXX
export STORMPATH_API_KEY_ID=XXX
export STORMPATH_APP_HREF=XXX
```

## Using the Filters

### Oauth Filter

This filter can be used to handle the Oauth2 Client Credential workflow,
it can issue tokens or authenticate users if they already have a token.
If the user is authenticated the `req` object will have an `account` object,
which is the Stormpath Account object from the [Stormpath Node SDK](https://github.com/stormpath/stormpath-sdk-node)

Configure the filter and use it like so:

```javascript
var oauthFilter = stormpathFilters.createOauthFilter({/* options */});

server.post('/oauth/token',oauthFilter);

server.get('/me',[oauthFilter,function(req,res){
  res.json(req.account);
}]);
```

The options object can be used to configure the expiration of the token,
as well as the given scopes.  The options object is the same object that you
would pass to [authenticateApiRequest](http://docs.stormpath.com/nodejs/api/application#authenticateApiRequest)
if you were using the [Stormpath Node SDK](https://github.com/stormpath/stormpath-sdk-node)
directly.  Please refer to that link for documentation of the options.

### Group Filter

Use this filter to assert group membership of the authenticated account:

```javascript
var trustedFilter = stormpathFilters.createGroupFilter({
  inGroup: 'trusted'
});

server.del('/things/:id',[oauthFilter,trustedFilter,function(req,res,next){
  // handle resource delete request
}]);
```

### Registration Filter

This filter will accept a JSON POST, which must have the following properties:

* surname
* givenName
* email
* password

This data will be used to create a new account for the API user.
Email conflicts and password strength rules will be followed, based on the configuration
of the Stormpath Directory that is attached to the Stormpath Application
that you used when configuring the filter set.

**Warning:** You should enable the email verification workflow for your Stormpath Directory,
so that arbitrary API accounts cannot be generated at will.   Please read
[Cloud Directory Workflow Automations](http://docs.stormpath.com/console/product-guide/#cloud-directory-workflow-automations)

Create and use the filter like this:

```javascript
var newAccountFilter = stormpathFilters.newAccountFilter();

server.post('/accounts',newAccountFilter);
```

### Account Verification Filter

You should require account verification for newly created API accounts.
Stormpath will send an email to the new account, containing a link that they must
click on.  Use the Stormpath Admin Console to configure this email template
and modify the link in the email to direct the user to your server.

Then configure this filter to accept requests at the specified URL:

```javascript
var accountVerificationFilter = stormpathFilters.accountVerificationFilter();

server.get('/verifyAccount',accountVerificationFilter);
```

## Error Handling

If an error occurs within any filter they will, by default, send an HTTP response
with appropriate status codes and error message as a JSON body.  This ends the request handling
chain.

Should you need to do custom error handling, all filters will accept an `errorHandler`
function as an option.  If you supply this function you will receive control of
the request chain and it is your responsibility to end the request.

The error handler will receive these arguments: `(err,req,res,next)`

Example usage:

```javascript
var trustedFilter = stormpathFilters.createGroupFilter({
  inGroup: 'trusted',
  errorHandler: function(err,req,res,next){
    res.json(403,{
      message:'You must apply for access to the Trusted users group'
    });
  }
});
```

If you wish to catch *all* errors from the filter set, you can specify
the error handler when you create the filter set:

```javascript
var stormpathFilters = stormpathRestify.createFilterSet({
  errorHandler: function(err,req,res,next){
    // all your error are belong to me
  }
});
```
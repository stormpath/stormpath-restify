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


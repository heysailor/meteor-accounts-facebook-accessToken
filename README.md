# meteor-accounts-facebook-accessToken

This Meteor package adds a login service which accepts a Facebook accessToken directly. Handy for case such as react-native where you don't want to use the usual oauth login pathway.

Call the login method with the following parameter:

`{ facebookAccessToken: <access_token> }`

The access token is verified with the Facebook Graph API's debug service.
As an extra bonus, the user profile and user document root is supplemented with a `profilePictureURL` field.

You must set up Facebook in your service configurations - this package has a dependency on the `Facebook` package. It loads your app secret and app ID from this configuration. 
  

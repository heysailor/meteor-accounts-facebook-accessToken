// This method allows login directly with a Facebook authToken.
// -- bypassing the more usual facebook-via-oauth login method, which requires tokens to be
// exchanged via a pending_credentials collection.
// Primarily, this method exists to ease login from non browser environments
// such as react-native.

// Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.
Accounts.registerLoginHandler(function (options) {

  console.log(options.facebookAccessToken);

  if (!options.facebookAccessToken)
    return undefined; // don't handle

  check(options, {
    facebookAccessToken: String
  });


  const accessToken = options.facebookAccessToken;

  // If no authData supplied, return error
  if (!accessToken) {
    return { type: "facebookAccessToken",
             error: new Meteor.Error(
               Accounts.LoginCancelledError.numericError,
               "No facebook accessToken supplied") };
  }

  let verifiedToken;

  try {
    // Verify token with facebook - ie, don't trust user supplied
    verifiedToken = getTokenDebugResponse(accessToken);
    console.log('Verified token:', verifiedToken);
  } catch (e) {
    console.error(e);
    return { type: "facebookAccessToken",
             error: new Meteor.Error(
               Accounts.LoginCancelledError.numericError,
               "Unable to verify accessToken") };
  }

  const result = getUserFacebookData(verifiedToken);

  console.log('Result', result);

  // return Accounts.updateOrCreateUserFromExternalService(result.serviceName, result.serviceData, result.options);
});

// assumes verified accessToken
function getUserFacebookData(verifiedToken) {

  if (!verifiedToken || !verifiedToken.accessToken) throw 'Must supply accessToken to get facebook data';

  const accessToken = verifiedToken.accessToken;

  // include all fields from facebook
  // http://developers.facebook.com/docs/reference/login/public-profile-and-friend-list/
  const whitelisted = ['id', 'email', 'name', 'first_name',
      'last_name', 'link', 'gender', 'locale', 'age_range'];

  const identity = getIdentity(accessToken, whitelisted);
  const profilePictureURL = getProfilePicture(accessToken);

  const serviceData = {
    accessToken,
    expiresAt: (+new Date) + (1000 * verifiedToken.expiresIn),
    profilePictureURL
  };

  const options = {
    profile: {
      name: identity.name,
      profilePictureURL,
    }
  }


  var fields = _.pick(identity, whitelisted);
  _.extend(serviceData, fields);

  return {
    serviceData,
    options
  };
};

function getProfilePicture(accessToken) {
  try {
    // Minimum FB profile pic size is 180x180px
    return HTTP.get('https://graph.facebook.com/v2.0/me/picture/?redirect=false&height=180&width=180', {
      params: { access_token: accessToken },
    }).data.data.url;
  } catch (err) {
    throw _.extend(new Error(`Failed to fetch identity from Facebook: ${err.message}`),
                   { response: err.response });
  }
}

function getIdentity(accessToken, fields) {
  try {
    // synchronous
    return HTTP.get("https://graph.facebook.com/v2.4/me", {
      params: {
        access_token: accessToken,
        fields: fields
      }
    }).data;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Facebook. " + err.message),
                   {response: err.response});
  }
};

const getTokenDebugResponse = function (accessToken) {
  console.log('verifying');
  const config = ServiceConfiguration.configurations.findOne({service: 'facebook'});
  console.log(config);
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  let responseContent;
  try {
    // Debug the access token
    console.log('sending req');
    responseContent = HTTP.get(
      "https://graph.facebook.com/debug_token", {
        params: {
          input_token: accessToken,
          access_token: `${config.appId}|${OAuth.openSecret(config.secret)}`
        }
      }).data;

  } catch (err) {
    throw _.extend(new Error("Failed to complete OAuth handshake with Facebook.... " + err.message),
                   {response: err.response});
  }

  if (responseContent.data) {
    responseContent = responseContent.data;
  }

  if (!responseContent.is_valid) {
    throw new Error("Invalid token");
  }

  if (!responseContent.app_id || !responseContent.app_id === config.appId) {
    throw new Error("Token is not for climbing.zone");
  }

  const fbExpires = responseContent.expires_at;

  return {
    accessToken: accessToken,
    expiresIn: fbExpires
  };
};

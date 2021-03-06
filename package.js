/* eslint-disable prefer-arrow-callback */
/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
Package.describe({
  summary: 'Login service for Facebook accounts using a directly-passed accessToken',
  version: '0.1.15',
  git: 'https://github.com/heysailor/accounts-facebook-accessToken.git',
  author: 'Nick McIntosh',
  name: 'heysailor:accounts-facebook-accesstoken',
});

Package.onUse(function config(api) {
  api.use([
    'ecmascript@0.4.3',
    'http@1.1.5',
    'accounts-base@1.2.7',
    'facebook@1.2.6',
    'check@1.2.1',
    'oauth@1.1.10',
    'service-configuration@1.0.9'
  ], 'server');

  // Export Accounts (etc) to packages using this one.
  api.imply([
    'accounts-base',
    'http',
    'oauth'
  ], ['server']);

  api.add_files('facebook.js', 'server');
});

var uri = require('url'),
    crypto = require('crypto'), 
    util = require('util'),
    OAuth2Strategy = require('passport-oauth2'),
    Profile = require('./profile');

function Strategy(options, verify) {
  console.log("PP-LVL-1", options);
  options = options || {};
  options.authorizationURL = options.authorizationURL || 'http://build.levelware.com/#user/api/auth/';
  options.tokenURL = options.tokenURL || 'http://build.levelware.com/server/oauth/token';
  options.scopeSeparator = options.scopeSeparator || ',';
        
  OAuth2Strategy.call(this, options, verify);
  this.name = 'levelware';
  this._clientSecret = options.clientSecret;
  this._enableProof = options.enableProof;
  this._profileFields = options.profileFields || null;
}

util.inherits(Strategy, OAuth2Strategy);

module.exports = Strategy;

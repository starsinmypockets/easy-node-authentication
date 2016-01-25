module.exports = function(app, passport) {

  app.use(function (req, res, next) {
    console.log('>>>>',req.users, req.session, '<<<<');
    next();
  });
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));


   // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/'
            }));

   // LEVELWARE ---------------------------------
        
        app.get('/connect/levelware', passport.authenticate('levelware', { scope : ['read-only', 'profile'] }));

        // the callback after LEVELWARE has authorized the user contains the auth code
        app.get('/connect/levelware/callback', function (req, res) {
          var access_token;
          var User = require('./models/user');
          
          // Use the auth token and get an access token`
          getLvlAccessToken(req.query.code, function (err, data) {
            console.log('lvl-c-2', JSON.parse(data).access_token, req.session);

            // now save the token(s) with the user!
            User.findById(req.session.passport.user, function (err, doc) {
              if (err) console.log(err);
              console.log("lvl-c-3", doc);
              res.json({ "access_token" : req.query.code , 'session' : req.session });
            });
          });
        });
        
        // Test Bearer token - this shoud return a user object
        app.get('/test/levelware/hasauth', function (req, res) {
            getTestUser(function (sessionUser) { 
              testApiAccess({accessToken : sessionUser.levelware.accessToken}, function (err, data) {
                console.log('Test has access', err, data);
                return res.json(data);
              });
            });
        });

        app.get('/test/levelware/getdeals', function (req, res) {
          
        });

        app.get('/test/levelware/deal/:id', function (req, res) {
        
        });
// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });
    
    // LEVELWARE ---------------------------------
    app.get('/unlink/levelware', isLoggedIn, function(req, res) {
        getTestUser(function (sessionUser) {
          sessionUser.levelware.token = undefined;
          sessionUser.save(function(err) {
              res.redirect('/profile');
          });
        });
    });



};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}


/**
 * Levelware integration examples
 *
 **/
function getLvlAccessToken (code, fn) {
  console.log("glt->0");
  var resData;
  var querystring = require('querystring');
  var http = require('http');
  var config = require('../config/auth');
  var postData = querystring.stringify({
    grant_type : 'authorization_code',
    code : code,
    client_id  : config.levelwareAuth.clientID,
    client_secret : config.levelwareAuth.clientSecret
  });
  
  console.log("post data", postData); 

  var options = {
      hostname: 'build.levelware.com',
      port: 80,
      path: '/server/oauth/token/',
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length,
      }
  };

  console.log('glt->1', options);
  var rdata;
  var r = http.request(options, function (response) {
    console.log('status', response.statusCode);
    console.log('HEADERS', JSON.stringify(response.headers));
    response.setEncoding('utf8');
    
    response.on('data', function (chunk) {
      console.log('chunk', chunk);
      resData = chunk;
    });
    
    response.on('end', function () {
      console.log('No more data in response.')
      fn(null, resData);
    });
  });
  

  r.on('error', function (err) {
    console.log('problem with request', e.message);
    fn(err);
  });

  console.log('glt->UGH');
  // write data to request body
  r.write(postData);
  r.end();         
}

// authenticed api usage requires access token, client id and client secret
function testApiAccess (opts, fn) {
  console.log("test api 1", opts);
  var resData;
  var querystring = require('querystring');
  var http = require('http');
  var config = require('../config/auth');
  
  var options = {
      hostname: 'build.levelware.com',
      port: 80,
      path: '/server/test/api1/',
      method: 'GET',
      headers: {
          'Authorization' : 'Bearer ' + opts.accessToken
      }
  };

  var r = http.request(options, function (response) {
    console.log('status', response.statusCode);
    console.log('HEADERS', JSON.stringify(response.headers));
    response.setEncoding('utf8');
    
    response.on('data', function (chunk) {
      console.log('chunk', chunk);
      resData = chunk;
    });
    
    response.on('end', function () {
      console.log('No more data in response.')
      fn(null, resData);
    });
  });
  

  r.on('error', function (err) {
    console.log('problem with request', e.message);
    fn(err);
  });

  r.end();         
}

// This is a standin for session users or whatever method you are using
function getTestUser(fn) {
  var User = require('./models/user');
  
  // @@ Use req.session here to get the proper user
  User.findOne({'local.email' : 'pjwalker76@gmail.com'}).exec(function (err, user) {
    if (err) return fn(err);
    console.log('get a user', err, user);
    return fn(user);
  });
}



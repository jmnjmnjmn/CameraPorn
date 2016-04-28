var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

exports.setup = function (User, config) {
//  console.log("clientID: "+config.facebook.clientID);
//  console.log("clientSecret: "+config.facebook.clientSecret);
  console.log("callback:  "+config.facebook.callbackURL);
  console.log("profileFields:  "+config.facebook.profileFields);

  passport.use(new FacebookStrategy(config.facebook,
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'facebook.id': profile.id
      },
      function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            role: 'user',
//            username: profile.username,
            provider: 'facebook',
            facebook: profile._json
          });
          user.save(function(err) {
            if (err) done(err);
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      })
    }
  ));
};
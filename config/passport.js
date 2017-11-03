'use strict';
var passport = require('passport');
// These are different types of authentication strategies that can be used with Passport.
var LocalStrategy = require('passport-local').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google').Strategy;
var config = require('./config');
var db = require('./sequelize');
var winston = require('./winston');

//Serialize sessions
passport.serializeUser(function(user, done) {
     //console.log('config Passport.js serializeUser');
    //console.log(user);
    //console.log(done);
  done(null, user.USERID);
});

passport.deserializeUser(function(USERID, done) {
        //console.log('config Passport.js deserializeUser');
    //console.log(USERID);
    //console.log(done);
    db.User.find({where: {USERID: USERID}})
    .then(function(user){

        if(!user) return done('error');
        winston.info('Session: { USERID: ' + user.USERID + ', USERNAME: ' + user.USERNAME + ' }');
        done(null, user);
    }).catch(function(err){
        done(err, null);
    });
});

//Use local strategy
passport.use(new LocalStrategy({
    usernameField: 'USERNAME',
    passwordField: 'PASSWORD'
  },
  function(USERNAME, PASSWORD, done) {
    //console.log('config Passport.js LocalStrategy');
    //console.log(USERNAME);
    //console.log(PASSWORD);
    db.User.find({ where: { USERNAME: USERNAME }}).then(function(user) {
            //console.log('db.User.find');
            //console.log(USERNAME);
            //console.log(user);
      if (!user) {
        //console.log('Unknown user');
        done(null, false, { message: 'Unknown user' });
      } else if (!user.authenticate(PASSWORD)) {
        //console.log('Invalid PASSWORD');
        done(null, false, { message: 'Invalid PASSWORD'});
      } else {
            //user.loggedInJavaToo(user.USERID,USERNAME,PASSWORD);
        //console.log('USERNAME user confirm');
        winston.info('Login (local) : { USERID: ' + user.USERID + ', USERNAME: ' + user.USERNAME + ' }');
        done(null, user);
      }
    }).catch(function(err){
         //console.log('err err');
      done(err);
    });
  }
));

//    Use twitter strategy
passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID,
        consumerSecret: config.twitter.clientSecret,
        callbackURL: config.twitter.callbackURL,
        includeEmail: true
    },
    function(token, tokenSecret, profile, done) {
        console.log('TwitterStrategy');
        console.log(profile);
        db.User.find({where: {twitterUserId: profile.id}}).then(function(user){
            if(!user){
                db.User.create({
                    twitterUserId: profile.id,
                    name: profile.displayName,
                    username: profile.username,
                    provider: 'twitter'
                }).then(function(u){
                    winston.info('New User (twitter) : { id: ' + u.id + ', username: ' + u.username + ' }');
                    done(null, u);
                });
            } else {
                winston.info('Login (twitter) : { id: ' + user.id + ', username: ' + user.username + ' }');
                done(null, user);
            }

        }).catch(function(err){
            done(err, null);
        });
    }
));


// Use facebook strategy
passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID,
        clientSecret: config.facebook.clientSecret,
        callbackURL: config.facebook.callbackURL,
        profileFields: ['id' ,'email', 'displayName', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified']
    },
    function(accessToken, refreshToken, profile, done) {
        console.log('FacebookStrategy');
        console.log(profile);
        var FacebookID      = profile.id;
       // var username        = profile.username;
        var displayName     = profile.displayName;
        var givenName       = profile.name.givenName;
        var familyName      = profile.name.familyName;
        var middleName      = profile.name.middleName;
        var gender          = profile.gender;
        var profileUrl      = profile.profileUrl;
        var email           = profile.emails[0].value;
        var provider        = profile.provider;

        db.User.find({where : {EMAIL: email}}).then(function(user){
            //use where as facebookUserId for a good reason
            if(!user){
                db.User.create({
                    GIVNAME: givenName,
                    SURNAME:familyName,
                    GENDER:gender,
                    EMAIL: email,
                    USERNAME: email,
                    provider: provider,
                    facebookUserId: FacebookID
                }).then(function(u){
                    winston.info('New User (facebook) : { id: ' + u.id + ', username: ' + u.username + ' }');
                    done(null, u);
                });
            } else {
                db.User.update({
                    GIVNAME: givenName,
                    SURNAME:familyName,
                    GENDER:gender,
                    USERNAME: email,
                    provider: provider,
                    facebookUserId: FacebookID
                }, {
                  where: {EMAIL: email}
                });
                winston.info('Login (facebook) : { id: ' + user.id + ', username: ' + user.username + ' }');
                done(null, user);
            }
        }).catch(function(err){
            done(err, null);
        });
    }
));

//Use google strategy
passport.use(new GoogleStrategy({
    returnURL: config.google.callbackURL,
    realm: config.google.realm
  },
  function(identifier, profile, done) {
        console.log('GoogleStrategy');
        console.log(profile);

    db.User.find({where: {openId: identifier}}).then(function(user){
        if(!user){
            db.User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                username: profile.displayName.replace(/ /g,''),
                openId: identifier,
            }).then(function(u){
                winston.info('New User (google) : { id: ' + u.id + ', username: ' + u.username + ' }');
                done(null, u);
            });
        } else {
            winston.info('Login (google) : { id: ' + user.id + ', username: ' + user.username + ' }');
            done(null, user);
        }
    }).catch(function(err){
        done(err, null);
    });
  }
));

module.exports = passport;

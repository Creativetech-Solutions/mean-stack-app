'use strict';
var passport    = require('passport');
var bcrypt      = require('bcrypt');
// These are different types of authentication strategies that can be used with Passport.
var LocalStrategy = require('passport-local').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
//var GoogleStrategy = require('passport-google').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('./config');
var db = require('./sequelize');
var winston = require('./winston');
var SocialPassword = 'social';


var express = require('express');
var http = require('http');
var LocalStorage = require('node-localstorage').LocalStorage,
   localStorage = new LocalStorage('./scratch');

var app = express();
const bodyParser = require('body-parser');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var ip = '192.168.1.88';
var ApiBasePath = '/Anerve/anerveWs/AnerveService/';
var headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type' : 'application/json; charset=UTF-8',
    'Access-Control-Allow-Headers': 'content-type, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT',
    'Access-Control-Max-Age': '3600',
    'Access-Control-Allow-Credentials': 'true'
};

function encryptPassword(PASSWORD){
    var salt = bcrypt.genSaltSync(10);
        if (!PASSWORD || !salt){
            return '';
        }
 return bcrypt.hashSync(PASSWORD, salt);
}
var socialPass = encryptPassword(SocialPassword);

//Serialize sessions
passport.serializeUser(function(user, done) {
    console.log(user);
  done(null, user.USERID);
});

passport.deserializeUser(function(USERID, done) {
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
    db.User.find({ where: { USERNAME: USERNAME }}).then(function(user) {
      if(!user) {
        done(null, false, { message: 'Unknown user' });
      } else if (!user.authenticate(PASSWORD)) {
        done(null, false, { message: 'Invalid PASSWORD'});
      } else {
        winston.info('Login (local) : { USERID: ' + user.USERID + ', USERNAME: ' + user.USERNAME + ' }');
        done(null, user);
      }
    }).catch(function(err){
      done(err);
    });
  }
));

//    Use twitter strategy
passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID,
        consumerSecret: config.twitter.clientSecret,
        callbackURL: config.twitter.callbackURL,
        profileFields: ['id' ,'email', 'displayName', 'include_email=true'],
        email: true,
       // userProfileURL  : 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
        includeEmail:true,
    },
    function(token, tokenSecret, profile, done) {
        console.log('TwitterStrategy');
        console.log(profile);
        var provider  = 'twitter';
        db.User.find({where: {twitterUserId: profile.id}}).then(function(user){
            if(!user){
                db.User.create({
                    twitterUserId: profile.id,
                    name: profile.displayName,
                    username: profile.username,
                    provider: provider
                }).then(function(u){
                    if(u.USERID){
                        db.Login.create({
                            userId: u.USERID,
                            givname: profile.displayName,
                            username: profile.username,
                            password:socialPass,
                            role: 'U'
                        }).then(function(l){   
                            UserLoginInJava(u); 
                            winston.info('New User (twitter) : { id: ' + u.USERID + ', username: ' + u.USERNAME + ' }');
                            winston.info('New Login (twitter) : { id: ' + l.userId + ', username: ' + l.username + ' }');
                            done(null, u);
                        });
                    }
                });
            } else {
                db.User.update({
                    provider: provider,
                    twitterUserId: profile.id
                }, {
                  where: {EMAIL: email}
                });
                UserLoginInJava(user); 
                winston.info('Login (twitter) : { id: ' + user.USERID + ', username: ' + user.USERNAME + ' }');
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
                    if(u.USERID){
                        db.Login.create({
                            userId: u.USERID,
                            givname: givenName,
                            surname: familyName,
                            username: email,
                            password:socialPass,
                            role: 'U'
                        }).then(function(l){ 
                            UserLoginInJava(u);   
                            winston.info('New User (facebook) : { id: ' + u.USERID + ', username: ' + u.USERNAME + ' }');
                            winston.info('New Login (facebook) : { id: ' + l.userId + ', username: ' + l.username + ' }');
                            done(null, u);
                        });
                    }

                });
            } else {
                db.User.update({
                    provider: provider,
                    facebookUserId: FacebookID
                }, {
                  where: {EMAIL: email}
                });
                UserLoginInJava(user); 
                winston.info('Login (facebook) : { id: ' + user.USERID + ', username: ' + user.USERNAME + ' }');
                done(null, user);
            }
        }).catch(function(err){
            done(err, null);
        });
    }
));

//Use google strategy
passport.use(new GoogleStrategy({
    clientID        : config.google.clientID,
    clientSecret    : config.google.clientSecret,
    callbackURL     : config.google.callbackURL,
    //returnURL: config.google.callbackURL,
    //realm: config.google.realm
  },
  function(token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
            console.log('GoogleStrategy');
            console.log(profile);
        var GoogleID      = profile.id;
       // var username        = profile.username;
        var displayName     = profile.displayName;
        var givenName       = profile.name.givenName;
        var familyName      = profile.name.familyName;
        var middleName      = '';//profile.name.middleName;
        var photos          = profile.photos[0].value;
        var gender          = profile.gender;
        var email           = profile.emails[0].value;
        var provider        = profile.provider;

            db.User.find({where : {EMAIL: email}}).then(function(user){
                        console.log('u for user');
                //use where as facebookUserId for a good reason
                console.log('user for user');
                console.log(user);
                if(!user){
                    db.User.create({
                        GIVNAME: givenName,
                        SURNAME:familyName,
                        GENDER:gender,
                        EMAIL: email,
                        USERNAME: email,
                        provider: provider,
                        openID: GoogleID
                    }).then(function(u){
                        console.log('u for user');
                        console.log(u);
                        if(u.USERID){
                            db.Login.create({
                                userId: u.USERID,
                                givname: givenName,
                                surname: familyName,
                                username: email,
                                password:socialPass,
                                role: 'U'
                            }).then(function(l){
                                UserLoginInJava(u);    
                                winston.info('New User (Google) : { id: ' + u.USERID + ', username: ' + u.USERNAME + ' }');
                                winston.info('New Login (Google) : { id: ' + l.userId + ', username: ' + l.username + ' }');
                                done(null, u);
                            });
                        }
                        
                    });
                } else {
                    db.User.update({
                        provider: provider,
                        openID: GoogleID
                    }, {
                      where: {EMAIL: email}
                    });
                    UserLoginInJava(user); 
                    winston.info('Login (Google) : { id: ' + user.USERID + ', username: ' + user.USERNAME + ' }');
                    done(null, user);
                }
            }).catch(function(err){
                done(err, null);
            });
        });

    }
));


function UserLoginInJava(user) {
    var USERNAME  = user.USERNAME;
    var body = '';
    var data = [];
    var url = ApiBasePath+'getUserKey/'+USERNAME;
    var options = {
        hostname: ip,
        port: '8080',
        path: url,
        method: 'GET',
        headers: headers
    };
    var req = http.request(options,function(res2){
        res2.on('data', function(chunk) {
             body += chunk;
        });
        res2.on('end', function() { 
          console.log('abc');
           var dataJson = JSON.parse(body);
            if(dataJson !== undefined){
                var key = dataJson.key;
                var UserID = dataJson.usr.userid;
                if(key !== undefined){
                  console.log('setting Local Key');
                  console.log(key);
                  console.log(UserID);
                      localStorage.setItem('key_'+UserID, key);
                      localStorage.setItem('UserID', UserID);
                }
            }
        });
    });
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
    });
    req.end();
}
module.exports = passport;
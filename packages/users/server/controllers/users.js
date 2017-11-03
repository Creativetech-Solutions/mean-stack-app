'use strict';
/**
 * Module dependencies.
 */
var db = require('../../../../config/sequelize');
var http = require('http');
var LocalStorage = require('node-localstorage').LocalStorage,
   localStorage = new LocalStorage('./scratch');
 //console.log('user server controller');
/**
 * Auth callback
 */
exports.authCallback = function(req, res) {
    console.log('user server controller authCallback');
    res.redirect('/');
};

/**
 * Show login form
 */
exports.signin = function(req, res) {
     console.log('user server controller signin');
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};


exports.login = function(req, res) {
    localStorage.removeItem('grp_cartId');
    var grp_cartId = null;
    var current_total = 0;
    var currency = 'USD';
    if(req.user){
      var user_id = req.user.USERID;
      db.Grpcart.find({where : { owner_userId: user_id }}).then(function(groupcart){

        if(!groupcart){

          console.log('Failed to Get Group Cart ID for user  ' + user_id);
        }else{

          currency      = groupcart.currency; 
          grp_cartId    = groupcart.grp_cartId;
          current_total = groupcart.current_total;
          
          localStorage.setItem('grp_cartId_'+user_id,grp_cartId);   
          localStorage.setItem('current_total_'+grp_cartId,current_total);   
          localStorage.setItem('currency_'+grp_cartId,currency);   

        }
      }).catch(function(err){
          console.log('error');
          console.log(err);
      });
    }
    res.json({
        user: req.user,
        redirect: req.get('referer')
    });
};

/**
 * Show sign up form
 */
exports.signup = function(req, res) {
     localStorage.removeItem('grp_cartId');
    console.log('user server controller signup');
    res.render('users/signup', {
        title: 'Sign up',
    });
};

/**
 * Logout
 */
exports.signout = function(req, res) {
   localStorage.removeItem('grp_cartId');
    console.log('Logout: { USERID: ' + req.user.USERID + ', USERNAME: ' + req.user.USERNAME + '}');
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function(req, res) {
    console.log('user server controller session');

    res.redirect('/');
};

/**
 * Create user
 */
exports.create = function(req, res) {
    console.log('create server controller user.js ');
   // console.log(req.body);
    var user = db.User.build(req.body);
    var login = db.Login.build(req.body);
    console.log('create server controller user.js db.User.build');
    //console.log(user);

    user.provider = 'local';
    user.salt = user.makeSalt();
    user.hashedPassword = user.encryptPassword(req.body.PASSWORD, user.salt);

    login.role = 'U';
    login.username = user.USERNAME;
    login.password = user.hashedPassword;

    user.save().then(function(user){
      console.log('New User (local) : { USERID: ' + user.USERID + ' USERNAME: ' + user.USERNAME + ' }');

      login.userId = user.USERID;

      login.save().then(function(){
        req.logIn(user, function(err){
          console.log(err);
          if(err) {
            console.log(err);
            return res.status(400).json(err);
          }

          res.json(user);
        });
      }).catch(function(err){
          console.log(err);
          res.status(400).json(err);
      });
    }).catch(function(err){
        console.log(err);
        res.status(400).json(err);
    });
};

/**
 * Send User
 */
exports.me = function(req, res) {
    console.log('user server controller me');

    res.jsonp(req.user || null);
};

/**
 * Find user by USERID
 */
exports.user = function(req, res, next, USERID) {
    console.log('user server controller user');

    db.User.find({where : { USERID: USERID }}).then(function(user){
      if (!user) {
        return next(new Error('Failed to load User ' + USERID));
      }
      req.profile = user;
      next();
    }).catch(function(err){
      next(err);
    });
};

/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    console.log('user server controller requiresLogin');

    if (!req.isAuthenticated()) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function(req, res, next) {
    if (req.profile.USERID !== req.user.USERID) {
      return res.send(401, 'User is not authorized');
    }
    next();
};


/**
 * Save User authorizations key for Java Use
 */
exports.SaveUserKey = function(req, res){
  var user_id = req.body.UserID;
  var key = req.body.key;
  console.log(key);
  console.log(user_id);
  if (user_id) {
        console.log('logged in user runs ');
        console.log(user_id);
        localStorage.setItem('key_'+user_id,key); 
    } else {
        //not logged in
        console.log('not logged in user runs why ');
        localStorage.setItem('key',key);
    }
      
   return res.send(200, 'Key Added To Session '+key);        
 };
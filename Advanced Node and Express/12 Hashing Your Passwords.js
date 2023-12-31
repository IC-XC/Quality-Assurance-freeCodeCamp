'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');



const app = express();

//01 Set up a Template Engine
app.set('view engine', 'pug');
app.set('views', './views/pug');

//03 Set up Passport
//Secrets -> Key: SESSION_SECRET , Value: ****
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

app.use(passport.initialize());
app.use(passport.session());


fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//05 Implement the Serialization of a Passport User
myDB(async client => {
    const myDataBase = await client.db('database').collection('users');
    app.route('/').get((req, res) => {
        res.render('index', {title: 'Connected to Database',message: 'Please login', showLogin: true, showRegistration: true});  
        //02 Use a Template Engine's Powers => Change the response to render the Pug template
        //11 Registration of New Users
        //12 Hashing Your Passwords
    });

  //07 How to Use Passport Strategies
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  })

  app.route('/profile').get(ensureAuthenticated,(req,res) => {
    res.render('profile', { username: req.user.username }); //09 How to Put a Profile Together
  })

  //10 Logging a User Out
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  //11 Registration of New Users
  app.route('/register').post((req, res, next) => {
    const hash = bcrypt.hashSync(req.body.password, 12);
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: req.body.password
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  //06 Authentication Strategies
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) { 
        return done(null, false); //12 Hashing Your Passwords
      }
        return done(null, user);
    });
  }));

  //04 Serialization of a User Object
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, doc) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
})

.catch(e => {
    app.route('/').get((req, res) => {
      res.render('index', { title: e, message: 'Unable to connect to database' });
    });
});

//08 Create New Middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});


//10 Logging a User Out
app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
});









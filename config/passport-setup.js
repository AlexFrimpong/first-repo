const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./keys');
const googleUsers = require('../models/googleUsers');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser((id, done) => {
	googleUsers.findById(id).then((user) => {
		done(null, user);
	});
});

passport.use(
	new GoogleStrategy({
		// options for google strategy
		clientID: keys.google.clientID,
		clientSecret: keys.google.clientSecret,
		callbackURL: '/Auth/google/redirect'
	}, (accessToken, refreshToken, profile, done) => {
		// check if user already exists in our own db
		googleUsers.findOne({ googleId: profile.id }).then((currentUser) => {
			if (currentUser) {
				// already have this user
				console.log('user is: ', currentUser);
				done(null, currentUser);
			} else {
				// if not user, create user in our db
				new googleUsers({
					googleId: profile.id,
					username: profile.displayName
				}).save().then((newUser) => {
					console.log('created new user: ', newUser);
					done(null, newUser);
				});
			}
		});
	})
);

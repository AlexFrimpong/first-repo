const router = require('express').Router();
const passport = require('passport');

// auth login
router.get('/login', (req, res) => {
	res.redirect('/');
});

router.get('/logout', (req, res, next) => {
	req.logout((err) => {
		if (err) { return next(err); }
		req.flash('success_msg', 'You are logged out');
		res.redirect('/');
	});
});

//authenticate with google+
router.get('/google', passport.authenticate('google', {
	scope: ['profile']
}));

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
	res.redirect('/');
});

module.exports = router;
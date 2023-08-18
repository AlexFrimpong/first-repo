const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const { PASSWORD, EMAIL } = require('../config/keys');

//User validation
// To ensure that users type in correct data during the registration
function UserRegisterValidation() {
  return [
    body('lastName')
      .isLength({ min: 4 })
      .withMessage('username must be at least 4 characters long')
      .isLength({ max: 20 })
      .withMessage(' username must be less than 20 characters long')
      .exists()
      .withMessage('username is required')
      .trim()
      .matches(/^[A-Za-z0-9\_]+$/)
      .withMessage('username must be alphanumeric only')
      .escape(),
    body('email').isEmail().normalizeEmail().withMessage('Invalid Email')
      .exists(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Please your password must be at least 8 characters long')
      .isLength({ max: 30 })
      .withMessage('Please your password must be at maximum 30 characters long')
      .matches(/\d/)
      .withMessage('Please your password must contain a number')
      .exists({ checkFalsy: true }).withMessage('Please you must type a password'),
    body('confirmPassword')
      .exists({ checkFalsy: true }).withMessage('Please you must type a confirmation password')
      .custom((value, { req }) => value === req.body.password).withMessage("The passwords do not match")

  ];
}
// Registering new users to the server 
router.post('/signup', UserRegisterValidation(), async (req, res, next) => {

  try {
    const errors = validationResult(req);
    const { name, email, password, confirmPassword } = req.body;

    if (!errors.isEmpty()) {

      return res.status(400).json({
        errors: errors.array()
      });

    } else {
      await User.findOne({ email: email }).then(user => {
        if (user) {
          throw Error('That email is already registered');
        } else {
          const newUser = new User({
            name,
            email,
            password
          });
          // Encrypting the user password to ensure security
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw Error('Something ent wrong when trying to register');
              newUser.password = hash;
              newUser
                .save()
                .then(user => {
                  req.flash(
                    'success_msg',
                    'You are now registered and can log in'
                  );
                  //res.redirect('/users/login');
                })


            });
          });

        }
      });
    }
  }
  catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message })
  }
})


// log in
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Log out
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
});


// Forgot Password Page
router.get('/forgot-password', function (req, res) {
  res.render('forgotPassword', { title: 'Forgot Password Page' });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    //checking to see if the user truly has an account in the database
    const user = await User.findOne({ email: email });
    if (!user) return res.status(400).send("User doesn't exist");

    // creating token using jwt
    const token = jwt.sign({ email: user.email, _id: user._id }, 'secretKey', {
      expiresIn: "15m",
    });

    // generate password reset link using token and id
    const link = `http://localhost:3000/users/reset-password/${user._id}/${token}`;
    await user.updateOne({ resetLink: token });

    // Sending email link to reset password when a user request for password reset
    let transporter = nodemailer.createTransport({
      service: "Gmail",
      port: 587,
      secure: false,
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });
    let msg = {
      from: "alexfrimp@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Please click on the link to reset/change your password if you are the one ho requested for password reset: + link + </p>`,
    };
    transporter.sendMail(msg, (err, info) => {
      if (err) {
        console.log('Something went wrong', err);
        res.redirect('/forgot-password');
      }
      else if (info) {
        console.log('You have successfully changed your password', info);
        res.redirect('/login');
      }
    })
  }
  catch (err) {
    res.status(400).json(err);
  }
});


router.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  // Check if ID is valid
  const user = await User.findById({ _id: id });
  if (!user)
    return res.status(400).send("User doesn't exist");

  try {
    const verify = jwt.verify(token, 'secretKey');
    if (verify) {
      res.render("reset-password", { title: 'Password Reset Page', id: id, token: token });
    }
    else {
      res.redirect("/forgot-password")
    }

  } catch (err) {
    res.status(400).json(err);
  }
});


router.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password, password2 } = req.body;

  const user = await User.findOne({ _id: id });
  if (!user) return res.status(400).send("User doesn't exist");

  try {
    const verify = jwt.verify(token, 'secretKey');
    const password = password2;
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.json(err);
      bcrypt.hash(password2, salt, async (err, hash) => {
        await User.findByIdAndUpdate(id, { password: hash }, { new: true });
        res.send("Password is updated!");
      });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

module.exports = router;
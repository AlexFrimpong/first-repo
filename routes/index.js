const express = require('express');
const router = express.Router();
const { isClient, isAdmin } = require('../config/auth');

// Welcome Page
router.get('/', (req, res) => res.render('welcome', { title: 'Home Page' }));

// Dashboard
router.get('/dashboard', isAdmin || isClient, (req, res) =>
  res.render('dashboard', {
    user: req.user
  })
);

module.exports = router;

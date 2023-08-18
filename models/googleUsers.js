const mongoose = require('mongoose');

const googleSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	googleId: {
		type: String,
		required: true
	},
	role: {
		type: String,
		enum: ['admin', 'basic'],
		required: true
	}
});

const googleUser = googleSchema;
module.exports = mongoose.model('client', googleUser); 
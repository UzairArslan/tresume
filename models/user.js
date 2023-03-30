const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, 'Email/Username should be unique']
    },
    firstName: {
        type: String,
        require: [true, 'Firstname is required']
    },
    lastName: {
        type: String,
        require: [true, 'Lastname is required']
    },
    pdf: {
        fileId: String,
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
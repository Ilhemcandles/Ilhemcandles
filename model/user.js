const mongoose = require("mongoose");
const passportlocalmongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const cart = require('./cart')

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        unique: false
    },
    lastname: {
        type: String,
        required: true,
        unique: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    Phone: {
        type: Number,
        required: false

    },
    verificationCode: {
        type: String,
        required: false // You can make this optional if you prefer
    },
    isverified: {
        type: Boolean,
        required: false
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    Cartitems: [{
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    }]
});

userSchema.plugin(passportlocalmongoose);

module.exports = mongoose.model("user", userSchema);
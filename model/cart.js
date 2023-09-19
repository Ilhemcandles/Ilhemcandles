const { number } = require('joi');
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const user = require('./user')
const Cartitems = new Schema({
    title: String,
    price: String,
    picture: String,
    categorie: String,
    Qte: Number,
    totalprice: Number,
    color: [{
        type: String,
        required: true
    }],
    verifiedaccount: Boolean,
    Commandconfirmed: Boolean,
    status: String,
    cartid: Number,
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
});

module.exports = mongoose.model("Cart", Cartitems);
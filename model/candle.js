const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const candleSchema = new Schema({
    title: String,
    price: String,
    picture: String,
    categorie: String
});

module.exports = mongoose.model("Candle", candleSchema);
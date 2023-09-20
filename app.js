if (process.env.Node_ENV !== "production") {
    require('dotenv').config();
}
const mongosanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const { isloggedin } = require('./utility/isloggedin');
const mongoose = require('mongoose');
const joi = require('joi');
const ExpressError = require("./utility/ExpressError");
const catchAsync = require('./utility/catchAsync');
const { validateschema, cartSchema } = require("./validateschema");
const Candle = require('./model/candle');
const session = require("express-session");
const resgisterroute = require('./routes/register');
const handleproduct = require('./routes/products');
const passport = require("passport");
const localpassport = require("passport-local");
const User = require("./model/user");
const cart = require('./model/cart');

const override = require('method-override');
const flash = require('connect-flash');

const MongoDBStore = require('connect-mongodb-session')(session);
const dburl = process.env.DB_URL
mongoose.connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,

});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const app = express();
let productsincart = 0;


// Catch errors if session store fails to connect

const scriptSrcUrls = [
    "https://code.jquery.com",
    "https://cdn.jsdelivr.net",
    "https://stackpath.bootstrapcdn.com",
    "https://stackpath.bootstrapcdn.com"
];
const stylesSrcUrls = [
    "http://www.w3.org",
    "https://stackpath.bootstrapcdn.com",
    "https://fonts.gstatic.com",
    "https://fonts.googleapis.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net/"
];
const connectSrcUrls = [
    "https://cdn.jsdelivr.net",
    "https://stackpath.bootstrapcdn.com"
]
const fontSrcUrls = [
    "https://fonts.gstatic.com",
    "https://fonts.googleapis.com",
    "https://cdnjs.cloudflare.com",
    "https://stackpath.bootstrapcdn.com"
];

// Middleware Setup
const mysecret = process.env.SECRET || 'thisismehdiselkasecret';
app.use(express.urlencoded({ extended: true }));
const Store = new MongoDBStore({
    url: dburl,
    mysecret,
    touchAfter: 24 * 60 * 60,
});
Store.on("error", function (e) {
    console.log("store error", e)
})
const sessionconfig = {
    Store,
    name: "session",
    mysecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 12,
        maxAge: 1000 * 60 * 60 * 24
    }
};

app.use(session(sessionconfig));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'unsafe-inline'", "'self'", ...stylesSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
            "'self'",
            "blob:",
            "data:",
            "https://res.cloudinary.com/dgs4gikav/",
        ],
        fontSrc: ["'self'", ...fontSrcUrls]
    }
}))
app.use(express.static('css'));
app.use(override('_method'));
app.use(cookieParser());

passport.use(new localpassport(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// EJS Template Engine
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));

// Custom Middleware
app.use(async (req, res, next) => {
    if (!['/login', '/', "/favicon.ico", "/register"].includes(req.originalUrl)) {
        req.session.returnTo = req.originalUrl;
    }
    res.locals.currentUser = req.user;
    if (req.isAuthenticated() && req.user) { // Check if user is authenticated and req.user is defined
        const cartsuser = await User.findOne({ username: req.user.username }).populate({
            path: 'Cartitems',
            match: { Commandconfirmed: false } // Filter Cartitems by Commandconfirmed
        });
        if (cartsuser) {
            productsincart = cartsuser.Cartitems.length;
            res.locals.productsincart = productsincart;
        }
    }

    res.locals.succes = req.flash('succes');
    res.locals.error = req.flash('error');
    next();
});





const deleteUnverifiedUsers = () => {
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    User.deleteMany({ isverified: false, createdAt: { $lte: thresholdDate } })
        .then(result => {
            console.log(`Deleted ${result.deletedCount} unverified users.`);
        })
        .catch(error => {
            console.error('Error deleting unverified users:', error);
        });
};
cron.schedule('0 */12 * * *', deleteUnverifiedUsers);
// Routes
app.use('/', resgisterroute);

app.use('/', handleproduct);
app.get('/about', catchAsync(async (req, res, next) => {
    res.render('about', { activePage: "about" });
}))
app.get('/products', catchAsync(async (req, res, next) => {
    const candleproducts = await Candle.find({ categorie: "Candle" });
    const platreproducts = await Candle.find({ categorie: "Platre" });
    res.render("products", { candleproducts, platreproducts, productsincart, activePage: 'products' });
}))

app.get('/contact', catchAsync(async (req, res, next) => {
    const products = await Candle.find({});
    const compte = await User.find({})
    console.log(compte)
    if (req.isAuthenticated()) {
        const emailuser = await User.findOne({ username: req.user.username })

        res.render("contact", { products, productsincart, emailuser, activePage: "contact" });
    }
    else {
        res.render("contact", { products, productsincart, activePage: 'contact' });
    }
}))
app.get('/', catchAsync(async (req, res, next) => {
    if (req.isAuthenticated()) {

        const products = await Candle.find({});

        res.render("main", { products, productsincart, activePage: "home" });
    }
    else {
        const products = await Candle.find({});
        res.render("main", { products, activePage: "home" });
    }
}));

app.get('/inspect-session', (req, res) => {
    console.log(req.session);
    res.send('Session inspected. Check the server logs for details.');
});

// Error Handler Middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'error';
    res.status(statusCode).render('error', { err });
});
app.use((req, res) => {
    res.status(404).render("404", { activePage: "home" })
})
app.use(mongosanitize)

const port = process.env.Port || 3000;
app.listen(port, () => {
    console.log(`serving on port ${port}`);
});

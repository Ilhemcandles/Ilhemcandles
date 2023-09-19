const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Candle = require('../model/candle');
const passport = require('passport');
const { isloggedin } = require('../utility/isloggedin');
const validateschema = require('../validateschema');
const catchAsync = require('../utility/catchAsync');
const ExpressError = require("../utility/ExpressError");
const cart = require('../model/cart')
const mongoose = require('mongoose');
const user = require('../model/user');
const nodemailer = require('nodemailer');


function arraysEqual(arr1, arr2) {
    // Check if the arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Sort both arrays
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();

    // Compare the sorted arrays
    for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) {
            return false;
        }
    }

    return true;
}

const validateuser = (req, res, next) => {
    const { error } = validateschema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)

    }
    else {
        next()
    }

}

router.get('/cart', isloggedin, catchAsync(async (req, res, next) => {
    const itemsconfirmed = await User.findOne({ username: req.user.username })
        .populate({
            path: 'Cartitems',
            match: { Commandconfirmed: true } // Filter Cartitems by Commandconfirmed
        });
    const items = await user.findOne({ username: req.user.username }).populate('Cartitems').populate({
        path: 'Cartitems',
        match: { Commandconfirmed: false } // Filter Cartitems by Commandconfirmed
    });
    const email = await user.findOne({ username: req.user.username })
    const products = await cart.find({ Commandconfirmed: false })

    if (res.locals.productsincart) {
        const productsincart = res.locals.productsincart
        res.render('cart', { items, itemsconfirmed, productsincart, activePage: "cart" })
    }
    else {
        res.render('cart', { items, itemsconfirmed, activePage: "cart" })
    }
}));
router.post('/cart', isloggedin, catchAsync(async (req, res, next) => {
    const items = await User.findOne({ username: req.user.username })
        .populate({
            path: 'Cartitems',
            match: { Commandconfirmed: false } // Filter Cartitems by Commandconfirmed
        });
    const itemsconfirmed = await User.findOne({ username: req.user.username })
        .populate({
            path: 'Cartitems',
            match: { Commandconfirmed: true } // Filter Cartitems by Commandconfirmed
        });
    const email = await user.findOne({ username: req.user.username })
    console.log(email.email)
    const qtes = req.body.quantity;
    console.log(qtes)
    let itemsnames = items.Cartitems;
    let id = 1;
    let total = 0;
    if (!itemsconfirmed.Cartitems.length) {

        id = 1
    }
    else {
        id = itemsconfirmed.Cartitems[itemsconfirmed.Cartitems.length - 1].cartid + 1;

    }
    let text = `<h1>Here is the list of your Items</h1>`;
    for (let i = 0; i < items.Cartitems.length; i++) {
        const itemqte = await cart.findOne({
            title: items.Cartitems[i].title,
            Commandconfirmed: false
        }).populate({
            path: 'user', // Use 'user' to match the ref field
            match: { username: req.user.username } // Filter Cartitems by username
        });

        itemqte.Qte = qtes[i]
        itemqte.Commandconfirmed = true;
        itemqte.totalprice = qtes[i] * itemqte.price;
        itemqte.status = "pending";
        itemqte.cartid = id || 1;
        await itemqte.save()
        const cartItem = items.Cartitems[i];
        const newQte = qtes[i];
        cartItem.Qte = newQte;
        cartItem.Commandconfirmed = true;
        text += `<h3>${itemqte.title}:${itemqte.totalprice}DA  </h3>`
        total += itemqte.totalprice;



    }
    await items.save();
    //for (let i = 0; i < items.Cartitems.length; i++) {
    // console.log(items.Cartitems[i]);
    // }
    text += `<h2>The total price to pay for all those products is $${total} Da, plus the transportation amount which depends on your location.</h2>
    `
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,

        auth: {
            user: 'ilhemcandles@gmail.com',
            pass: 'bunqfollwsglhbqx'
        }
    });


    const info = await transporter.sendMail({
        from: 'ilhemcandles@gmail.com',
        to: email.email,
        subject: 'Your command ',
        html: text

    });
    const info2 = await transporter.sendMail({
        from: 'ilhemcandles@gmail.com',
        to: 'ilhemcandles@gmail.com',
        subject: `the command of ${email.username} : ${email.Phone} `,
        html: text

    });
    //console.log("message sent " + info.messageId)
    res.redirect('/')
}));
router.post("/delete/:itemTitle", isloggedin, catchAsync(async (req, res, next) => {
    const itemTitle = req.params.itemTitle;
    const deleteitem = await cart.findOneAndDelete({ title: itemTitle, Commandconfirmed: false }).populate({
        path: 'user', // Use 'user' to match the ref field
        match: { username: req.user.username } // Filter Cartitems by username
    });



    res.redirect("/cart");
}));
router.post("/contact", catchAsync(async (req, res, next) => {
    const { name, email, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,

        auth: {
            user: 'ilhemcandles@gmail.com',
            pass: 'bunqfollwsglhbqx'
        }
    });


    const info = await transporter.sendMail({
        from: 'ilhemcandles@gmail.com',
        to: 'ilhemcandles@gmail.com',
        subject: subject,
        html: `<h1>Message from ${email}</h1>
        <p>${message}</p>`

    });
    const info2 = await transporter.sendMail({
        from: 'ilhemcandles@gmail.com',
        to: email,
        subject: subject,
        html: `<h1>Dear ${name}</h1>
        <p>We have received your message and we are going to ensure that the message you sent will be handled properly. We will get back to you very soon.</p>
        `

    });
    req.flash("succes", "message has been sent correctly")
    res.redirect("/")
}))
router.get('/product/:id', isloggedin, async (req, res, next) => {
    const candy = await Candle.findById(req.params.id);
    if (res.locals.productsincart) {
        const productsincart = res.locals.productsincart;
        res.render('product', { candy, productsincart, activePage: "products" })
        req.flash("succes", "product added to your cart succefully");
    }
    else {
        res.render('product', { candy, activePage: "products" })
        req.flash("succes", "product added to your cart succefully");
    }

})
router.post('/product/:id', isloggedin, catchAsync(async (req, res, next) => {
    const candleId = req.params.id;
    const candy = await Candle.findById(candleId);
    const { title, price, picture, categorie } = candy;
    const qte = req.body.quantity;
    const productname = req.body.title
    const colors = req.body.color

    const total = qte * price
    const thisuser = await User.findOne({ username: req.user.username }).populate('Cartitems');
    let productalreadyexist = false;
    let identicalcolors = false;
    for (i = 0; i < thisuser.Cartitems.length; i++) {
        if (colors[0].length === 1) {
            if (colors == thisuser.Cartitems[i].color) {
                identicalcolors = true
            }

        }
        else {
            identicalcolors = arraysEqual(colors, thisuser.Cartitems[i].color)
            console.log(identicalcolors)

        }
        if (productname === thisuser.Cartitems[i].title && thisuser.Cartitems[i].Commandconfirmed === false && identicalcolors) {

            productalreadyexist = true;

        }


    }

    if (!productalreadyexist) {
        const newCartItem = new cart({
            title: title,
            price: price,
            picture: picture,
            categorie: categorie,
            Qte: 1,
            color: colors,
            Commandconfirmed: false,
            verifiedaccount: true,
            user: thisuser._id
        });

        await newCartItem.save();
        thisuser.Cartitems.push(newCartItem._id);
        await thisuser.save();
        req.flash("succes", "product added to your cart ")

    }
    else { req.flash("succes", "product already in your cart "); }
    res.redirect("/cart")

}))



module.exports = router
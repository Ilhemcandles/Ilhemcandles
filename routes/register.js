const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const User = require('../model/user');
const session = require("express-session");
const passport = require('passport');
const { connected } = require('../utility/connected')
const { isloggedin } = require('../utility/isloggedin');
const validateschema = require('../validateschema');
const catchAsync = require('../utility/catchAsync');
const ExpressError = require("../utility/ExpressError");
//const { isverified, generateVerificationCode, sendVerificationEmail } = require('../utility/isverified')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

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
let lastVerificationRequestTime = null; // Initialize to null
let verificationRequestCount = 0;
let firstcodesentinthehour = null;
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendVerificationEmail(email, verificationCode) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,

        auth: {
            user: 'ilhemcandles@gmail.com',
            pass: 'bunqfollwsglhbqx'
        }
    });

    const mailOptions = {
        from: 'ilhemcandles@gmail.com',
        to: email,
        subject: 'Email Verification',
        text: `Your verification code is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);
}
const isverified = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });

        if (!user) {
            // Handle the case where the user doesn't exist
            req.flash('error', 'User not found');

            return res.redirect('/login');
        }

        if (!user.isverified) {
            // If the account isn't verified, generate a verification code and send it
            const verificationCode = generateVerificationCode();
            await sendVerificationEmail(user.email, verificationCode);
            const saltRounds = 10;
            const hashedCode = await bcrypt.hash(verificationCode, saltRounds);
            const updated = await User.findOneAndUpdate(
                { email: user.email },
                { $set: { verificationCode: hashedCode } }
            );
            // Set a flag in the session to indicate that a new code has been sent
            req.session.newVerificationCodeSent = true;
            req.session.email = user.email
            lastVerificationRequestTime = Date.now();
            res.cookie('firstcodedouble', new Date(Date.now()), { maxAge: 60 * 60 * 1000 })
            firstcodesentinthehour = req.cookies.firstcode || req.cookies.firstcodedouble;
            console.log(user.email)
            // Redirect to the verification page
            return res.redirect('/verify');
        }

        // If the account is verified, continue with the login process
        return next();
    } catch (error) {
        console.error('Error checking verification:', error);
        req.flash('error', 'An error occurred while checking verification');
        return res.redirect('/login');
    }
};

function checkparams() {

    console.log("aaaaa", firstcodesentinthehour)
    if (!firstcodesentinthehour || verificationRequestCount <= 5 && new Date() - new Date(firstcodesentinthehour) > 60 * 60 * 1000) {
        verificationRequestCount = 1
        res.cookie('firstcode', Date.now(), { maxAge: 60 * 60 * 1000 });
    } else if (verificationRequestCount > 5) {
        verificationRequestCount = 1;
        res.cookie('firstcode', Date.now(), { maxAge: 60 * 60 * 1000 }); // Reset the 'firstcode' cookie
    }
}
// Function to check if the user is eligible to request a verification code
function isEligibleForVerificationCode() {
    const now = new Date();
    // Handle resetting verificationRequestCount and firstcode cookie

    // Check if the user has requested a code within the last 1 minute
    if (
        lastVerificationRequestTime !== null &&
        now - lastVerificationRequestTime < 60 * 1000
    ) {
        return false; // User has to wait for 1 minute before requesting again
    }

    // Check if the user has requested 5 codes within the last 5-10 minutes
    if (
        verificationRequestCount >= 5 &&
        now - lastVerificationRequestTime < 40 * 60 * 1000
    ) {
        return false; // User has to wait for 40 minutes
    }

    // If none of the above conditions apply, the user is eligible
    return true;
}
router.get('/register', connected, async (req, res) => {
    const allusernames = await User.find({});
    let users = [];
    let mails = [];
    for (i = 0; i < allusernames.length; i++) {
        users.push(allusernames[i].username)
        mails.push(allusernames[i].email)

    }
    res.render('register', { users, mails })
})
router.post('/register', catchAsync(async (req, res) => {
    try {
        const { firstname, lastname, username, Phone, email, password } = req.body;
        const verificationCode = generateVerificationCode();
        console.log(Phone)
        const saltRounds = 10;
        const hashedCode = await bcrypt.hash(verificationCode, saltRounds);
        const user = new User({ firstname, lastname, username, email, Phone, verificationCode: hashedCode, isverified: false });
        req.session.email = email
        const registration = await User.register(user, password);
        req.flash("succes", "Account created succesfully");
        await sendVerificationEmail(email, verificationCode);

        // Store the email in the session
        req.session.email = email;
        req.session.save();

        verificationRequestCount++;
        const expirationTime = new Date(Date.now() + 60 * 1000); // Set expiration time to one minute from now
        res.cookie('firstcode', new Date(Date.now()), { maxAge: 60 * 60 * 1000 })
        res.cookie('verificationCodeExpiration', expirationTime, { maxAge: 60 * 1000 });
        lastVerificationRequestTime = Date.now();
        firstcodesentinthehour = req.cookies.firstcode

        res.redirect('/verify')
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('register');
        console.log(e)
    }

}))
router.post('/resend-verify', catchAsync(async (req, res) => {
    // Check if the user is eligible
    if (isEligibleForVerificationCode()) {
        // Generate and send the new verification code
        const newVerificationCode = generateVerificationCode();
        const saltRounds = 10;
        const hashedCode = await bcrypt.hash(newVerificationCode, saltRounds);
        const userEmail = req.session.email;
        sendVerificationEmail(userEmail, newVerificationCode);
        const updated = await User.findOneAndUpdate(
            { email: userEmail },
            { $set: { verificationCode: hashedCode } }
        );
        // Update the variables
        console.log(lastVerificationRequestTime)
        lastVerificationRequestTime = new Date();
        verificationRequestCount++;
        console.log(verificationRequestCount)
        const expirationTime = new Date(Date.now() + 60 * 1000); // Set expiration time to one minute from now
        res.cookie('verificationCodeExpiration', expirationTime, { maxAge: 60 * 1000 });
        // Set the cookie

        req.flash('succes', "New code verification has been sent")
        res.redirect('/verify'); // You can send a response back to the user
    } else {
        req.flash("error", "A verification code has already been sent a while ago ")
        res.redirect('/verify') // You can customize this message
    }
}));
router.get('/verify', connected, (req, res) => {
    const email = req.session.email;
    const expirationTime = req.cookies.verificationCodeExpiration;
    if (expirationTime && new Date() < new Date(expirationTime)) {
        const remainingTime = new Date(expirationTime) - new Date();
        const { verificationCode } = req.body;
        console.log(verificationCode)
        res.render('verify', { email, remainingTime });
    }
    else {
        let remainingTime = 0
        const { verificationCode } = req.body;
        console.log(verificationCode)
        res.render('verify', { email, remainingTime });
    }

});
router.post('/verify', catchAsync(async (req, res) => {
    try {
        const { verificationCode } = req.body;
        console.log(verificationCode)
        // Retrieve the email from the session
        const email = req.session.email;
        console.log(email)
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            // Handle the case where the user does not exist
            req.flash('error', 'User not found');
            res.redirect('/verify'); // Redirect back to the verification code input form
        } else {
            // Compare the entered code with the hashed code in the user's document
            const codeMatch = await bcrypt.compare(verificationCode, user.verificationCode);

            if (codeMatch) {
                // Update the user's isverified field to true
                user.isverified = true;
                await user.save();

                req.flash('succes', 'Email verification successful. You can now log in.');
                res.redirect('/login');
            } else {
                // Handle the case where the entered code is incorrect
                req.flash('error', 'Incorrect verification code');
                res.redirect('/verify'); // Redirect back to the verification code input form
            }
        }
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/verify'); // Redirect back to the verification code input form
    }
}));

router.get('/login', connected, (req, res) => {
    const back = req.session.returnTo;
    req.session.back = req.session.returnTo
    res.render('login', { back })

})
// In your POST /login route
router.post('/login', isverified, passport.authenticate('local', { failureRedirect: '/login' }), (req, res, next) => {
    req.flash("succes", "Welcome back");
    const back = req.body.back
    const redirectUrl = back || '/';

    res.redirect(redirectUrl);
});

router.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            // Handle any error that occurred during the logout process
            console.error('Logout error:', err);
            // You can respond with an error page or redirect to a specific error page
            return res.redirect('/error');
        }
        // The logout process is successful, set the flash message and redirect to the home page
        req.flash('succes', 'Goodbye!');
        res.redirect('/');
    });
});

module.exports = router;
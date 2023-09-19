const User = require('../model/user')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendVerificationEmail(email, verificationCode) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,

        auth: {
            user: 'chakibselka164@gmail.com',
            pass: 'ufsvbubdzymrluyo'
        }
    });

    const mailOptions = {
        from: 'chakibselka164@gmail.com',
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

module.exports = { isverified, generateVerificationCode, sendVerificationEmail };

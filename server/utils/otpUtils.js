const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ak6474100857@gmail.com',
        pass: 'tpgi oqei kaiy njog'
    }
});

module.exports = {
    generateOTP: (length) => {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < length; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }
        return OTP;
    },
    sendOTP: async (email, otp) => {
        try {
            const mailOptions = {
                from: 'ak6474100857@gmail.com', 
                to: email,
                subject: 'Your Timeless Motors Verification Code',
                html: `
                    <h1>Welcome to Timeless Motors!</h1>
                    <p>Your verification code is: <b>${otp}</b></p>
                    <p>This code will expire in 1 minute.</p> 
                ` 
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('OTP email sent:', info.response);

        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw error; 
        }
    }
}
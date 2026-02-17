const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

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
            const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                subject: 'Your Timeless Motors Verification Code',
                html: `
                    <h1>Welcome to Timeless Motors!</h1>
                    <p>Your verification code is: <b>${otp}</b></p>
                    <p>This code will expire in 1 minute.</p> 
                `
            });

            if (error) {
                console.error('Error sending OTP email:', error);
                throw error;
            }

            console.log('OTP email sent:', data?.id);
        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw error;
        }
    }
};

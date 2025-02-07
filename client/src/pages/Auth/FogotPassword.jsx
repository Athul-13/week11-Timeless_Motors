import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '../../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      
      if (!otpSent) {
        const response = await authService.resendOTP(email);
        if (response.success) {
          toast.success('OTP sent successfully');
          setOtpSent(true);
        }
      } else {
        const response = await authService.verifyForgotPasswordOTP({email, otp});
        if(response.success) {
            toast.success('OTP verified')
            navigate('/change-password', {state:{email}});
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to send OTP');
    }
  };

  const handleResendOTP = async () => {
    if (timer === 0) {
      try {
        const response = await authService.resendOTP(email);
        if (response.success) {
          toast.success('OTP resent successfully');
          setTimer(60);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to resend OTP');
      }
    }
  };

  return (
    <>
      <Toaster position="top-center"/>

      <header className="bg-gray-200 w-full py-4 text-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">Timeless Motors</Link>
      </header>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white w-full max-w-md mx-auto p-6 rounded-md shadow-md">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
            <p className="text-gray-500 mb-6">
              Enter the email address associated with your account
            </p>

            <div className="space-y-4">
              <input
                type="email"
                id="email"
                value={email}
                placeholder="Email Address*"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
                required
                disabled={otpSent}
              />

              {otpSent && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      placeholder="Enter OTP*"
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
                      required
                    />
                    <span className="ml-2 text-gray-500">
                      {timer > 0 ? `${timer}s` : ''}
                    </span>
                  </div>
                  {timer === 0 && (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
              >
                {!otpSent ? 'Send OTP' : 'Verify OTP'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm mt-4 text-gray-500">
            <Link to="/login" className="font-bold text-black hover:underline">
              Back to Log In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
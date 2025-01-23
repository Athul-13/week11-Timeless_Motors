import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../utils/api";
import toast,{Toaster} from 'react-hot-toast';

export default function VerifyOTP () {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const [isResending, setIsResending] = useState(false);

    const navigate = useNavigate();

    const handleChange = (event) => {
        setOtp(event.target.value);
    };

    const handleResendOTP = async () => {
        try {
            // Don't allow resend if timer is still running
            if (timer > 0) {
                return;
            }

            setIsResending(true);
            const signupData = JSON.parse(localStorage.getItem('signupData'));
            
            if (!signupData) {
                toast.error('Signup data not found. Please signup again.');
                navigate('/signup');
                return;
            }

            const response = await authService.resendOTP(signupData.email);
            
            if (response.success) {
                toast.success('OTP resent successfully');
                setTimer(60); // Reset timer
                setOtp(''); // Clear OTP input
            } else {
                toast.error(response.message || 'Failed to resend OTP');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try{
            const signupData = JSON.parse(localStorage.getItem('signupData'));
        
            if (!signupData) {
              toast.error('Signup data not found. Please signup again.');
              navigate('/signup'); 
              return;
            }
  
            const verificationData = {
                ...signupData,
                otp: otp
            }  

            const response = await authService.verifyOTP(verificationData);

            if(response.success) {                
                localStorage.removeItem('signupData'); 
                toast.success('Verification successful! You can now log in.');
                navigate('/login'); 
              } else {
                toast.error(response.message || 'Invalid OTP. Please try again.');
              }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
          }
    };

    useEffect(() => {
        if(timer === 0) return;
        const timerId = setInterval(() => {
            setTimer(prev => prev-1);
        }, 1000);

        return () => clearInterval(timerId);
    },[timer])

    return (
        <>

            <Toaster 
            position="top-center" 
            toastOptions={{
                success: {
                style: {
                    background: '#4BB543', 
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    padding: '16px 24px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                },
                icon: '✔',               
                duration: 3000,          
                // Add progress bar to success
                progress: {
                    duration: 3000, 
                    style: {
                    backgroundColor: '#FFFFFF', 
                    height: '4px' 
                    }
                }
                },
                error: {
                style: {
                    background: '#FF3333',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    padding: '16px 24px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' 
                },
                icon: '✖',
                duration: 3000,          
                // Add progress bar to error         
                progress: {
                    duration: 3000,
                    style: {
                    backgroundColor: '#FFFFFF',
                    height: '4px' 
                    }
                } 
                }
            }}
            /> 

            {/* Header */}
            <header className="bg-gray-200 w-full py-4 text-center">
                <Link to="/" className="text-2xl font-bold text-gray-800">Timeless Motors</Link>
            </header>
            <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
                <div className="bg-white w-full max-w-sm p-6 rounded-md shadow-lg">
                    <h2 className="text-xl font-semibold text-center text-gray-800">
                        We sent you a code
                    </h2>
                    <p className="text-center text-gray-600 mt-2">
                        Your One Time Password (OTP) has been sent to your email
                    </p>
                    <p className="text-center text-gray-600 mt-2">
                        expires in {timer}s
                    </p>
                    <form className="mt-6" onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                id="OTP"
                                name="OTP"
                                value={otp}
                                placeholder="Please enter your code*"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                        </div>
                        <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                                Did not receive OTP?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={timer > 0 || isResending}
                                    className={`${
                                        timer > 0 || isResending
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-blue-600 hover:underline'
                                    } focus:outline-none`}
                                >
                                    {isResending ? 'Resending...' : 'Resend'}
                                </button>
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md mt-4 hover:bg-gray-700 focus:ring-2 focus:ring-gray-600"
                        >
                            Verify OTP
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import {setCredentials} from '../redux/authSlice'
import { authService } from "../utils/api";

import toast, {Toaster} from 'react-hot-toast';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login({email, password});

      dispatch(setCredentials({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data._id,
          first_name: data.first_name,
          last_name: data.last_name,
          profilePicture: data.profile_picture,
          phone_no: data.phone_no,
          email: data.email,
          status: data.status,
          role: data.role
        }
      }));
      const from = data.role === 'admin' ? '/admin' : '/homePage';
      navigate(from, {replace: true})
    } catch (err) {
      toast.error(err.response?.data?.message || 'login failed')
    }
  }

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

    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">


      {/* Form container */}
      <div className="bg-white w-full max-w-md mx-auto p-6 rounded-md shadow-md">
        {/* Tabs */}
        <div className="flex justify-between border-b mb-6">
          <Link to="/signup" className="text-lg font-bold text-gray-500 pb-2">
            Sign UP
          </Link>
          <button className="text-lg font-bold border-b-2 border-black pb-2">
            Log In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">Log In</h2>
          <div className="space-y-4">
            {/* Email Address */}
            <input
              type="email"
              id="email"
              value={email}
              placeholder="Email Address*"
              onChange={(e)=> setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                placeholder="Password*"
                onChange={(e)=> setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button className="text-sm font-bold text-gray-500 hover:underline">
                Forgot password?
              </button>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              className="w-full py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
            >
              Log In
            </button>
          </div>

          {/* Terms and Conditions */}
          <p className="text-xs text-gray-500 mt-4">
            By logging in, you agree to the{" "}
            <span className="font-bold">Terms and Conditions</span> and{" "}
            <span className="font-bold">Privacy Policy</span>.
          </p>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Login Button */}
        <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="Google Logo"
            className="w-5 h-5 mr-2"
          />
          <span>Log In with Google</span>
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm mt-4 text-gray-500">
          Need an Account?{" "}
          <button className="font-bold text-black hover:underline">Sign Up</button>
        </p>
      </div>
    </div>
    </>
  );
};

export default LoginForm;

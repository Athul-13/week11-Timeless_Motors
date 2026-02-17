import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../utils/api";
import toast, { Toaster } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useDispatch } from "react-redux";
import { setCredentials } from "../../redux/authSlice";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import { signupSchema } from "../../utils/validationSchema";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, dirtyFields, isValid }, 
    watch 
  } = useForm({
    resolver: joiResolver(signupSchema),
    mode: "onChange"
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      const otpResponse = await authService.sendOTP(formData);

      if(otpResponse.success) {
        localStorage.setItem('signupData', JSON.stringify(formData));
      }
      
      navigate('/verifyOTP');
    } catch (error) {
      console.error('signup error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation indicators
  const ValidationIndicator = ({ field }) => {
    const value = watch(field);
    const isDirty = dirtyFields[field];
    const hasError = !!errors[field];
    
    if (!isDirty) return null;
    
    return (
      <div className="absolute right-12 top-1/2 -translate-y-1/2">
        {hasError ? (
          <XCircle size={16} className="text-red-500" />
        ) : (
          <CheckCircle size={16} className="text-green-500" />
        )}
      </div>
    );
  };

  // google signup
  const GoogleSignUp = () => {
    const handleGoogleSuccess = async (credentialResponse) => {
      try {
        console.log('Google response:', credentialResponse); 
        const response = await authService.googleAuth(credentialResponse.credential);
        if (response.success) {
          dispatch(setCredentials({
              token: response.token,
              user: response.user
          }));
          navigate('/homePage');
        }
      } catch (error) {
        toast.error('Google sign in failed');
        console.error('Google sign in error:', error);
      }
    };

    return (
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => {
          toast.error('Google sign in failed');
        }}
        useOneTap
        theme="outline"
        shape="rectangular"
        text="signup_with"
        className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-50 active:bg-gray-200 transition-all"
      />
    );
  };

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
            <button className="text-lg font-bold border-b-2 border-black pb-2">
              Sign UP
            </button>
            <Link to="/login" className="text-lg font-bold text-gray-500 pb-2">
              Log In
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <h2 className="text-xl font-bold mb-4">Sign Up</h2>
            <div className="space-y-4">
              {/* First Name */}
              <div className="relative">
                <input
                  type="text"
                  id="first_name"
                  placeholder="First Name*"
                  className={`w-full px-4 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-gray-800`}
                  {...register("first_name")}
                />
                <ValidationIndicator field="first_name" />
                {errors.first_name && (
                  <div className="absolute left-0 -bottom-8 bg-red-100 text-red-700 text-xs p-1 rounded shadow-md z-10">
                    {errors.first_name.message}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="relative">
                <input
                  type="text"
                  id="last_name"
                  placeholder="Last Name*"
                  className={`w-full px-4 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-gray-800`}
                  {...register("last_name")}
                />
                <ValidationIndicator field="last_name" />
                {errors.last_name && (
                  <div className="absolute left-0 -bottom-8 bg-red-100 text-red-700 text-xs p-1 rounded shadow-md z-10">
                    {errors.last_name.message}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="relative">
                <input
                  type="tel"
                  id="phone_no"
                  placeholder="Phone number*"
                  className={`w-full px-4 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-gray-800`}
                  {...register("phone_no")}
                />
                <ValidationIndicator field="phone_no" />
                {errors.phone_no && (
                  <div className="absolute left-0 -bottom-8 bg-red-100 text-red-700 text-xs p-1 rounded shadow-md z-10">
                    {errors.phone_no.message}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  placeholder="Email Address*"
                  className={`w-full px-4 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-gray-800`}
                  {...register("email")}
                />
                <ValidationIndicator field="email" />
                {errors.email && (
                  <div className="absolute left-0 -bottom-8 bg-red-100 text-red-700 text-xs p-1 rounded shadow-md z-10">
                    {errors.email.message}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password*"
                  className={`w-full px-4 py-2 border border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-gray-800`}
                  {...register("password")}
                />
                <ValidationIndicator field="password" />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && (
                  <div className="absolute left-0 -bottom-8 bg-red-100 text-red-700 text-xs p-1 rounded shadow-md z-10">
                    {errors.password.message}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 pt-4">
                At least 8 characters, 1 uppercase letter, 1 number & 1 symbol
              </p>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2 pt-4">
                <input 
                  type="checkbox" 
                  id="termsAccepted" 
                  className="w-5 h-5 text-gray-800 border-gray-300 rounded" 
                  {...register("termsAccepted")}
                />
                <label htmlFor="termsAccepted" className="text-sm text-gray-600">
                  I have read and agree to the{" "}
                  <span className="font-bold">Terms and Conditions</span> and{" "}
                  <span className="font-bold">Privacy Policy</span>.
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="text-red-500 text-sm">{errors.termsAccepted.message}</p>
              )}


              {/* Sign-Up Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className={`w-full py-2 ${isValid ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-400'} text-white font-bold rounded transition-colors mt-6`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner-border animate-spin w-4 h-4 border-t-2 border-white rounded-full" />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign Up'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Google Sign-Up Button */}
          <GoogleSignUp />
        </div>
      </div>
    </>
  );
};

export default SignupForm;
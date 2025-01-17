import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../utils/api";
import toast, { Toaster } from 'react-hot-toast';

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_no: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const handleChange = (e) => {
  //   setFormData({...formData,[e.target.name]:e.target.value});
  // };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value, // Update for checkbox
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedPassword = formData.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.first_name || !formData.last_name || !formData.phone_no || !formData.email || !trimmedPassword) {
      toast.error('All fields are required');
      return;
    }

    if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
    }

    if (!formData.termsAccepted) { // Check if the checkbox is ticked
      toast.error('You must accept the Terms and Conditions to sign up');
      return;
    }

    try {
      const otpResponse = await authService.sendOTP(formData);

      if(otpResponse.success) {
        localStorage.setItem('signupData', JSON.stringify(formData));
      }
      
      navigate('/verifyOTP');
    } catch (error) {
      console.error('signup error:', error)
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    }
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
          <button className="text-lg font-bold border-b-2 border-black pb-2">
            Sign UP
          </button>
          <Link to="/login" className="text-lg font-bold text-gray-500 pb-2">
            Log In
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4">Sign Up</h2>
          <div className="space-y-4">
            {/* First Name */}
            <input
              type="text"
              id="first_name"
              name="first_name"
              placeholder="First Name*"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
            />

            {/* Last Name */}
            <input
              type="text"
              id="last_name"
              name="last_name"
              placeholder="Last Name*"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
            />

            {/* Phone Number */}
            <input
              type="tel"
              id="phone_no"
              name="phone_no"
              placeholder="Phone number*"
              value={formData.phone_no}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
            />

            {/* Email Address */}
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email Address*"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-800"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password*"
                value={formData.password}
                onChange={handleChange}
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
            <p className="text-sm text-gray-500">
              At least 8 characters, 1 uppercase letter, 1 number & 1 symbol
            </p>

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="terms" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="w-5 h-5 text-gray-800 border-gray-300 rounded" />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I have read and agree to the{" "}
                <span className="font-bold">Terms and Conditions</span> and{" "}
                <span className="font-bold">Privacy Policy</span>.
              </label>
            </div>

            {/* Sign-Up Button */}
            <button
              type="submit"
              className="w-full py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
            >
              Sign Up
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
        <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
            alt="Google Logo"
            className="w-5 h-5 mr-2"
          />
          <span>Sign Up with Google</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default SignupForm;

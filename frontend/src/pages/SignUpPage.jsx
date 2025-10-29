import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import AuthImagePattern from '../components/AuthImagePattern';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from 'lucide-react';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { signup, isSigningUp, googleLogin } = useAuthStore();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Invalid email format');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setPasswordError('Passwords do not match');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Scroll to top on form submission
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!validateForm()) return;

    try {
      await signup(formData);
      navigate('/verify-otp');
    } catch (err) {
      // Prefer server-provided message when available
      const message =
        err?.response?.data?.message || err?.message || 'Sign up failed. Please try again.';
      toast.error(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      toast.error(err?.message || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  return (
    <>
      <div className="h-5"></div>
      <div
        className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20"
        style={{ backgroundColor: '#0f1419' }}
      >
        <div className="w-full max-w-6xl m-auto">
          <div className="">
            {/* Grid Layout */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Side - Sign Up Form */}
              <div className="flex flex-col justify-center max-w-md mx-auto w-full p-10">
                <div className="text-center mb-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-[#605dff]/30">
                      <MessageSquare className="w-8 h-8 text-[#605dff]" />
                    </div>
                    <h1 className="text-4xl font-bold text-white">Create Account</h1>
                    <p className="text-gray-400 text-base">Get started with your free account</p>
                  </div>
                </div>

                {/* Google Sign-In */}
                <div className="space-y-4 mb-5">
                  {/* <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    size="large"
                    width="100%"
                  /> */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[#0f1419] text-gray-400">or</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                    <input
                      id="fullName"
                      type="text"
                      className="peer w-full bg-[#2d3748] text-white rounded-xl border border-gray-700 focus:border-[#605dff] focus:ring-2 focus:ring-[#605dff]/40 transition-all duration-200 pl-12 pr-4 py-3.5 outline-none placeholder-transparent"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                    <label
                      htmlFor="fullName"
                      className="absolute left-12 -top-2.5 text-[#605dff] text-xs bg-[#0f1419] px-1 transition-all duration-200
                                peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:bg-transparent
                                peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#605dff] peer-focus:bg-[#0f1419]"
                    >
                      Full Name
                    </label>
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                    <input
                      id="email"
                      type="email"
                      className="peer w-full bg-[#2d3748] text-white rounded-xl border border-gray-700 focus:border-[#605dff] focus:ring-2 focus:ring-[#605dff]/40 transition-all duration-200 pl-12 pr-4 py-3.5 outline-none placeholder-transparent"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-12 -top-2.5 text-[#605dff] text-xs bg-[#0f1419] px-1 transition-all duration-200
                                peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:bg-transparent
                                peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#605dff] peer-focus:bg-[#0f1419]"
                    >
                      Email
                    </label>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="peer w-full bg-[#2d3748] text-white rounded-xl border border-gray-700 focus:border-[#605dff] focus:ring-2 focus:ring-[#605dff]/40 transition-all duration-200 pl-12 pr-12 py-3.5 outline-none placeholder-transparent"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <label
                      htmlFor="password"
                      className="absolute left-12 -top-2.5 text-[#605dff] text-xs bg-[#0f1419] px-1 transition-all duration-200
                                peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:bg-transparent
                                peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#605dff] peer-focus:bg-[#0f1419]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#605dff] transition z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className={`peer w-full bg-[#2d3748] text-white rounded-xl border ${
                        passwordError ? 'border-red-500' : 'border-gray-700'
                      } focus:border-[#605dff] focus:ring-2 ${
                        passwordError ? 'focus:ring-red-500/40' : 'focus:ring-[#605dff]/40'
                      } transition-all duration-200 pl-12 pr-12 py-3.5 outline-none placeholder-transparent`}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, confirmPassword: value });
                        if (formData.password && formData.password !== value) {
                          setPasswordError('Passwords do not match');
                        } else {
                          setPasswordError('');
                        }
                      }}
                      required
                    />
                    <label
                      htmlFor="confirmPassword"
                      className="absolute left-12 -top-2.5 text-[#605dff] text-xs bg-[#0f1419] px-1 transition-all duration-200
                                peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:bg-transparent
                                peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#605dff] peer-focus:bg-[#0f1419]"
                    >
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#605dff] transition z-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Error Message */}
                  {passwordError && <p className="text-red-400 text-sm -mt-2">{passwordError}</p>}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-[#605dff] hover:bg-[#6663ffc9] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-[#605dff] hover:text-[#6663ffc9] font-medium hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="hidden lg:flex flex-col justify-center border-l border-gray-700 pl-12 pr-2">
                <AuthImagePattern
                  title="Join our community"
                  subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignupPage;

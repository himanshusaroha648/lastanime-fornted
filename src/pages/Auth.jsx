import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('type') === 'recovery') {
      setShowForgotPass(true);
      setForgotStep(2);
    }
  }, [location]);

  if (user) {
    navigate('/');
    return null;
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
      
      const response = await fetch(`${cleanBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: forgotEmail,
          redirectTo: `${window.location.origin}/auth?type=recovery`
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send reset link');
      setSuccess('Password reset link sent to your email via our server!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // For Supabase native recovery, the user is already signed in with a temporary session
      // after clicking the email link. We can use updatePassword directly.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setSuccess('Password updated successfully! You can now login.');
      setShowForgotPass(false);
      setIsLogin(true);
      setForgotStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const capitalize = (str) => str ? str.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';
    const cleanFirstName = capitalize(firstName);
    const cleanLastName = capitalize(lastName);

    try {
      if (isLogin) {
        await signIn(emailOrUsername, password);
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        navigate(redirect || '/');
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
          setError('Username must be 3-20 characters (a-z, 0-9, _)');
          setLoading(false);
          return;
        }
        // Sign up with all fields
        await signUp(email, password, cleanFirstName, cleanLastName, username, day, month, year);
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect');
        navigate(redirect || '/');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-3xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {showForgotPass ? 'Reset Password' : (isLogin ? 'Welcome Back' : 'Create Account')}
            </h1>
            <p className="text-muted">
              {showForgotPass ? 'Follow the steps to reset your password' : (isLogin ? 'Sign in to your account' : 'Sign up for a new account')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm">
              {success}
            </div>
          )}

          {showForgotPass ? (
            forgotStep === 1 ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter your email"
                      required
                      style={{color: '#ffffff'}}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPass(false)}
                  className="w-full text-center text-muted hover:text-white transition text-sm"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">OTP Code</label>
                  <input
                    type="text"
                    name="reset_otp"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 py-3 px-4 text-white focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter 6-digit OTP"
                    required
                    style={{color: '#ffffff'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_password_reset"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-12 text-white focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter new password"
                      required
                      style={{color: '#ffffff'}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Reset Password
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {isLogin ? (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Email or Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter your email or username"
                      required
                      style={{color: '#ffffff'}}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 py-3 px-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                        placeholder="First name"
                        required
                        style={{color: '#ffffff'}}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 py-3 px-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                        placeholder="Last name"
                        required
                        style={{color: '#ffffff'}}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 py-3 px-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                      placeholder="username (a-z, 0-9, _)"
                      required
                      style={{color: '#ffffff'}}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="rounded-xl bg-white/10 border border-white/20 py-3 px-2 text-white focus:outline-none focus:border-primary focus:bg-white/15"
                        required
                      >
                        <option value="" disabled className="bg-[#1a1a1a]">Day</option>
                        {[...Array(31)].map((_, i) => (
                          <option key={i + 1} value={i + 1} className="bg-[#1a1a1a]">{i + 1}</option>
                        ))}
                      </select>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-xl bg-white/10 border border-white/20 py-3 px-2 text-white focus:outline-none focus:border-primary focus:bg-white/15"
                        required
                      >
                        <option value="" disabled className="bg-[#1a1a1a]">Month</option>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                          <option key={m} value={m} className="bg-[#1a1a1a]">{m}</option>
                        ))}
                      </select>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="rounded-xl bg-white/10 border border-white/20 py-3 px-2 text-white focus:outline-none focus:border-primary focus:bg-white/15"
                        required
                      >
                        <option value="" disabled className="bg-[#1a1a1a]">Year</option>
                        {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                        placeholder="Enter your email"
                        required
                        style={{color: '#ffffff'}}
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-12 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter your password"
                    required
                    style={{color: '#ffffff'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isLogin && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:border-primary focus:bg-white/15 focus:ring-2 focus:ring-primary/30"
                      placeholder="Confirm your password"
                      required
                      style={{color: '#ffffff'}}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-muted">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setShowForgotPass(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Auth;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(emailOrUsername, password);
        navigate('/');
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
        await signUp(email, password, firstName, lastName, username);
        navigate('/');
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
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted">
              {isLogin ? 'Sign in to your account' : 'Sign up for a new account'}
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

          <div className="mt-6 text-center">
            <p className="text-muted">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
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

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('input'); // input, verifying, success, error
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (!state?.email || !state?.password) {
      navigate('/auth');
      return;
    }
    setEmail(state.email);
    setPassword(state.password);
  }, [location, navigate]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setStatus('verifying');

    try {
      await verifyOTP(email, otp, password);
      setStatus('success');
      setMessage('Email verified! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass-surface rounded-3xl border border-white/10 p-8">
          {status === 'input' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
                <p className="text-muted">Enter the OTP sent to <br /> <strong>{email}</strong></p>
              </div>

              {message && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      setMessage('');
                    }}
                    maxLength="6"
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-widest rounded-xl bg-card/60 border border-white/10 py-4 text-white placeholder:text-muted focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full py-2 text-muted hover:text-white transition text-sm"
                >
                  Back to Sign Up
                </button>
              </form>
            </>
          )}

          {status === 'verifying' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Verifying OTP</h1>
              <p className="text-muted text-center">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Email Verified!</h1>
              <p className="text-muted text-center">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Verification Failed</h1>
              <p className="text-muted mb-4 text-center">{message}</p>
              <button
                onClick={() => {
                  setStatus('input');
                  setOtp('');
                  setMessage('');
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default VerifyOTP;

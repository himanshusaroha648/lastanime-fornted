import { createContext, useContext, useState, useEffect, useRef } from 'react';

// Get backend URL
function getBackendUrl() {
  const url = import.meta.env.VITE_API_BASE_URL || '/api';
  // Remove trailing /api if present to avoid double /api
  return url.endsWith('/api') ? url.slice(0, -4) : url;
}

const AuthContext = createContext(null);

// Helper functions to capture user info
function getUserAgent() {
  return navigator.userAgent;
}

function getClientIP() {
  // This will be set from backend via session storage
  return sessionStorage.getItem('clientIP') || 'unknown';
}

function generateLoginToken() {
  return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateAuthToken() {
  // Generate a simple auth token for API requests
  return 'auth_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email via backend
async function sendOTPEmail(email, otp) {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send OTP email:', error);
      return false;
    }

    const data = await response.json();
    console.log('OTP sent successfully');
    return true;
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const lastFetchedEmailRef = useRef(null);

  // Get client IP on mount
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => sessionStorage.setItem('clientIP', data.ip))
      .catch(() => console.log('Could not fetch IP'));
  }, []);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const savedProfile = localStorage.getItem('auth_profile');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
      setAuthToken(savedToken);
    }

    setLoading(false);
  }, []);

  // Fetch user profile only once per email
  const fetchUserProfile = async (email) => {
    // Skip if we've already fetched this email
    if (lastFetchedEmailRef.current === email) {
      return;
    }
    
    lastFetchedEmailRef.current = email;
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/profile/${email}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
        localStorage.setItem('auth_profile', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (email, password, firstName, lastName, username, date, month, year) => {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, username, date, month, year }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Store user data in localStorage (NO direct Supabase calls)
    if (data.user) {
      const userObj = {
        id: data.user.id || email,
        email: data.user.email || email,
      };
      const token = generateAuthToken();
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_token', token);
      
      setUser(userObj);
      setAuthToken(token);

      // Set user profile from response
      const profile = {
        first_name: firstName,
        last_name: lastName,
        username: username.toLowerCase(),
        email: email
      };
      setUserProfile(profile);
      localStorage.setItem('auth_profile', JSON.stringify(profile));
    }

    return data;
  };

  const signIn = async (emailOrUsername, password) => {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store user data in localStorage (NO direct Supabase calls)
    if (data.user) {
      const userObj = {
        id: data.user.id || data.user.email,
        email: data.user.email,
      };
      const token = generateAuthToken();
      
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      localStorage.setItem('auth_token', token);
      
      setUser(userObj);
      setAuthToken(token);

      // Fetch user profile after successful login
      if (data.user.email) {
        await fetchUserProfile(data.user.email);
      }
    }

    return data;
  };

  const signOut = async () => {
    const backendUrl = getBackendUrl();
    try {
      // Call backend logout endpoint
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Clear localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_profile');
    
    setUser(null);
    setAuthToken(null);
    setUserProfile(null);
    lastFetchedEmailRef.current = null;
  };

  const value = {
    user,
    userProfile,
    loading,
    authToken,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

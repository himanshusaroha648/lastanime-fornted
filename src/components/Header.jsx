import { Search, Shuffle, User, LogOut } from 'lucide-react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchLibrary } from '../api/client.js';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, signOut, loading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('All');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { searchQuery, searchType } });
    } else {
      window.dispatchEvent(new CustomEvent('header-search', { 
        detail: { query: searchQuery, type: searchType } 
      }));
    }
  };

  const handleRandomAnime = async () => {
    try {
      const library = await fetchLibrary();
      if (!Array.isArray(library) || library.length === 0) {
        console.warn('Library is empty or not an array');
        return;
      }
      const animeList = library.filter(item => item && item.type === 'series' && item.slug);
      if (animeList.length > 0) {
        const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];
        navigate(`/series/${randomAnime.slug}`);
      } else {
        console.warn('No anime found in library');
      }
    } catch (error) {
      console.error('Failed to fetch random anime:', error);
    }
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('header-search', { 
      detail: { query: '', type: 'All' } 
    }));
  };

  return (
    <header className="sticky top-0 z-50 bg-[rgba(6,10,18,0.8)] backdrop-blur-lg border-b border-white/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" aria-label="LASTANIME home" className="flex items-center gap-1.5 sm:gap-2" onClick={handleHomeClick}>
            <img
              src="/logo-symbol.svg"
              alt="LASTANIME symbol"
              className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-lg"
              draggable="false"
            />
            <span className="text-sm sm:text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              LASTANIME
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm md:flex">
            <NavLink
              to="/"
              onClick={handleHomeClick}
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-primary'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? 'text-primary' : 'text-muted hover:text-primary'
                }`
              }
            >
              Collections
            </NavLink>
            {user && (
              <NavLink
                to="/watch-history"
                className={({ isActive }) =>
                  `transition-colors ${
                    isActive ? 'text-primary' : 'text-muted hover:text-primary'
                  }`
                }
              >
                Watch History
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative" ref={searchRef}>
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Open search"
              className={`flex items-center gap-1 sm:gap-2 rounded-full border p-2 sm:px-3 sm:py-2 transition ${
                searchOpen
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'border-white/10 bg-card/60 text-muted hover:text-primary hover:border-primary/50'
              }`}
            >
              <Search size={18} />
              <span className="text-sm font-medium hidden sm:inline">Search</span>
            </button>
            
            {searchOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setSearchOpen(false)}
                />
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24">
                  <div className="w-full max-w-2xl mx-auto px-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 border border-white/10">
                        <Search className="text-primary" size={24} />
                        <input
                          type="search"
                          className="flex-1 bg-transparent text-xl text-white placeholder:text-muted focus:outline-none"
                          placeholder="Search anime, movies..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <span className="text-sm text-muted font-semibold">Type:</span>
                        <div className="flex gap-2 flex-wrap">
                          {['All', 'Anime', 'Movies'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setSearchType(type)}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                searchType === type
                                  ? 'bg-primary text-white'
                                  : 'bg-card/60 text-muted hover:text-primary border border-white/10'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary/90 w-full"
                      >
                        Search
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSearchOpen(false)}
                        className="rounded-xl px-6 py-3 text-base font-semibold text-muted transition hover:text-white w-full border border-white/10"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleRandomAnime}
            aria-label="Random Anime"
            className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
          >
            <Shuffle size={18} />
            <span className="text-sm font-medium hidden sm:inline">Random</span>
          </button>

          {!loading && (
            <div className="relative" ref={profileRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Profile menu"
                    className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium hidden sm:inline truncate max-w-[120px]">
                      {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}` : user.email?.split('@')[0]}
                    </span>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass-surface rounded-2xl border border-white/10 p-3 shadow-xl z-50">
                      <div className="px-3 py-2 border-b border-white/10 mb-3">
                        <p className="text-xs text-muted font-semibold uppercase tracking-wide">Profile</p>
                        <p className="text-sm font-semibold text-white mt-1">
                          {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name || ''}` : (userProfile?.username || user.email?.split('@')[0])}
                        </p>
                        {userProfile?.username && (
                          <p className="text-xs text-muted mt-1">@{userProfile.username}</p>
                        )}
                        <p className="text-xs text-muted break-all mt-1">{userProfile?.email || user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-white hover:bg-white/5 rounded-lg transition"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-1 sm:gap-2 rounded-full border border-white/10 bg-card/60 p-2 sm:px-3 sm:py-2 text-muted transition hover:text-primary hover:border-primary/50"
                >
                  <User size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Login</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

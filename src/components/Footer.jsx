import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[rgba(6,10,18,0.8)] backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-row items-center justify-between gap-4 text-sm text-muted">
        {/* Left: Navigation Links */}
        <nav className="flex gap-6 text-xs">
          <Link 
            className="hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary" 
            to="/about"
          >
            About
          </Link>
          <Link 
            className="hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary" 
            to="/privacy"
          >
            Privacy Policy
          </Link>
          <Link 
            className="hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary" 
            to="/contact"
          >
            Contact
          </Link>
        </nav>

        {/* Right: Copyright */}
        <p className="text-[10px] text-muted/70 whitespace-nowrap">
          © {new Date().getFullYear()} LASTANIME — Concept UI | Dev
        </p>
      </div>
    </footer>
  );
}

export default Footer;

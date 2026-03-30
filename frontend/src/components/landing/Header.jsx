import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

const navLinks = [
  { label: 'Accueil', href: '#' },
  { label: 'Rachat Cash', href: '#comment-ca-marche' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#centres' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-testid="main-header"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(43,58,103,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group shrink-0" data-testid="logo-link">
          <img
            src={LOGO_URL}
            alt="Venteflashauto"
            className="h-7 md:h-8 w-auto object-contain"
          />
          {scrolled && (
            <span className="font-['Poppins'] font-extrabold text-base text-[#2B3A67]">
              V<span className="text-[#2B3A67]">enteflash</span><span className="text-[#E84D1C]">auto</span>
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={`text-sm font-semibold transition-colors ${scrolled ? 'text-[#2B3A67] hover:text-[#E84D1C]' : 'text-white/90 hover:text-white'}`}
            >
              {label}
            </a>
          ))}
          <Button
            data-testid="header-estimate-btn"
            onClick={() => navigate('/estimation')}
            className={`bg-[#E84D1C] hover:bg-[#D4410F] text-white font-bold px-6 py-2.5 rounded-lg transition-all active:scale-95 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            Estimer mon vehicule
          </Button>
        </nav>

        {/* Mobile hamburger */}
        <button
          data-testid="mobile-menu-toggle"
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen
            ? <X className={scrolled ? 'text-[#2B3A67]' : 'text-white'} />
            : <Menu className={scrolled ? 'text-[#2B3A67]' : 'text-white'} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map(({ label, href }) => (
              <a key={label} href={href} className="block text-sm font-semibold text-[#2B3A67]" onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <Button
              data-testid="mobile-estimate-btn"
              onClick={() => { setMenuOpen(false); navigate('/estimation'); }}
              className="w-full bg-[#E84D1C] hover:bg-[#D4410F] text-white font-bold rounded-lg"
            >
              Estimer mon vehicule
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
          <div className="w-10 h-10 bg-[#FF5C00] rounded-xl flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className={`font-['Outfit'] font-extrabold text-xl tracking-tight transition-colors ${scrolled ? 'text-[#1E2A44]' : 'text-white'}`}>
            VenteFlash<span className="text-[#FF5C00]">Auto</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#comment-ca-marche" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-[#1E2A44] hover:text-[#FF5C00]' : 'text-white/80 hover:text-white'}`}>
            Comment ca marche
          </a>
          <a href="#temoignages" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-[#1E2A44] hover:text-[#FF5C00]' : 'text-white/80 hover:text-white'}`}>
            Avis clients
          </a>
          <a href="#centres" className={`text-sm font-semibold transition-colors ${scrolled ? 'text-[#1E2A44] hover:text-[#FF5C00]' : 'text-white/80 hover:text-white'}`}>
            Nos centres
          </a>
          <Button
            data-testid="header-estimate-btn"
            onClick={() => navigate('/estimation')}
            className={`bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold px-6 py-2.5 rounded-xl transition-all active:scale-95 ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
            ? <X className={scrolled ? 'text-[#1E2A44]' : 'text-white'} />
            : <Menu className={scrolled ? 'text-[#1E2A44]' : 'text-white'} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-3">
            <a href="#comment-ca-marche" className="block text-sm font-semibold text-[#1E2A44]" onClick={() => setMenuOpen(false)}>Comment ca marche</a>
            <a href="#temoignages" className="block text-sm font-semibold text-[#1E2A44]" onClick={() => setMenuOpen(false)}>Avis clients</a>
            <a href="#centres" className="block text-sm font-semibold text-[#1E2A44]" onClick={() => setMenuOpen(false)}>Nos centres</a>
            <Button
              data-testid="mobile-estimate-btn"
              onClick={() => { setMenuOpen(false); navigate('/estimation'); }}
              className="w-full bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold rounded-xl"
            >
              Estimer mon vehicule
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

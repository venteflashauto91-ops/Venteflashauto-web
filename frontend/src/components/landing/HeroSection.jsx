import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Clock, Zap } from 'lucide-react';
import { trackEvent, EVENTS } from '@/lib/tracking';

/* Inline SVG city skyline - matches the original venteflashauto.fr style */
function CitySkyline() {
  return (
    <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ height: '60%', opacity: 0.25 }}>
      <rect x="50" y="120" width="60" height="200" fill="#1E2A55" rx="2"/>
      <rect x="130" y="80" width="45" height="240" fill="#232F5E" rx="2"/>
      <rect x="190" y="140" width="70" height="180" fill="#1A2650" rx="2"/>
      <rect x="280" y="60" width="50" height="260" fill="#263562" rx="2"/>
      <rect x="350" y="100" width="80" height="220" fill="#1E2A55" rx="2"/>
      <rect x="450" y="50" width="55" height="270" fill="#2A3A6E" rx="2"/>
      <rect x="520" y="90" width="65" height="230" fill="#1F2D58" rx="2"/>
      <rect x="600" y="130" width="50" height="190" fill="#253260" rx="2"/>
      <rect x="670" y="70" width="75" height="250" fill="#1C2852" rx="2"/>
      <rect x="760" y="110" width="55" height="210" fill="#2B3B70" rx="2"/>
      <rect x="830" y="55" width="60" height="265" fill="#1E2A55" rx="2"/>
      <rect x="910" y="95" width="70" height="225" fill="#232F5E" rx="2"/>
      <rect x="1000" y="65" width="50" height="255" fill="#263562" rx="2"/>
      <rect x="1070" y="120" width="65" height="200" fill="#1A2650" rx="2"/>
      <rect x="1150" y="80" width="55" height="240" fill="#2A3A6E" rx="2"/>
      <rect x="1220" y="100" width="80" height="220" fill="#1F2D58" rx="2"/>
      <rect x="1320" y="60" width="60" height="260" fill="#253260" rx="2"/>
      <rect x="1390" y="130" width="50" height="190" fill="#1C2852" rx="2"/>
      {/* Clouds */}
      <ellipse cx="200" cy="60" rx="80" ry="20" fill="#3B4D8A" opacity="0.3"/>
      <ellipse cx="700" cy="40" rx="100" ry="22" fill="#3B4D8A" opacity="0.25"/>
      <ellipse cx="1100" cy="55" rx="90" ry="18" fill="#3B4D8A" opacity="0.3"/>
    </svg>
  );
}

export default function HeroSection() {
  const [immat, setImmat] = useState('');
  const navigate = useNavigate();

  const handleEstimate = (e) => {
    e.preventDefault();
    if (!immat.trim()) return;
    trackEvent(EVENTS.ESTIMATION_STARTED, { immatriculation: immat });
    navigate(`/estimation?immat=${encodeURIComponent(immat.trim())}`);
  };

  return (
    <section
      data-testid="hero-section"
      className="relative min-h-[85vh] flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #2B3A67 0%, #303B6E 40%, #3B4D8A 100%)' }}
    >
      <CitySkyline />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 text-center">
        <h1
          data-testid="hero-title"
          className="font-['Outfit'] text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-4 animate-fade-in-up"
        >
          Vendez votre <span className="text-[#E84D1C] italic">Voiture</span> en 24h
        </h1>
        <p
          data-testid="hero-subtitle"
          className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold text-[#E84D1C] mb-10 animate-fade-in-up stagger-1"
        >
          Estimation en ligne
        </p>

        {/* License plate form */}
        <form
          onSubmit={handleEstimate}
          className="animate-fade-in-up stagger-2 max-w-lg mx-auto"
          data-testid="hero-estimation-form"
        >
          <div className="bg-white rounded-xl p-2 shadow-2xl flex items-center">
            <input
              data-testid="hero-immat-input"
              type="text"
              value={immat}
              onChange={(e) => setImmat(e.target.value.toUpperCase())}
              placeholder="ex: AA111BB ou 111AAA22"
              className="flex-1 h-12 sm:h-14 px-4 text-base sm:text-lg font-semibold text-[#2B3A67] placeholder:text-gray-400 focus:outline-none bg-transparent"
              maxLength={12}
            />
            <button
              data-testid="hero-estimate-btn"
              type="submit"
              className="h-12 sm:h-14 w-14 bg-[#E84D1C] hover:bg-[#D4410F] rounded-lg flex items-center justify-center transition-all active:scale-95 shrink-0"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-10 animate-fade-in-up stagger-3">
          {[
            { icon: ShieldCheck, text: 'Sans engagement' },
            { icon: Clock, text: 'Paiement en 24h' },
            { icon: Zap, text: 'Estimation immediate' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-[#22C55E]" />
              <span className="text-sm text-white/80 font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

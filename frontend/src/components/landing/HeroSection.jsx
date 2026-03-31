import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Clock, Zap } from 'lucide-react';
import { trackEvent } from '@/lib/api';
import { buildUrlWithUtm } from '@/lib/utm';

const HERO_BG = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/plo7dwqy_header.png';

export default function HeroSection() {
  const [immat, setImmat] = useState('');
  const navigate = useNavigate();

  const handleEstimate = (e) => {
    e.preventDefault();
    if (!immat.trim()) return;
    trackEvent('estimation_started', { plate: immat });
    navigate(buildUrlWithUtm('/car-search', { car_info: immat.trim() }));
  };

  return (
    <section
      data-testid="hero-section"
      className="relative min-h-[85vh] flex items-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-48 text-center">
        <h1
          data-testid="hero-title"
          className="font-['Mulish'] text-4xl sm:text-5xl lg:text-6xl font-[900] tracking-tight leading-tight text-white mb-3 animate-fade-in-up"
        >
          Vendez votre <span className="text-[#ff4605]">Voiture</span> en 24h
        </h1>
        <p
          data-testid="hero-subtitle"
          className="font-['Mulish'] text-3xl sm:text-4xl lg:text-5xl font-[900] text-[#ff4605] mb-12 animate-fade-in-up stagger-1"
        >
          Estimation en ligne
        </p>

        {/* License plate form */}
        <form
          onSubmit={handleEstimate}
          className="animate-fade-in-up stagger-2 max-w-md mx-auto"
          data-testid="hero-estimation-form"
        >
          <div className="bg-white rounded-2xl p-2.5 shadow-2xl flex items-center">
            <input
              data-testid="hero-immat-input"
              type="text"
              value={immat}
              onChange={(e) => setImmat(e.target.value.toUpperCase())}
              placeholder="ex: AA111BB ou 111AAA22"
              className="flex-1 h-12 sm:h-14 px-4 text-base font-medium text-[#2B3A67] placeholder:text-gray-400 focus:outline-none bg-transparent"
              maxLength={12}
            />
            <button
              data-testid="hero-estimate-btn"
              type="submit"
              className="h-12 sm:h-14 w-14 bg-[#ff4605] hover:bg-[#E65200] rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
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

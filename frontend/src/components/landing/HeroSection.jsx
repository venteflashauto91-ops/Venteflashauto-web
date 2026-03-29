import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent, EVENTS } from '@/lib/tracking';

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
      className="relative min-h-[90vh] flex items-center overflow-hidden"
    >
      {/* Background image + overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1766918070754-0518b6505df5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHxwcmVtaXVtJTIwY2FyJTIwbW9kZXJufGVufDB8fHx8MTc3NDgxOTEzNHww&ixlib=rb-4.1.0&q=85"
          alt="Voiture premium"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1E2A44]/80 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C00] mb-4 animate-fade-in-up">
            Service de reprise automobile
          </p>
          <h1
            data-testid="hero-title"
            className="font-['Outfit'] text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white mb-6 animate-fade-in-up stagger-1"
          >
            Vendez votre voiture <span className="text-[#FF5C00]">en 24h</span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-10 animate-fade-in-up stagger-2">
            Estimation gratuite et sans engagement. Recevez une offre pour votre
            vehicule en quelques minutes.
          </p>

          {/* License plate form */}
          <form
            onSubmit={handleEstimate}
            className="animate-fade-in-up stagger-3"
            data-testid="hero-estimation-form"
          >
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="flex-1 relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#003DA5] rounded-l-xl flex items-center justify-center z-10">
                  <span className="text-white font-extrabold text-xs">F</span>
                </div>
                <input
                  data-testid="hero-immat-input"
                  type="text"
                  value={immat}
                  onChange={(e) => setImmat(e.target.value.toUpperCase())}
                  placeholder="AA-123-BB"
                  className="w-full h-14 sm:h-16 pl-14 pr-4 text-xl sm:text-2xl font-black tracking-widest uppercase text-center bg-white border-3 border-[#1E2A44] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#FF5C00]/30 placeholder:text-gray-300"
                  maxLength={10}
                />
              </div>
              <Button
                data-testid="hero-estimate-btn"
                type="submit"
                className="h-14 sm:h-16 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-lg px-8 rounded-xl transition-all shadow-lg shadow-[#FF5C00]/30 active:scale-95 flex items-center justify-center gap-2 animate-pulse-glow"
              >
                Estimer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-6 mt-8 animate-fade-in-up stagger-4">
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
      </div>
    </section>
  );
}

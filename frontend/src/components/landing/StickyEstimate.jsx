import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function StickyEstimate() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      data-testid="sticky-estimate-btn"
      onClick={() => navigate('/estimation')}
      className="fixed bottom-6 right-6 z-50 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-base px-6 py-4 rounded-xl shadow-2xl shadow-[#FF5C00]/30 transition-all active:scale-95 flex items-center gap-2 animate-pulse-glow md:bottom-8 md:right-8"
    >
      Estimer ma voiture
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}

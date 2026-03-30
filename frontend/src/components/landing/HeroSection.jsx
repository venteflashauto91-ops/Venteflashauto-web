import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, Clock, Zap } from 'lucide-react';
import { trackEvent, EVENTS } from '@/lib/tracking';

/* Detailed city skyline SVG matching venteflashauto.fr reference */
function CitySkyline() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background buildings - back row (darker, shorter) */}
      <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice">
        {/* Back row buildings - lighter blue */}
        <rect x="0" y="200" width="90" height="500" fill="#4A5DA0" rx="2"/>
        <rect x="100" y="150" width="70" height="550" fill="#4E62A5" rx="2"/>
        <rect x="180" y="220" width="100" height="480" fill="#4A5DA0" rx="2"/>
        <rect x="290" y="100" width="80" height="600" fill="#5268AB" rx="2"/>
        <rect x="380" y="180" width="60" height="520" fill="#4E62A5" rx="2"/>
        <rect x="450" y="130" width="90" height="570" fill="#4A5DA0" rx="2"/>
        <rect x="550" y="160" width="75" height="540" fill="#5268AB" rx="2"/>
        <rect x="635" y="80" width="65" height="620" fill="#4E62A5" rx="2"/>
        <rect x="710" y="200" width="95" height="500" fill="#4A5DA0" rx="2"/>
        <rect x="815" y="120" width="70" height="580" fill="#5268AB" rx="2"/>
        <rect x="895" y="170" width="85" height="530" fill="#4E62A5" rx="2"/>
        <rect x="990" y="90" width="60" height="610" fill="#4A5DA0" rx="2"/>
        <rect x="1060" y="210" width="100" height="490" fill="#5268AB" rx="2"/>
        <rect x="1170" y="140" width="75" height="560" fill="#4E62A5" rx="2"/>
        <rect x="1255" y="190" width="80" height="510" fill="#4A5DA0" rx="2"/>
        <rect x="1345" y="110" width="95" height="590" fill="#5268AB" rx="2"/>

        {/* Window lines on back buildings */}
        {[200, 150, 220, 100, 180, 130, 160, 80, 200, 120, 170, 90, 210, 140, 190, 110].map((startY, i) => {
          const xs = [0, 100, 180, 290, 380, 450, 550, 635, 710, 815, 895, 990, 1060, 1170, 1255, 1345];
          const ws = [90, 70, 100, 80, 60, 90, 75, 65, 95, 70, 85, 60, 100, 75, 80, 95];
          const x = xs[i];
          const w = ws[i];
          const lines = [];
          for (let y = startY + 20; y < 700; y += 30) {
            lines.push(<line key={`${i}-${y}`} x1={x + 8} y1={y} x2={x + w - 8} y2={y} stroke="#5B6FB5" strokeWidth="1" opacity="0.5"/>);
          }
          return lines;
        })}

        {/* Front row buildings - slightly lighter, overlapping */}
        <rect x="-20" y="350" width="120" height="350" fill="#3F5395" rx="2"/>
        <rect x="110" y="280" width="85" height="420" fill="#4559A0" rx="2"/>
        <rect x="205" y="320" width="110" height="380" fill="#3F5395" rx="2"/>
        <rect x="325" y="260" width="75" height="440" fill="#4559A0" rx="2"/>
        <rect x="410" y="310" width="95" height="390" fill="#3F5395" rx="2"/>
        <rect x="515" y="270" width="80" height="430" fill="#4559A0" rx="2"/>
        <rect x="605" y="330" width="100" height="370" fill="#3F5395" rx="2"/>
        <rect x="715" y="250" width="70" height="450" fill="#4559A0" rx="2"/>
        <rect x="795" y="300" width="90" height="400" fill="#3F5395" rx="2"/>
        <rect x="895" y="270" width="80" height="430" fill="#4559A0" rx="2"/>
        <rect x="985" y="340" width="105" height="360" fill="#3F5395" rx="2"/>
        <rect x="1100" y="280" width="75" height="420" fill="#4559A0" rx="2"/>
        <rect x="1185" y="310" width="90" height="390" fill="#3F5395" rx="2"/>
        <rect x="1285" y="260" width="80" height="440" fill="#4559A0" rx="2"/>
        <rect x="1375" y="300" width="65" height="400" fill="#3F5395" rx="2"/>

        {/* Window lines on front buildings */}
        {[350, 280, 320, 260, 310, 270, 330, 250, 300, 270, 340, 280, 310, 260, 300].map((startY, i) => {
          const xs = [-20, 110, 205, 325, 410, 515, 605, 715, 795, 895, 985, 1100, 1185, 1285, 1375];
          const ws = [120, 85, 110, 75, 95, 80, 100, 70, 90, 80, 105, 75, 90, 80, 65];
          const x = xs[i];
          const w = ws[i];
          const lines = [];
          for (let y = startY + 15; y < 700; y += 25) {
            lines.push(<line key={`f${i}-${y}`} x1={x + 6} y1={y} x2={x + w - 6} y2={y} stroke="#5269A8" strokeWidth="1.5" opacity="0.4"/>);
          }
          return lines;
        })}

        {/* Clouds */}
        <ellipse cx="150" cy="80" rx="100" ry="25" fill="#5269A8" opacity="0.4"/>
        <ellipse cx="450" cy="55" rx="120" ry="28" fill="#5269A8" opacity="0.35"/>
        <ellipse cx="850" cy="70" rx="90" ry="22" fill="#5269A8" opacity="0.4"/>
        <ellipse cx="1200" cy="50" rx="110" ry="26" fill="#5269A8" opacity="0.35"/>
      </svg>
    </div>
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
      style={{ background: '#3D4F8F' }}
    >
      <CitySkyline />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 text-center">
        <h1
          data-testid="hero-title"
          className="font-['Poppins'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-3 animate-fade-in-up"
        >
          Vendez votre <span className="text-[#E84D1C] italic">Voiture</span> en 24h
        </h1>
        <p
          data-testid="hero-subtitle"
          className="font-['Poppins'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#E84D1C] mb-12 animate-fade-in-up stagger-1"
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
              className="h-12 sm:h-14 w-14 bg-[#E84D1C] hover:bg-[#D4410F] rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
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

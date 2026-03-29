import { Star, Car, Award, CreditCard } from 'lucide-react';

const stats = [
  { icon: Car, value: '+500', label: 'vehicules vendus', color: '#E84D1C' },
  { icon: Star, value: '4.8/5', label: 'avis clients', color: '#22C55E' },
  { icon: Award, value: '#1', label: 'service de reprise', color: '#2B3A67' },
  { icon: CreditCard, value: '0\u20AC', label: 'frais de service', color: '#E84D1C' },
];

export default function SocialProof() {
  return (
    <section data-testid="social-proof-section" className="bg-white py-10 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="flex items-center gap-3" data-testid={`stat-${label.replace(/\s/g, '-')}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}14` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <p className="font-['Outfit'] font-extrabold text-xl text-[#2B3A67]">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

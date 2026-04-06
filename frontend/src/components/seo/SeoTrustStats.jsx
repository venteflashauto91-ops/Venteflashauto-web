import { Car, Shield, Clock, Banknote } from 'lucide-react';

const STATS = [
  {
    icon: Car,
    number: '+500',
    label: 'vehicules rachetes',
    desc: 'Depuis notre lancement',
  },
  {
    icon: Clock,
    number: '48h',
    label: 'Paiement rapide',
    desc: 'Par virement securise',
  },
  {
    icon: Shield,
    number: '100%',
    label: 'Sans engagement',
    desc: 'Libre d\'accepter ou refuser',
  },
  {
    icon: Banknote,
    number: 'Tous',
    label: 'types de vehicules',
    desc: 'Meme en panne ou sans CT',
  },
];

export function SeoTrustStats({ locationName }) {
  return (
    <section className="py-14 md:py-20 bg-white" data-testid="trust-block">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
            Pourquoi nous faire confiance{locationName !== 'France' ? ` a ${locationName}` : ''} ?
          </h2>
          <p className="text-gray-500 text-sm md:text-base">Des milliers de clients satisfaits dans toute la France</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map(({ icon: Icon, number, label, desc }, i) => (
            <div
              key={i}
              data-testid={`trust-item-${i}`}
              className="bg-[#F8F9FB] rounded-2xl p-5 md:p-6 text-center border border-gray-100 hover:border-[#ff4605]/20 hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-[#ff4605]/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#ff4605]/15 transition">
                <Icon className="w-6 h-6 text-[#ff4605]" />
              </div>
              <p className="font-['Mulish'] text-2xl md:text-3xl font-[900] text-[#2B3A67] mb-1">{number}</p>
              <p className="font-bold text-[#2B3A67] text-sm mb-1">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

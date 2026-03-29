import { Monitor, CalendarDays, BadgeEuro } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Monitor,
    title: 'Estimez en ligne',
    desc: 'Entrez votre plaque d\'immatriculation et obtenez une estimation en quelques secondes.',
  },
  {
    num: '02',
    icon: CalendarDays,
    title: 'Prenez rendez-vous',
    desc: 'Choisissez le centre et le creneau qui vous conviennent pour l\'expertise.',
  },
  {
    num: '03',
    icon: BadgeEuro,
    title: 'Recevez votre paiement',
    desc: 'Apres expertise, recevez votre paiement sous 24h par virement securise.',
  },
];

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" data-testid="how-it-works-section" className="bg-[#F3F4F6] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E84D1C] mb-3">Simple et rapide</p>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A67]">
            Comment ca marche ?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div
              key={num}
              data-testid={`how-step-${num}`}
              className="bg-white rounded-xl border border-gray-100 shadow-lg shadow-black/5 p-6 md:p-8 hover:-translate-y-1 transition-transform duration-300 relative group"
            >
              <span className="absolute top-4 right-4 font-['Outfit'] text-6xl font-black text-gray-100 group-hover:text-[#E84D1C]/10 transition-colors select-none">
                {num}
              </span>
              <div className="w-14 h-14 rounded-xl bg-[#E84D1C]/10 flex items-center justify-center mb-5">
                <Icon className="w-7 h-7 text-[#E84D1C]" />
              </div>
              <h3 className="font-['Outfit'] text-xl font-semibold text-[#2B3A67] mb-2">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

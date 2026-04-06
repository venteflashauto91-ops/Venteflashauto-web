import { FileSearch, CalendarCheck, Banknote } from 'lucide-react';

const STEPS = [
  {
    icon: FileSearch,
    title: 'Estimation en ligne',
    desc: 'Entrez votre plaque et obtenez un prix en 2 minutes. Gratuit et sans engagement.',
    step: '01',
  },
  {
    icon: CalendarCheck,
    title: 'Prise de rendez-vous',
    desc: 'Choisissez un centre proche de chez vous et un creneau qui vous convient.',
    step: '02',
  },
  {
    icon: Banknote,
    title: 'Paiement rapide',
    desc: 'Presentez votre vehicule, validez le prix et recevez votre virement sous 48h.',
    step: '03',
  },
];

export function SeoSteps() {
  return (
    <section className="py-14 md:py-20 bg-[#F8F9FB]" data-testid="seo-steps">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
            Comment ca marche ?
          </h2>
          <p className="text-gray-500 text-sm md:text-base">Vendez votre voiture en 3 etapes simples</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map(({ icon: Icon, title, desc, step }, i) => (
            <div
              key={i}
              data-testid={`step-${i}`}
              className="relative bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 text-center group hover:shadow-md hover:border-[#ff4605]/20 transition-all duration-300"
            >
              {/* Step number */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff4605] text-white text-xs font-bold px-3 py-1 rounded-full">
                {step}
              </span>

              <div className="w-14 h-14 bg-[#ff4605]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-[#ff4605]/20 transition">
                <Icon className="w-7 h-7 text-[#ff4605]" />
              </div>

              <h3 className="font-['Mulish'] font-bold text-[#2B3A67] text-base mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>

              {/* Connector line (desktop only) */}
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 md:-right-5 w-8 md:w-10 h-[2px] bg-[#ff4605]/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

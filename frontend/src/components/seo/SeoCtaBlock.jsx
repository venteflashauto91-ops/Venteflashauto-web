import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SeoCtaBlock({ variant = 'inline', ctaText, testId = 'cta-block' }) {
  const text = ctaText || 'Estimer ma voiture gratuitement en 2 minutes';

  if (variant === 'final') {
    return (
      <section className="bg-[#2B3A67] text-white py-14 md:py-20" data-testid={testId}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-['Mulish'] text-2xl sm:text-3xl font-bold mb-4">{text}</h2>
          <p className="text-white/60 mb-8 text-sm md:text-base">
            Estimation gratuite, sans engagement, en moins de 2 minutes
          </p>
          <Link to="/">
            <Button
              data-testid={`${testId}-btn`}
              className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-base md:text-lg rounded-xl h-14 px-8 shadow-xl shadow-[#ff4605]/30 transition-transform hover:scale-[1.03]"
            >
              Estimer mon vehicule maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6">
            {['Gratuit', 'Sans engagement', 'Paiement rapide'].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Inline variant (mid-page)
  return (
    <div
      data-testid={testId}
      className="mt-10 bg-gradient-to-r from-[#2B3A67] to-[#1a2744] rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5"
    >
      <div className="flex-1 text-center sm:text-left">
        <p className="font-bold text-white text-lg mb-1">Obtenez votre estimation gratuite</p>
        <p className="text-white/50 text-sm">Sans engagement · Resultat en 2 minutes</p>
      </div>
      <Link to="/">
        <Button
          data-testid={`${testId}-btn`}
          className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl h-12 px-6 whitespace-nowrap transition-transform hover:scale-[1.03]"
        >
          Estimer maintenant <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
}

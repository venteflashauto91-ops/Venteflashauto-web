import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1618312980089-c7cfe73ebb85?w=1400&q=80&auto=format';

export function SeoHero({ page }) {
  const heroImg = page.hero_image || FALLBACK_HERO;
  const ctaText = page.cta_text || 'Estimer ma voiture gratuitement en 2 minutes';

  return (
    <section
      data-testid="seo-hero"
      className="relative min-h-[420px] md:min-h-[500px] flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt={page.h1 || 'Rachat voiture'}
          className="w-full h-full object-cover"
          loading="eager"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
        <h1
          data-testid="seo-h1"
          className="font-['Mulish'] text-3xl sm:text-4xl lg:text-5xl font-[900] text-white leading-tight mb-5 drop-shadow-lg"
        >
          {page.h1}
        </h1>
        <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
          {page.intro?.slice(0, 180)}{page.intro?.length > 180 ? '...' : ''}
        </p>

        <Link to="/">
          <Button
            data-testid="hero-cta"
            className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-base md:text-lg rounded-xl h-14 px-8 shadow-xl shadow-[#ff4605]/30 transition-transform hover:scale-[1.03]"
          >
            {ctaText}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        {/* Micro-reassurance */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6">
          {[
            'Gratuit',
            'Sans engagement',
            'Resultat immediat',
          ].map((text) => (
            <span key={text} className="flex items-center gap-1.5 text-sm text-white/70">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

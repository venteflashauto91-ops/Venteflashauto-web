import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie M.',
    location: 'Paris',
    rating: 5,
    text: 'Processus ultra simple ! J\'ai vendu ma Clio en 3 jours. Le paiement a ete rapide et le prix etait au-dessus de mes attentes.',
    avatar: 'https://images.pexels.com/photos/7144229/pexels-photo-7144229.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  },
  {
    name: 'Thomas L.',
    location: 'Lyon',
    rating: 5,
    text: 'Service impeccable. L\'estimation en ligne etait tres proche du prix final. Je recommande vivement !',
    avatar: 'https://images.unsplash.com/photo-1753161023792-d240af5e6ef7?crop=entropy&cs=srgb&fm=jpg&w=100&h=100&fit=crop',
  },
  {
    name: 'Marie D.',
    location: 'Marseille',
    rating: 4,
    text: 'Rapide et efficace. Pas de mauvaise surprise. Tout etait clair des le depart. Le centre de Marseille est tres professionnel.',
    avatar: 'https://images.pexels.com/photos/7682203/pexels-photo-7682203.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  },
  {
    name: 'Pierre R.',
    location: 'Toulouse',
    rating: 5,
    text: 'J\'avais peur des arnaques mais tout s\'est passe parfaitement. Paiement recu en 24h comme promis. Top service !',
    avatar: null,
  },
];

export default function Testimonials() {
  return (
    <section id="temoignages" data-testid="testimonials-section" className="bg-[#1E2A44] py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C00] mb-3">Temoignages</p>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
            Avis de nos clients
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              data-testid={`testimonial-${i}`}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s < t.rating ? 'text-[#FF5C00] fill-[#FF5C00]' : 'text-gray-600'}`}
                  />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#FF5C00]/20 flex items-center justify-center text-[#FF5C00] font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/50 text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

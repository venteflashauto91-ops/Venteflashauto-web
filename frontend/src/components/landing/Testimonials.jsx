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
    <section id="temoignages" data-testid="testimonials-section" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C00] mb-3">Temoignages</p>
          <h2 className="font-['Mulish'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A67]">
            Temoignages
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              data-testid={`testimonial-${i}`}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                {t.avatar ? (
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#FF5C00]/10 flex items-center justify-center text-[#FF5C00] font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[#2B3A67] font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.location}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s < t.rating ? 'text-[#FF5C00] fill-[#FF5C00]' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{t.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

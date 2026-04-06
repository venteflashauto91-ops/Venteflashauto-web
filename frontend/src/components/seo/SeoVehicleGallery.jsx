import { Clock } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const DEFAULT_VEHICLES = [
  {
    image: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/pidh4bo2_ChatGPT%20Image%205%20avr.%202026%2C%2022_35_58.png',
    model: 'Peugeot 3008',
    city: 'Paris',
    delay: 'Rachete en 24h',
  },
  {
    image: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/1j154bqh_ChatGPT%20Image%205%20avr.%202026%2C%2022_42_37.png',
    model: 'Renault Clio',
    city: 'Lyon',
    delay: 'Rachete en 48h',
  },
  {
    image: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/jd8z4wk9_ChatGPT%20Image%205%20avr.%202026%2C%2022_44_58.png',
    model: 'Volkswagen Golf',
    city: 'Marseille',
    delay: 'Rachete en 24h',
  },
  {
    image: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/kp8w3bbe_ChatGPT%20Image%205%20avr.%202026%2C%2022_47_19.png',
    model: 'Citroen C3',
    city: 'Bretigny-sur-Orge',
    delay: 'Rachete en 48h',
  },
];

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export function SeoVehicleGallery({ vehicles, locationName }) {
  const items = vehicles?.length > 0 ? vehicles : DEFAULT_VEHICLES;

  return (
    <section className="py-14 md:py-20 bg-[#F8F9FB]" data-testid="vehicles-block">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
            Vehicules recemment rachetes
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Decouvrez les dernieres reprises{locationName !== 'France' ? ` pres de ${locationName}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((v, i) => (
            <div
              key={i}
              data-testid={`vehicle-card-${i}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={resolveUrl(v.image)}
                  alt={`Rachat ${v.model || 'voiture'} ${v.city || locationName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="font-['Mulish'] font-bold text-[#2B3A67] text-sm mb-1">
                  {v.model || 'Vehicule'}
                </p>
                <p className="text-gray-400 text-xs mb-2">{v.city || locationName}</p>
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-full px-2.5 py-1 w-fit">
                  <Clock className="w-3 h-3" />
                  {v.delay || 'Rachete en 48h'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

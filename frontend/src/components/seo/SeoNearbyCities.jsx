import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export function SeoNearbyCities({ page, locationName }) {
  const isCity = page.type === 'city';
  const isDept = page.type === 'department';

  // City page: nearby cities
  if (isCity && page.nearby_cities?.length > 0) {
    return (
      <section className="py-14 md:py-20 bg-[#F8F9FB]" data-testid="nearby-cities">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
              Rachat voiture a {locationName} et alentours
            </h2>
            <p className="text-gray-500 text-sm md:text-base">Decouvrez nos services dans les villes voisines</p>
          </div>

          {/* Optional city image */}
          {page.city_image && (
            <div className="max-w-2xl mx-auto mb-10 rounded-2xl overflow-hidden shadow-lg aspect-[21/9]">
              <img
                src={resolveUrl(page.city_image)}
                alt={`Rachat voiture ${locationName}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {page.nearby_cities.map((c) => (
              <Link
                key={c.slug}
                to={`/rachat-voiture/${c.slug}`}
                data-testid={`nearby-${c.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-[#ff4605] hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-[#ff4605]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#ff4605]/20 transition">
                  <MapPin className="w-5 h-5 text-[#ff4605]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2B3A67] text-sm group-hover:text-[#ff4605] transition">{c.name}</p>
                  <p className="text-xs text-gray-400">{page.department_name} ({page.department_code})</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ff4605] transition shrink-0" />
              </Link>
            ))}

            {/* Link to department */}
            {page.department_slug && (
              <Link
                to={`/rachat-voiture/${page.department_slug}`}
                data-testid="link-department"
                className="bg-[#2B3A67] rounded-xl p-5 flex items-center gap-4 hover:bg-[#1a2744] transition group"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">Tout l'{page.department_name}</p>
                  <p className="text-xs text-white/50">Voir toutes les villes du {page.department_code}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white transition shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Department page: cities list
  if (isDept && page.cities_list?.length > 0) {
    return (
      <section className="py-14 md:py-20 bg-[#F8F9FB]" data-testid="dept-cities">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
              Villes couvertes dans l'{page.department_name}
            </h2>
            <p className="text-gray-500 text-sm md:text-base">Selectionnez votre ville pour plus d'informations</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {page.cities_list.map((c) => (
              <Link
                key={c.slug}
                to={`/rachat-voiture/${c.slug}`}
                data-testid={`dept-city-${c.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-[#ff4605] hover:shadow-md transition-all duration-200 group"
              >
                <MapPin className="w-6 h-6 text-[#ff4605] mx-auto mb-2" />
                <p className="font-bold text-[#2B3A67] text-sm group-hover:text-[#ff4605] transition">{c.name}</p>
                <p className="text-[10px] text-gray-400 mt-1">Rachat voiture</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // National page: departments
  if (page.type === 'national' && page.departments_list?.length > 0) {
    return (
      <section className="py-14 md:py-20 bg-[#F8F9FB]" data-testid="national-depts">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
              Departements couverts
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {page.departments_list.map((d) => (
              <Link
                key={d.slug}
                to={`/rachat-voiture/${d.slug}`}
                data-testid={`dept-link-${d.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-[#ff4605] hover:shadow-md transition-all duration-200 group"
              >
                <MapPin className="w-6 h-6 text-[#ff4605] mx-auto mb-2" />
                <p className="font-bold text-[#2B3A67] group-hover:text-[#ff4605] transition">{d.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}

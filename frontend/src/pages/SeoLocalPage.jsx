import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, CheckCircle2, Clock, Shield, Banknote, ChevronRight, ChevronDown, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';
const VEHICLE_IMAGES = [
  'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/pidh4bo2_ChatGPT%20Image%205%20avr.%202026%2C%2022_35_58.png',
  'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/1j154bqh_ChatGPT%20Image%205%20avr.%202026%2C%2022_42_37.png',
  'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/jd8z4wk9_ChatGPT%20Image%205%20avr.%202026%2C%2022_44_58.png',
  'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/kp8w3bbe_ChatGPT%20Image%205%20avr.%202026%2C%2022_47_19.png',
];

export default function SeoLocalPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const resolvedSlug = slug || 'rachat-voiture';

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`${API}/seo-pages/${resolvedSlug}`)
      .then(r => { if (!r.ok) throw new Error('404'); return r.json(); })
      .then(d => { setPage(d); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [resolvedSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#ff4605] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-[#2B3A67] mb-4">404</h1>
          <p className="text-gray-500 mb-6">Cette page n'existe pas ou a ete supprimee.</p>
          <Link to="/rachat-voiture">
            <Button className="bg-[#ff4605] text-white rounded-xl">Rachat voiture en France</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = page.canonical_override || `https://venteflashauto.fr/rachat-voiture${page.slug !== 'rachat-voiture' ? '/' + page.slug : ''}`;
  const isCity = page.type === 'city';
  const isDept = page.type === 'department';
  const locationName = page.city_name || page.department_name || 'France';

  // FAQ Schema
  const faqSchema = page.faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faq.map(f => ({
      "@type": "Question",
      "name": f.question,
      "acceptedAnswer": { "@type": "Answer", "text": f.answer }
    }))
  } : null;

  return (
    <div data-testid="seo-local-page" className="min-h-screen bg-white">
      <Helmet>
        <title>{page.seo_title}</title>
        <meta name="description" content={page.meta_description} />
        <link rel="canonical" href={canonicalUrl} />
        {page.noindex && <meta name="robots" content="noindex,follow" />}
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
            <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">Venteflash<span className="text-[#ff4605]">auto</span></span>
          </Link>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl text-sm h-9 px-4" data-testid="header-cta">
              Estimer mon vehicule
            </Button>
          </Link>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav className="max-w-6xl mx-auto px-4 py-3" aria-label="Breadcrumb" data-testid="breadcrumbs">
        <ol className="flex items-center flex-wrap gap-1 text-xs text-gray-400">
          <li><Link to="/" className="hover:text-[#ff4605] transition">Accueil</Link></li>
          <ChevronRight className="w-3 h-3" />
          {page.type === 'national' ? (
            <li className="text-[#2B3A67] font-medium">Rachat voiture</li>
          ) : (
            <>
              <li><Link to="/rachat-voiture" className="hover:text-[#ff4605] transition">Rachat voiture</Link></li>
              <ChevronRight className="w-3 h-3" />
              {isCity && page.department_slug && (
                <>
                  <li><Link to={`/rachat-voiture/${page.department_slug}`} className="hover:text-[#ff4605] transition">{page.department_name}</Link></li>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <li className="text-[#2B3A67] font-medium">{locationName}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#2B3A67] to-[#1a2744] text-white py-12 md:py-20" data-testid="seo-hero">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="font-['Mulish'] text-3xl sm:text-4xl lg:text-5xl font-[900] leading-tight mb-4" data-testid="seo-h1">
            {page.h1}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
            {page.intro}
          </p>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl h-14 px-8 shadow-lg shadow-[#ff4605]/30" data-testid="hero-cta">
              {page.cta_text || 'Estimer mon vehicule gratuitement'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/50">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Gratuit</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> 2 minutes</span>
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="max-w-6xl mx-auto px-4">
        {page.sections?.map((section, i) => (
          <section key={i} className={`py-12 md:py-16 ${i < page.sections.length - 1 ? 'border-b border-gray-100' : ''}`} data-testid={`seo-section-${i}`}>
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-4">{section.title}</h2>
            <p className="text-gray-600 leading-relaxed max-w-4xl">{section.content}</p>

            {/* CTA after section 1 (mid-page) */}
            {i === 1 && (
              <div className="mt-8 bg-[#F3F4F6] rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4" data-testid="mid-cta">
                <div className="flex-1">
                  <p className="font-bold text-[#2B3A67] text-lg">Obtenez votre estimation gratuite</p>
                  <p className="text-gray-500 text-sm">Sans engagement, resultat en 2 minutes</p>
                </div>
                <Link to="/">
                  <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl h-12 px-6" data-testid="mid-cta-btn">
                    Estimer maintenant <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Internal links in section about local coverage (last section usually) */}
            {i === page.sections.length - 1 && (page.nearby_cities?.length > 0 || page.cities_list?.length > 0) && (
              <div className="mt-6">
                {/* City pages: nearby cities */}
                {isCity && page.nearby_cities?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {page.department_slug && (
                      <Link to={`/rachat-voiture/${page.department_slug}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2B3A67]/5 text-[#2B3A67] rounded-lg text-sm font-medium hover:bg-[#2B3A67]/10 transition">
                        <MapPin className="w-3.5 h-3.5" /> {page.department_name} ({page.department_code})
                      </Link>
                    )}
                    {page.nearby_cities.map(c => (
                      <Link key={c.slug} to={`/rachat-voiture/${c.slug}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ff4605]/5 text-[#ff4605] rounded-lg text-sm font-medium hover:bg-[#ff4605]/10 transition">
                        <MapPin className="w-3.5 h-3.5" /> {c.name}
                      </Link>
                    ))}
                  </div>
                )}
                {/* Department page: cities list */}
                {isDept && page.cities_list?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                    {page.cities_list.map(c => (
                      <Link key={c.slug} to={`/rachat-voiture/${c.slug}`} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-[#ff4605] hover:shadow-md transition group" data-testid={`city-link-${c.slug}`}>
                        <MapPin className="w-5 h-5 text-[#ff4605] mx-auto mb-2" />
                        <p className="text-sm font-bold text-[#2B3A67] group-hover:text-[#ff4605] transition">{c.name}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Trust block */}
      {page.trust_block && (
        <section className="bg-[#F3F4F6] py-12 md:py-16" data-testid="trust-block">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-8">
              Pourquoi nous faire confiance{locationName !== 'France' ? ` a ${locationName}` : ''} ?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Clock, title: 'Estimation en 2 min', desc: 'Resultat immediat en ligne' },
                { icon: Shield, title: 'Sans engagement', desc: 'Libre d\'accepter ou refuser' },
                { icon: Banknote, title: 'Paiement rapide', desc: 'Virement sous 24-48h' },
                { icon: Car, title: 'Tous vehicules', desc: 'Meme en panne ou sans CT' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm" data-testid={`trust-item-${i}`}>
                  <div className="w-10 h-10 bg-[#ff4605]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-[#ff4605]" />
                  </div>
                  <p className="font-bold text-[#2B3A67] text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vehicles / Social proof */}
      {page.vehicles_block && (
        <section className="py-12 md:py-16" data-testid="vehicles-block">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-8">
              Vehicules recemment rachetes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {VEHICLE_IMAGES.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden shadow-md hover:-translate-y-1 transition-transform duration-300">
                  <img src={img} alt={`Rachat voiture ${locationName} - vehicule ${i + 1}`} className="w-full h-40 object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby cities block (visible block for city pages) */}
      {isCity && page.nearby_cities?.length > 0 && (
        <section className="bg-[#F3F4F6] py-12 md:py-16" data-testid="nearby-cities">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-2">
              Rachat voiture pres de {locationName}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8">Decouvrez nos services dans les villes voisines</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {page.nearby_cities.map(c => (
                <Link key={c.slug} to={`/rachat-voiture/${c.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-[#ff4605] hover:shadow-md transition group" data-testid={`nearby-${c.slug}`}>
                  <div className="w-10 h-10 bg-[#ff4605]/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#ff4605]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2B3A67] text-sm group-hover:text-[#ff4605] transition">{c.name}</p>
                    <p className="text-xs text-gray-400">{page.department_name} ({page.department_code})</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#ff4605] transition shrink-0" />
                </Link>
              ))}
              {page.department_slug && (
                <Link to={`/rachat-voiture/${page.department_slug}`} className="bg-[#2B3A67] rounded-xl p-5 flex items-center gap-4 hover:bg-[#1a2744] transition group" data-testid="link-department">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
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
      )}

      {/* Department: cities list block */}
      {isDept && page.cities_list?.length > 0 && (
        <section className="bg-[#F3F4F6] py-12 md:py-16" data-testid="dept-cities">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-2">
              Villes couvertes dans l'{page.department_name}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-8">Selectionnez votre ville pour plus d'informations</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {page.cities_list.map(c => (
                <Link key={c.slug} to={`/rachat-voiture/${c.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-[#ff4605] hover:shadow-md transition group" data-testid={`dept-city-${c.slug}`}>
                  <MapPin className="w-6 h-6 text-[#ff4605] mx-auto mb-2" />
                  <p className="font-bold text-[#2B3A67] text-sm group-hover:text-[#ff4605] transition">{c.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Rachat voiture</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* National: departments list */}
      {page.type === 'national' && page.departments_list?.length > 0 && (
        <section className="bg-[#F3F4F6] py-12 md:py-16" data-testid="national-depts">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-8">
              Departements couverts
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {page.departments_list.map(d => (
                <Link key={d.slug} to={`/rachat-voiture/${d.slug}`} className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-[#ff4605] hover:shadow-md transition group" data-testid={`dept-link-${d.slug}`}>
                  <MapPin className="w-6 h-6 text-[#ff4605] mx-auto mb-2" />
                  <p className="font-bold text-[#2B3A67] group-hover:text-[#ff4605] transition">{d.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {page.faq?.length > 0 && (
        <section className="py-12 md:py-16" data-testid="seo-faq">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] text-center mb-8">
              FAQ - Rachat de voiture{locationName !== 'France' ? ` a ${locationName}` : ''}
            </h2>
            <div className="space-y-3">
              {page.faq.map((f, i) => (
                <FaqItem key={i} question={f.question} answer={f.answer} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-[#2B3A67] to-[#1a2744] text-white py-14 md:py-20" data-testid="final-cta">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-['Mulish'] text-2xl sm:text-3xl font-bold mb-4">
            {page.cta_text || `Obtenez votre estimation gratuite${locationName !== 'France' ? ` a ${locationName}` : ''}`}
          </h2>
          <p className="text-white/60 mb-8">Estimation gratuite, sans engagement, en moins de 2 minutes</p>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl h-14 px-8 shadow-lg shadow-[#ff4605]/30" data-testid="final-cta-btn">
              Estimer mon vehicule maintenant <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/50">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Gratuit</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Paiement rapide</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1117] text-gray-500 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-5 w-auto opacity-60" />
            <span className="font-['Mulish'] font-bold text-xs text-gray-500">Venteflash<span className="text-[#ff4605]/60">auto</span></span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/rachat-voiture" className="hover:text-white transition">Rachat voiture</Link>
            <Link to="/" className="hover:text-white transition">Estimation</Link>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Vente Flash Auto</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" data-testid={`faq-${index}`}>
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition">
        <h3 className="font-bold text-[#2B3A67] text-sm pr-4">{question}</h3>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

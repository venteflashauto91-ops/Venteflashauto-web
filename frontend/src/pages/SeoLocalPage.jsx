import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';

import { SeoHero } from '@/components/seo/SeoHero';
import { SeoSection } from '@/components/seo/SeoSection';
import { SeoCtaBlock } from '@/components/seo/SeoCtaBlock';
import { SeoSteps } from '@/components/seo/SeoSteps';
import { SeoTrustStats } from '@/components/seo/SeoTrustStats';
import { SeoVehicleGallery } from '@/components/seo/SeoVehicleGallery';
import { SeoFaq } from '@/components/seo/SeoFaq';
import { SeoNearbyCities } from '@/components/seo/SeoNearbyCities';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function SeoLocalPage() {
  const { slug } = useParams();
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#ff4605] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
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

  // Build section_images lookup
  const sectionImageMap = {};
  (page.section_images || []).forEach(si => { sectionImageMap[si.section_index] = si.url; });

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

      {/* 1. Hero */}
      <SeoHero page={page} />

      {/* 2. Sections with alternating images + mid-page CTA */}
      <div className="max-w-6xl mx-auto">
        {page.sections?.map((section, i) => (
          <div key={i}>
            <SeoSection
              section={section}
              index={i}
              imageUrl={sectionImageMap[i]}
              locationName={locationName}
            />
            {/* CTA after section index 1 */}
            {i === 1 && (
              <div className="px-4">
                <SeoCtaBlock variant="inline" ctaText={page.cta_text} testId="mid-cta" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Steps */}
      <SeoSteps />

      {/* 4. Trust Stats */}
      {page.trust_block !== false && <SeoTrustStats locationName={locationName} />}

      {/* 5. Vehicle Gallery */}
      {page.vehicles_block !== false && (
        <SeoVehicleGallery vehicles={page.gallery_vehicles} locationName={locationName} />
      )}

      {/* 6. Nearby Cities / Local SEO block */}
      <SeoNearbyCities page={page} locationName={locationName} />

      {/* 7. FAQ */}
      <SeoFaq faq={page.faq} locationName={locationName} />

      {/* 8. Final CTA */}
      <SeoCtaBlock variant="final" ctaText={page.cta_text} testId="final-cta" />

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

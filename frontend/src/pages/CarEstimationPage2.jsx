import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertTriangle, Phone, ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLeadResult } from '@/lib/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function CarEstimationPage2() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('lead_id') || '';

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!leadId) { setError('Lien invalide'); setLoading(false); return; }
    getLeadResult(leadId)
      .then(data => setLead(data))
      .catch(() => setError('Impossible de charger les donnees.'))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#ff4605] animate-spin" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-4">{error || 'Donnees introuvables'}</p>
          <Link to="/"><Button className="bg-[#ff4605] text-white rounded-xl">Retour a l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const vehicle = lead.vehicle || {};
  const car = `${vehicle.make || ''} ${vehicle.model || ''}`.trim();

  return (
    <div data-testid="car-estimation-page-2" className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/" data-testid="estimation2-logo">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
          </Link>
          <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">
            Venteflash<span className="text-[#ff4605]">auto</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-[#ff4605]" />
          </div>
          <h1 data-testid="estimation2-title" className="font-['Mulish'] text-3xl sm:text-4xl font-[900] text-[#2B3A67] mb-3">
            Demande enregistree
          </h1>
          <p className="text-gray-500 text-lg">Vehicule non roulant - estimation sur place requise.</p>
          <p className="text-gray-400 text-xs mt-2" data-testid="estimation2-ref">Ref: {lead.id}</p>
        </div>

        {car && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-6 md:p-8 mb-6 animate-fade-in-up" data-testid="estimation2-vehicle">
            <h2 className="font-['Mulish'] text-lg font-bold text-[#2B3A67] mb-4">Votre vehicule</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Vehicule</span><p className="font-bold text-[#2B3A67]">{car}</p></div>
              {lead.plate && <div><span className="text-gray-400">Immatriculation</span><p className="font-bold text-[#2B3A67]">{lead.plate}</p></div>}
              {vehicle.year && <div><span className="text-gray-400">Annee</span><p className="font-bold text-[#2B3A67]">{vehicle.year}</p></div>}
              {lead.mileage > 0 && <div><span className="text-gray-400">Kilometrage</span><p className="font-bold text-[#2B3A67]">{Number(lead.mileage).toLocaleString('fr-FR')} km</p></div>}
            </div>
          </div>
        )}

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6 animate-fade-in-up" data-testid="estimation2-notice">
          <h2 className="font-['Mulish'] text-base font-bold text-orange-800 mb-3">Estimation sur place</h2>
          <p className="text-sm text-orange-700 mb-3">
            Votre vehicule etant non roulant, un expert se deplacera pour realiser l'estimation directement chez vous ou sur le lieu de stationnement du vehicule.
          </p>
          <div className="flex items-start gap-2 text-sm text-orange-700">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Un conseiller vous contactera sous 24h pour organiser le deplacement.</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 mb-6 animate-fade-in-up" data-testid="estimation2-next-steps">
          <h2 className="font-['Mulish'] text-lg font-bold text-[#2B3A67] mb-4">Prochaines etapes</h2>
          <div className="space-y-4">
            {[
              { num: '1', text: 'Un conseiller vous contactera sous 24h' },
              { num: '2', text: 'Un expert se deplace pour evaluer votre vehicule' },
              { num: '3', text: 'Vous recevez une offre ferme et le paiement sous 48h' },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff4605]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#ff4605]">{num}</span>
                </div>
                <p className="text-sm text-gray-600 pt-1">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#2B3A67] rounded-xl p-6 text-center animate-fade-in-up" data-testid="estimation2-contact">
          <p className="text-white/80 text-sm mb-2">Une question ?</p>
          <a href="tel:0142000000" className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-4">
            <Phone className="w-5 h-5" />
            01 42 00 00 00
          </a>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6" data-testid="estimation2-back-home">
              Retour a l'accueil <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

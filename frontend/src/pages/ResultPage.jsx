import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Car, Phone, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function ResultPage() {
  const [searchParams] = useSearchParams();

  const car = searchParams.get('car') || '';
  const carNumber = searchParams.get('car_number') || '';
  const price = parseFloat(searchParams.get('price')) || 0;
  const reg = searchParams.get('reg') || '';
  const km = searchParams.get('km') || '';
  const insertedId = searchParams.get('inserted_id') || '';
  const garage = searchParams.get('garage') || '';
  const rdvDate = searchParams.get('rdv_date') || '';
  const rdvTime = searchParams.get('rdv_time') || '';

  return (
    <div data-testid="result-page" className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/" data-testid="result-logo">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
          </Link>
          <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">
            Venteflash<span className="text-[#ff4605]">auto</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
        {/* Success icon */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 data-testid="result-title" className="font-['Mulish'] text-3xl sm:text-4xl font-[900] text-[#2B3A67] mb-3">
            Merci !
          </h1>
          <p className="text-gray-500 text-lg">Votre demande a ete enregistree avec succes.</p>
          {insertedId && (
            <p className="text-gray-400 text-xs mt-2" data-testid="result-ref">Ref: {insertedId}</p>
          )}
        </div>

        {/* Estimation card (only if price > 0, i.e. drivable) */}
        {price > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-6 md:p-8 text-center mb-6 animate-fade-in-up stagger-1" data-testid="result-estimation">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Car className="w-5 h-5 text-[#ff4605]" />
              <span className="text-sm font-semibold text-gray-500">
                {car} {reg ? `(${reg})` : ''}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">Estimation pour votre vehicule</p>
            <p data-testid="result-price" className="font-['Mulish'] text-5xl sm:text-6xl font-[900] text-[#ff4605] mb-2">
              {Number(price).toLocaleString('fr-FR')} EUR
            </p>
            {carNumber && <p className="text-sm text-gray-400">Immatriculation : {carNumber}</p>}
            {km && <p className="text-sm text-gray-400">{Number(km).toLocaleString('fr-FR')} km</p>}
          </div>
        )}

        {/* Appointment confirmation */}
        {garage && rdvDate && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 mb-6 animate-fade-in-up stagger-1" data-testid="result-appointment">
            <h2 className="font-['Mulish'] text-lg font-bold text-[#2B3A67] mb-3">Votre rendez-vous</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#2B3A67]">
                <MapPin className="w-4 h-4 text-[#ff4605] shrink-0" />
                <span className="font-bold">{garage}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2B3A67]">
                <Calendar className="w-4 h-4 text-[#ff4605] shrink-0" />
                <span>{new Date(rdvDate + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {rdvTime && <span className="font-bold">{rdvTime}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 mb-6 animate-fade-in-up stagger-2" data-testid="result-next-steps">
          <h2 className="font-['Mulish'] text-lg font-bold text-[#2B3A67] mb-4">Prochaines etapes</h2>
          <div className="space-y-4">
            {[
              { num: '1', text: 'Un conseiller vous contactera sous 24h pour confirmer les details' },
              { num: '2', text: 'Prenez rendez-vous dans le centre le plus proche pour l\'expertise' },
              { num: '3', text: 'Recevez votre offre finale et le paiement sous 24h' },
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

        {/* Contact */}
        <div className="bg-[#2B3A67] rounded-xl p-6 text-center animate-fade-in-up stagger-3" data-testid="result-contact">
          <p className="text-white/80 text-sm mb-2">Une question ?</p>
          <a href="tel:0142000000" className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-4">
            <Phone className="w-5 h-5" />
            01 42 00 00 00
          </a>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6" data-testid="result-back-home">
              Retour a l'accueil
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

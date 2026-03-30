import { useState } from 'react';
import { CheckCircle2, Car, User, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitLead } from '@/lib/api';
import { trackEvent, EVENTS } from '@/lib/tracking';
import { Link } from 'react-router-dom';

export default function FormStep6({ data }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await submitLead(data);
      trackEvent(EVENTS.LEAD_SUBMITTED, {
        marque: data.vehicule.marque,
        modele: data.vehicule.modele,
        estimation: data.estimation,
      });
      setSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div data-testid="form-success" className="text-center py-8">
        <div className="w-20 h-20 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[#22C55E]" />
        </div>
        <h2 className="font-['Mulish'] text-2xl sm:text-3xl font-bold text-[#2B3A67] mb-3">
          Demande envoyee !
        </h2>
        <p className="text-gray-500 mb-2">
          Merci {data.client.prenom} ! Votre demande a ete enregistree.
        </p>
        <p className="text-gray-500 mb-8 text-sm">
          Nous vous contacterons au <strong>{data.client.telephone}</strong> pour confirmer votre rendez-vous.
        </p>
        <Link to="/">
          <Button
            data-testid="back-to-home-btn"
            className="bg-[#2B3A67] hover:bg-[#3B4D8A] text-white font-bold px-8 py-3 rounded-xl"
          >
            Retour a l'accueil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="form-step-6">
      <h2 className="font-['Mulish'] text-2xl sm:text-3xl font-bold text-[#2B3A67] mb-2">
        Recapitulatif
      </h2>
      <p className="text-gray-500 mb-8 text-sm">Verifiez vos informations avant validation.</p>

      <div className="space-y-5">
        {/* Vehicle */}
        <div className="bg-[#F3F4F6] rounded-xl p-5" data-testid="recap-vehicle">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-5 h-5 text-[#FF5C00]" />
            <h3 className="font-bold text-[#2B3A67]">Vehicule</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Marque:</span> <strong>{data.vehicule.marque}</strong></div>
            <div><span className="text-gray-500">Modele:</span> <strong>{data.vehicule.modele}</strong></div>
            <div><span className="text-gray-500">Immat:</span> <strong>{data.vehicule.immatriculation}</strong></div>
            <div><span className="text-gray-500">Km:</span> <strong>{data.vehicule.kilometrage ? `${Number(data.vehicule.kilometrage).toLocaleString('fr-FR')} km` : '-'}</strong></div>
            <div><span className="text-gray-500">Etat:</span> <strong className="capitalize">{data.vehicule.etat}</strong></div>
            <div><span className="text-gray-500">Annee:</span> <strong>{data.vehicule.annee}</strong></div>
          </div>
          {data.estimation && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-gray-500 text-sm">Estimation:</span>
              <span className="font-['Mulish'] text-xl font-black text-[#FF5C00] ml-2">
                {Number(data.estimation).toLocaleString('fr-FR')} EUR
              </span>
            </div>
          )}
        </div>

        {/* Client */}
        <div className="bg-[#F3F4F6] rounded-xl p-5" data-testid="recap-client">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-[#FF5C00]" />
            <h3 className="font-bold text-[#2B3A67]">Coordonnees</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Nom:</span> <strong>{data.client.prenom} {data.client.nom}</strong></div>
            <div><span className="text-gray-500">Email:</span> <strong>{data.client.email}</strong></div>
            <div><span className="text-gray-500">Tel:</span> <strong>{data.client.telephone}</strong></div>
            <div><span className="text-gray-500">CP:</span> <strong>{data.client.code_postal}</strong></div>
          </div>
        </div>

        {/* RDV */}
        <div className="bg-[#F3F4F6] rounded-xl p-5" data-testid="recap-rdv">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-[#FF5C00]" />
            <h3 className="font-bold text-[#2B3A67]">Rendez-vous</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Date:</span> <strong>{data.rdv.date}</strong></div>
            <div><span className="text-gray-500">Heure:</span> <strong>{data.rdv.heure}</strong></div>
            <div className="col-span-2"><span className="text-gray-500">Centre:</span> <strong className="capitalize">{data.rdv.centre}</strong></div>
          </div>
        </div>

        {data.photos.length > 0 && (
          <p className="text-sm text-gray-500">{data.photos.length} photo(s) jointe(s)</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-4" data-testid="submit-error">{error}</p>}

      <Button
        data-testid="form-submit-btn"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-14 mt-8 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#FF5C00]/30 active:scale-95 transition-all"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Envoi en cours...</>
        ) : (
          'Valider ma demande'
        )}
      </Button>
    </div>
  );
}

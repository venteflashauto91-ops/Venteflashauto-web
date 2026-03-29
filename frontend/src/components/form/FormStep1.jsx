import { useState } from 'react';
import { Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { identifyVehicle, estimateVehicle } from '@/lib/api';
import { trackEvent, EVENTS } from '@/lib/tracking';

export default function FormStep1({ data, update, onNext }) {
  const [immat, setImmat] = useState(data.vehicule.immatriculation);
  const [loading, setLoading] = useState(false);
  const [identified, setIdentified] = useState(false);
  const [error, setError] = useState('');

  const handleIdentify = async () => {
    if (!immat.trim()) {
      setError('Veuillez entrer votre immatriculation');
      return;
    }
    setLoading(true);
    setError('');
    try {
      trackEvent(EVENTS.ESTIMATION_STARTED, { immatriculation: immat });
      const result = await identifyVehicle(immat.trim());
      if (result.found) {
        update('vehicule', {
          immatriculation: immat.trim(),
          marque: result.marque,
          modele: result.modele,
          version: result.version,
          annee: result.annee,
          carburant: result.carburant,
        });
        const est = await estimateVehicle({ marque: result.marque, modele: result.modele, annee: result.annee });
        update('estimation', est.estimation);
        setIdentified(true);
        trackEvent(EVENTS.ESTIMATION_COMPLETED, { marque: result.marque, modele: result.modele, estimation: est.estimation });
      } else {
        setError('Vehicule non trouve. Verifiez votre immatriculation.');
      }
    } catch {
      setError('Erreur lors de l\'identification. Reessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="form-step-1">
      <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#2B3A67] mb-2">
        Identifiez votre vehicule
      </h2>
      <p className="text-gray-500 mb-8">
        Entrez votre plaque d'immatriculation pour commencer.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-[#2B3A67] mb-2">Immatriculation</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#003DA5] rounded-l-xl flex items-center justify-center z-10">
                <span className="text-white font-extrabold text-xs">F</span>
              </div>
              <input
                data-testid="form-immat-input"
                type="text"
                value={immat}
                onChange={(e) => { setImmat(e.target.value.toUpperCase()); setIdentified(false); setError(''); }}
                placeholder="AA-123-BB"
                className="w-full h-14 pl-14 pr-4 text-xl font-black tracking-widest uppercase text-center bg-white border-2 border-gray-200 focus:border-[#E84D1C] focus:ring-4 focus:ring-[#E84D1C]/10 rounded-xl placeholder:text-gray-300 transition-all"
                maxLength={10}
                onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
              />
            </div>
            <Button
              data-testid="form-identify-btn"
              onClick={handleIdentify}
              disabled={loading}
              className="h-14 bg-[#2B3A67] hover:bg-[#3B4D8A] text-white font-bold px-6 rounded-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2" data-testid="identify-error">{error}</p>}
        </div>

        {/* Vehicle info display */}
        {identified && (
          <div data-testid="vehicle-info-display" className="bg-[#F3F4F6] rounded-xl p-5 border border-gray-200 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              <span className="text-sm font-semibold text-[#22C55E]">Vehicule identifie</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Marque</p>
                <p className="font-bold text-[#2B3A67]">{data.vehicule.marque}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modele</p>
                <p className="font-bold text-[#2B3A67]">{data.vehicule.modele}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Version</p>
                <p className="font-bold text-[#2B3A67] text-sm">{data.vehicule.version}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Annee</p>
                <p className="font-bold text-[#2B3A67]">{data.vehicule.annee}</p>
              </div>
            </div>
            {data.estimation && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Estimation indicative</p>
                <p className="font-['Outfit'] text-3xl font-black text-[#E84D1C]">
                  {Number(data.estimation).toLocaleString('fr-FR')} EUR
                </p>
                <p className="text-xs text-gray-400 mt-1">Prix final apres expertise en centre</p>
              </div>
            )}
          </div>
        )}

        {identified && (
          <Button
            data-testid="form-step1-next"
            onClick={onNext}
            className="w-full h-14 bg-[#E84D1C] hover:bg-[#D4410F] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#E84D1C]/30 active:scale-95 transition-all"
          >
            Continuer
          </Button>
        )}
      </div>
    </div>
  );
}

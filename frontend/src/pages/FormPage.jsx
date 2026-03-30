import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FormStep1 from '@/components/form/FormStep1';
import FormStep2 from '@/components/form/FormStep2';
import FormStep3 from '@/components/form/FormStep3';
import FormStep4 from '@/components/form/FormStep4';
import FormStep5 from '@/components/form/FormStep5';
import FormStep6 from '@/components/form/FormStep6';
import { trackEvent, EVENTS } from '@/lib/tracking';
import { savePartialLead } from '@/lib/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

const STEP_NAMES = ['Identification', 'Informations', 'Etat & Photos', 'Coordonnees', 'Rendez-vous', 'Confirmation'];

export default function FormPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    vehicule: {
      immatriculation: searchParams.get('immat') || '',
      marque: '', modele: '', version: '', annee: '', carburant: '',
      kilometrage: '', etat: '', roulant: null, importe: null,
      premiere_main: null, carnet_entretien: null, factures_entretien: null, defauts: '',
    },
    client: { nom: '', prenom: '', email: '', telephone: '', code_postal: '' },
    rdv: { date: '', heure: '', centre: '' },
    photos: [],
    estimation: null,
  });

  useEffect(() => {
    trackEvent(EVENTS.PAGE_VIEW, { page: 'form', step });
  }, [step]);

  const updateFormData = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof data === 'object' && !Array.isArray(data)
        ? { ...prev[section], ...data }
        : data,
    }));
  }, []);

  const nextStep = useCallback(() => {
    const next = Math.min(step + 1, 6);
    trackEvent(EVENTS.FORM_STEP_COMPLETED, { step, stepName: STEP_NAMES[step - 1] });
    savePartialLead(step, formData).catch(() => {});
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, formData]);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const progress = ((step) / 6) * 100;

  const stepComponents = {
    1: <FormStep1 data={formData} update={updateFormData} onNext={nextStep} />,
    2: <FormStep2 data={formData} update={updateFormData} onNext={nextStep} onBack={prevStep} />,
    3: <FormStep3 data={formData} update={updateFormData} onNext={nextStep} onBack={prevStep} />,
    4: <FormStep4 data={formData} update={updateFormData} onNext={nextStep} onBack={prevStep} />,
    5: <FormStep5 data={formData} update={updateFormData} onNext={nextStep} onBack={prevStep} />,
    6: <FormStep6 data={formData} />,
  };

  return (
    <div data-testid="form-page" className="min-h-screen bg-[#F3F4F6]">
      {/* Compact header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="form-logo-link">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto object-contain" />
            <span className="font-['Poppins'] font-extrabold text-sm text-[#2B3A67]">
              <span className="text-[#2B3A67]">V</span>enteflash<span className="text-[#E84D1C]">auto</span>
            </span>
          </Link>
          {step < 6 && (
            <span className="text-sm text-gray-500 font-medium">
              Etape {step}/6
            </span>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        {/* Progress bar */}
        {step < 6 && (
          <div className="mb-8" data-testid="form-progress">
            <Progress value={progress} className="h-2 bg-gray-200 [&>div]:bg-[#E84D1C]" />
            <div className="flex justify-between mt-3">
              {STEP_NAMES.slice(0, 5).map((name, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i + 1 < step ? 'bg-[#22C55E] text-white' :
                      i + 1 === step ? 'bg-[#E84D1C] text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`hidden md:inline text-xs font-medium ${i + 1 === step ? 'text-[#2B3A67]' : 'text-gray-400'}`}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-100 p-6 md:p-8 animate-slide-in-right">
          {step > 1 && step < 6 && (
            <button
              data-testid="form-back-btn"
              onClick={prevStep}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E2A44] mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          {stepComponents[step]}
        </div>

        {/* Reassurance */}
        {step < 6 && (
          <div className="text-center mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Sans engagement</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Donnees securisees</span>
          </div>
        )}
      </div>
    </div>
  );
}

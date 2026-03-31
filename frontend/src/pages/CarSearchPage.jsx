import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, Camera, X, ArrowRight, ArrowLeft, Car, Fuel, Calendar, Gauge, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { identifyVehicle, getQuotation, uploadPhoto, trackEvent } from '@/lib/api';
import { getMergedUtm, storeUtm, buildUrlWithUtm } from '@/lib/utm';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

const FUEL_OPTIONS = ['Essence', 'Diesel', 'Hybride', 'Electrique', 'GPL'];
const GEARBOX_OPTIONS = ['Manuelle', 'Automatique'];
const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', desc: 'Comme neuf' },
  { value: 'bon', label: 'Bon', desc: 'Usure normale' },
  { value: 'moyen', label: 'Moyen', desc: 'Defauts visibles' },
  { value: 'mauvais', label: 'Mauvais', desc: 'Degats importants' },
];

export default function CarSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plate = searchParams.get('car_info') || '';
  const fileRef = useRef(null);

  // State
  const [step, setStep] = useState('loading'); // loading | vehicle | details | contact
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vehicle, setVehicle] = useState(null);
  const [vehicleRaw, setVehicleRaw] = useState({});
  const [mileage, setMileage] = useState('');
  const [isDrivable, setIsDrivable] = useState(true);
  const [condition, setCondition] = useState('');
  const [defects, setDefects] = useState('');
  const [firstOwner, setFirstOwner] = useState(false);
  const [serviceBook, setServiceBook] = useState(false);
  const [serviceInvoices, setServiceInvoices] = useState(false);
  const [imported, setImported] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [client, setClient] = useState({ firstname: '', lastname: '', email: '', phone: '', postal_code: '' });

  // Store UTM on mount
  useEffect(() => { storeUtm(); }, []);

  // Auto-identify vehicle on mount
  useEffect(() => {
    if (!plate) {
      setStep('vehicle');
      setError('Aucune plaque fournie');
      return;
    }
    identifyPlate(plate);
  }, [plate]);

  const identifyPlate = async (p) => {
    setLoading(true);
    setError('');
    setStep('loading');
    try {
      trackEvent('estimation_started', { plate: p });
      const result = await identifyVehicle(p);
      if (result.found) {
        setVehicle(result.vehicle);
        setVehicleRaw(result.vehicle);
        trackEvent('vehicle_identified', { plate: p, make: result.vehicle.make, model: result.vehicle.model });
        setStep('vehicle');
      } else {
        setError('Vehicule non trouve');
        setStep('vehicle');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur identification');
      setStep('vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleNonDrivable = () => {
    const utm = getMergedUtm();
    navigate(buildUrlWithUtm('/car-estimation-page-2', { car_info: plate }));
  };

  const handleGetQuote = async () => {
    if (!mileage || !condition) return;

    // If not drivable, redirect
    if (!isDrivable) {
      handleNonDrivable();
      return;
    }

    setLoading(true);
    try {
      const result = await getQuotation(vehicleRaw, parseInt(mileage));
      setPricing(result.pricing);
      trackEvent('estimation_completed', {
        plate,
        make: vehicle?.make,
        base_price: result.pricing?.base_price,
        final_price: result.pricing?.final_price,
      });
      setStep('contact');
    } catch {
      setError('Erreur lors du calcul de l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const preview = URL.createObjectURL(file);
        setPreviews(prev => [...prev, preview]);
        const result = await uploadPhoto(file);
        setPhotos(prev => [...prev, result.path]);
        trackEvent('photo_uploaded');
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitLead = async () => {
    if (!client.firstname || !client.lastname || !client.email || !client.phone) return;
    setLoading(true);
    try {
      await trackEvent('lead_submitted', { plate, make: vehicle?.make });
      navigate(buildUrlWithUtm('/result-page', {
        plate,
        make: vehicle?.make || '',
        model: vehicle?.model || '',
        year: vehicle?.year || '',
        mileage,
        price: pricing?.final_price || 0,
        firstname: client.firstname,
        // Pass lead data via state to avoid exposing in URL
      }), {
        state: {
          vehicle: vehicleRaw,
          plate,
          mileage: parseInt(mileage),
          isDrivable,
          condition,
          defects,
          firstOwner,
          serviceBook,
          serviceInvoices,
          imported,
          client,
          pricing,
          photos,
          utm: getMergedUtm(),
        }
      });
    } catch {
      setError('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const updateClient = (field, val) => setClient(prev => ({ ...prev, [field]: val }));

  // ── Render ────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff4605] animate-spin mx-auto mb-4" />
          <p className="text-[#2B3A67] font-semibold">Identification du vehicule...</p>
          <p className="text-gray-400 text-sm mt-1">{plate}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="car-search-page" className="min-h-screen bg-[#F3F4F6]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="car-search-logo">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
            <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">
              Venteflash<span className="text-[#ff4605]">auto</span>
            </span>
          </Link>
          <span className="text-sm text-gray-500 font-medium">
            {step === 'vehicle' ? 'Votre vehicule' : step === 'details' ? 'Details' : 'Vos coordonnees'}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm" data-testid="car-search-error">
            {error}
          </div>
        )}

        {/* ── STEP: VEHICLE ──────────────────────────────────── */}
        {step === 'vehicle' && (
          <div className="space-y-6 animate-fade-in-up" data-testid="step-vehicle">
            <h1 className="font-['Mulish'] text-2xl sm:text-3xl font-[900] text-[#2B3A67]">
              Votre vehicule
            </h1>

            {vehicle && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6" data-testid="vehicle-card">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-bold text-green-600">Vehicule identifie</span>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{plate}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <InfoItem icon={Car} label="Marque" value={vehicle.make} />
                  <InfoItem icon={Car} label="Modele" value={vehicle.model} />
                  <InfoItem icon={Settings2} label="Version" value={vehicle.version} className="col-span-2 sm:col-span-1" />
                  <InfoItem icon={Calendar} label="Annee" value={vehicle.year} />
                  <InfoItem icon={Fuel} label="Carburant" value={vehicle.fuel} />
                  <InfoItem icon={Gauge} label="Puissance" value={`${vehicle.power} ch`} />
                </div>
              </div>
            )}

            {/* Mileage + condition */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-[#2B3A67] mb-2">Kilometrage *</label>
                <Input
                  data-testid="input-mileage"
                  type="number"
                  placeholder="Ex: 85000"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl text-lg"
                />
              </div>

              <BoolField label="Le vehicule est-il roulant ?" value={isDrivable} onChange={setIsDrivable} testId="field-drivable" />

              {!isDrivable && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                  Pour un vehicule non roulant, vous serez redirige vers un formulaire adapte.
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-[#2B3A67] mb-3">Etat general *</label>
                <div className="grid grid-cols-2 gap-3">
                  {CONDITION_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      data-testid={`condition-${c.value}`}
                      type="button"
                      onClick={() => setCondition(c.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        condition === c.value ? 'bg-[#ff4605]/10 border-[#ff4605]' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`font-bold text-sm ${condition === c.value ? 'text-[#ff4605]' : 'text-[#2B3A67]'}`}>{c.label}</p>
                      <p className="text-xs text-gray-500">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <BoolField label="Premiere main ?" value={firstOwner} onChange={setFirstOwner} testId="field-first-owner" />
              <BoolField label="Carnet d'entretien ?" value={serviceBook} onChange={setServiceBook} testId="field-service-book" />
              <BoolField label="Factures d'entretien ?" value={serviceInvoices} onChange={setServiceInvoices} testId="field-invoices" />
              <BoolField label="Vehicule importe ?" value={imported} onChange={setImported} testId="field-imported" />

              <div>
                <label className="block text-sm font-bold text-[#2B3A67] mb-2">Defauts (optionnel)</label>
                <Textarea
                  data-testid="input-defects"
                  placeholder="Decrivez les defauts..."
                  value={defects}
                  onChange={(e) => setDefects(e.target.value)}
                  className="min-h-[80px] border-2 border-gray-200 focus:border-[#ff4605] rounded-xl"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-bold text-[#2B3A67] mb-2">Photos (optionnel)</label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
                <div className="flex flex-wrap gap-3">
                  {previews.map((p, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    data-testid="btn-upload-photo"
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#ff4605] flex flex-col items-center justify-center gap-0.5 transition-colors"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <><Camera className="w-5 h-5 text-gray-400" /><span className="text-[10px] text-gray-400">Ajouter</span></>}
                  </button>
                </div>
              </div>
            </div>

            <Button
              data-testid="btn-get-quote"
              onClick={handleGetQuote}
              disabled={!mileage || !condition || loading}
              className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isDrivable ? 'Obtenir mon estimation' : 'Continuer (vehicule non roulant)'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* ── STEP: CONTACT ──────────────────────────────────── */}
        {step === 'contact' && (
          <div className="space-y-6 animate-fade-in-up" data-testid="step-contact">
            <button onClick={() => setStep('vehicle')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#2B3A67] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>

            <h1 className="font-['Mulish'] text-2xl sm:text-3xl font-[900] text-[#2B3A67]">
              Votre estimation
            </h1>

            {/* Estimation display */}
            {pricing && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 text-center" data-testid="estimation-card">
                <p className="text-sm text-gray-500 mb-1">Estimation pour votre {vehicle?.make} {vehicle?.model}</p>
                <p className="font-['Mulish'] text-4xl sm:text-5xl font-[900] text-[#ff4605]">
                  {Number(pricing.final_price).toLocaleString('fr-FR')} EUR
                </p>
                <p className="text-xs text-gray-400 mt-2">Prix indicatif - offre finale apres expertise en centre</p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 space-y-4">
              <h2 className="font-['Mulish'] text-lg font-bold text-[#2B3A67]">Vos coordonnees</h2>
              <p className="text-sm text-gray-500">Pour recevoir votre offre definitive</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Prenom *" testId="input-firstname" placeholder="Jean" value={client.firstname} onChange={(v) => updateClient('firstname', v)} />
                <FormInput label="Nom *" testId="input-lastname" placeholder="Dupont" value={client.lastname} onChange={(v) => updateClient('lastname', v)} />
              </div>
              <FormInput label="Email *" testId="input-email" type="email" placeholder="jean@email.com" value={client.email} onChange={(v) => updateClient('email', v)} />
              <FormInput label="Telephone *" testId="input-phone" type="tel" placeholder="06 12 34 56 78" value={client.phone} onChange={(v) => updateClient('phone', v)} />
              <FormInput label="Code postal" testId="input-postal" placeholder="75011" value={client.postal_code} onChange={(v) => updateClient('postal_code', v)} maxLength={5} />
            </div>

            <Button
              data-testid="btn-submit-lead"
              onClick={handleSubmitLead}
              disabled={!client.firstname || !client.lastname || !client.email || !client.phone || loading}
              className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Valider ma demande
            </Button>

            <div className="text-center flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Sans engagement</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Donnees securisees</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function InfoItem({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="font-bold text-[#2B3A67] text-sm">{value || '-'}</p>
    </div>
  );
}

function BoolField({ label, value, onChange, testId }) {
  return (
    <div>
      <p className="text-sm font-bold text-[#2B3A67] mb-2">{label}</p>
      <div className="flex gap-3">
        {[{ val: true, lbl: 'Oui' }, { val: false, lbl: 'Non' }].map(({ val, lbl }) => (
          <button
            key={lbl}
            data-testid={`${testId}-${lbl.toLowerCase()}`}
            type="button"
            onClick={() => onChange(val)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
              value === val ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormInput({ label, testId, value, onChange, type = 'text', placeholder = '', maxLength }) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#2B3A67] mb-2">{label}</label>
      <Input
        data-testid={testId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl"
      />
    </div>
  );
}

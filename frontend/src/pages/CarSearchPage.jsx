import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Car, Calendar, Fuel, DoorOpen, Cog, Gauge, CheckCircle2, Loader2, ArrowRight, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { identifyVehicle, uploadPhoto, estimateLead, trackEvent } from '@/lib/api';
import { getMergedUtm, storeUtm } from '@/lib/utm';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';
const MAX_PHOTOS = 5;

const BOOLEAN_QUESTIONS = [
  { key: 'imported', label: 'Le vehicule est-il importe ?' },
  { key: 'firstHand', label: 'Etes-vous le premier proprietaire ?' },
  { key: 'maintenanceBook', label: 'Avez-vous le carnet d\'entretien ?' },
  { key: 'maintenanceInvoices', label: 'Avez-vous les factures d\'entretien ?' },
];

export default function CarSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plate = searchParams.get('car_info') || '';

  // ── Vehicle state ──
  const [loading, setLoading] = useState(false);
  const [identified, setIdentified] = useState(false);
  const [error, setError] = useState('');
  const [values, setValues] = useState({});
  const [versions, setVersions] = useState([]);
  const updateValue = (k, v) => setValues(p => ({ ...p, [k]: v }));

  // ── Flow state ──
  const [drivable, setDrivable] = useState('');
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [boolAnswers, setBoolAnswers] = useState({});
  const setBool = (k, v) => setBoolAnswers(p => ({ ...p, [k]: v }));

  // ── Contact ──
  const [client, setClient] = useState({ firstname: '', lastname: '', email: '', phone: '', postal_code: '' });
  const updateClient = (k, v) => setClient(p => ({ ...p, [k]: v }));

  // ── Photos ──
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);

  // ── UTM ──
  useEffect(() => { storeUtm(); }, []);

  // ── Identify ──
  useEffect(() => {
    if (!plate) return;
    setLoading(true);
    identifyVehicle(plate)
      .then(data => {
        if (data.found) {
          setValues(data.vehicle || {});
          setVersions(data.versions || []);
          setIdentified(true);
        } else {
          setError(data.error || 'Vehicule non trouve');
        }
      })
      .catch(() => setError('Erreur identification'))
      .finally(() => setLoading(false));
  }, [plate]);

  // ── Progressive reveal logic ──
  const allFieldsFilled = identified && values.version && values.km;
  const showDrivableSection = allFieldsFilled;
  const showReasonSection = drivable === 'no';
  const showAdditionalSection = drivable === 'yes';
  const allBoolsAnswered = BOOLEAN_QUESTIONS.every(q => boolAnswers[q.key]);

  // Photos section: visible after booleans (drivable) or reason (non-drivable)
  const showPhotosSection = (drivable === 'yes' && allBoolsAnswered) || (drivable === 'no' && reason);
  // Contact section: visible after photos section is shown
  const showContactSection = showPhotosSection;
  // Submit button: visible after contact is filled
  const contactFilled = client.firstname && client.lastname && client.email && client.phone;
  const showSubmitButton = showContactSection && contactFilled;

  // ── Photos ──
  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) break;
      try {
        const result = await uploadPhoto(file);
        setPhotos(p => [...p, result.path]);
        setPreviews(p => [...p, URL.createObjectURL(file)]);
      } catch { /* skip */ }
    }
    setUploading(false);
  };
  const removePhoto = (i) => { setPhotos(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); };

  // ── Submit: estimate → save → webhook → redirect ──
  const handleSubmit = async () => {
    if (!contactFilled) return;
    setSubmitting(true);
    setError('');
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tracking = {};
      ['gclid', 'gbraid', 'gad_source', 'gad_campaignid',
       'hsa_acc', 'hsa_cam', 'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_kw', 'hsa_mt', 'hsa_tgt', 'hsa_net',
      ].forEach(key => { const v = urlParams.get(key); if (v) tracking[key] = v; });
      tracking.landing_page = window.location.href;
      tracking.referrer = document.referrer || '';

      const result = await estimateLead({
        plate,
        vehicle: values,
        mileage: parseInt(values.km) || 0,
        is_drivable: drivable === 'yes',
        condition: drivable === 'no' ? 'non_roulant' : 'bon',
        defects: reasonText,
        first_owner: boolAnswers.firstHand === 'yes',
        service_book: boolAnswers.maintenanceBook === 'yes',
        service_invoices: boolAnswers.maintenanceInvoices === 'yes',
        imported: boolAnswers.imported === 'yes',
        client,
        photos,
        utm: getMergedUtm(),
        tracking,
        source: 'website',
      });

      if (!result?.lead_id) throw new Error('Sauvegarde echouee');

      // ── Analytics ──
      const serverPrice = result.price || 0;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'custom_price_simulation', value: serverPrice, currency: 'EUR', item_name: `${values.make} ${values.model}`, transaction_id: `TX_${Date.now()}` });
      trackEvent('lead_estimated', { plate, make: values.make, lead_id: result.lead_id });

      // ── Redirect based on drivable status ──
      if (result.is_drivable) {
        navigate(`/estimation-result?lead_id=${result.lead_id}`);
      } else {
        navigate(`/car-estimation-page-2?lead_id=${result.lead_id}`);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde. Veuillez reessayer.');
    } finally { setSubmitting(false); }
  };

  // ── Manual plate entry ──
  const [manualPlate, setManualPlate] = useState('');
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualPlate.trim()) return;
    navigate(`/car-search?car_info=${encodeURIComponent(manualPlate.trim().toUpperCase())}`);
  };

  // ── Loading screen ──
  if (loading && !identified) {
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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="car-search-logo">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
            <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">Venteflash<span className="text-[#ff4605]">auto</span></span>
          </Link>
          <span className="text-xs text-gray-400">{plate}</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm" data-testid="error-msg">{error}</div>}

        {/* No plate */}
        {!plate && !identified && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-plate-input">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Entrez votre plaque d'immatriculation</h2>
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <Input data-testid="input-manual-plate" type="text" placeholder="ex: AA123BB" value={manualPlate} onChange={(e) => setManualPlate(e.target.value.toUpperCase())} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl text-lg flex-1" maxLength={12} />
              <Button data-testid="btn-manual-search" type="submit" disabled={!manualPlate.trim()} className="h-12 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6 disabled:opacity-50">Rechercher</Button>
            </form>
          </section>
        )}

        {/* SECTION 1: Vehicle Info */}
        {identified && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-vehicle-info">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67]">Votre vehicule</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{plate}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-5">
              <ReadonlyField label="Marque" value={values.make} icon={Car} testId="field-make" />
              <ReadonlyField label="Modele" value={values.model} icon={Car} testId="field-model" />
              <ReadonlyField label="Annee" value={values.year} icon={Calendar} testId="field-year" />
              <ReadonlyField label="Carburant" value={values.fuel} icon={Fuel} testId="field-fuel" />
              <ReadonlyField label="Carrosserie" value={values.body} icon={Car} testId="field-body" />
              <ReadonlyField label="Portes" value={values.doors} icon={DoorOpen} testId="field-doors" />
              <ReadonlyField label="Boite" value={values.gearbox} icon={Cog} testId="field-gearbox" />
              <ReadonlyField label="Puissance" value={values.power ? `${values.power} ch` : ''} icon={Gauge} testId="field-power" />
              <ReadonlyField label="Date MEC" value={values.dateRelease} icon={Calendar} testId="field-reg" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Version *</label>
              <select data-testid="select-version" value={values.version || ''} onChange={(e) => updateValue('version', e.target.value)}
                className="w-full h-12 px-3 border-2 border-gray-200 focus:border-[#ff4605] focus:ring-2 focus:ring-[#ff4605]/10 rounded-xl bg-white text-[#2B3A67] font-medium appearance-none cursor-pointer">
                <option value="">Selectionner</option>
                {versions.map(v => <option key={v.id} value={`${v.id}: ${v.name}`}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Kilometrage *</label>
              <Input data-testid="input-km" type="number" placeholder="Ex: 85000" value={values.km || ''} onChange={(e) => updateValue('km', e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl text-lg" />
            </div>
          </section>
        )}

        {/* SECTION 2: Drivable? */}
        {showDrivableSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-drivable">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Le vehicule est-il roulant ?</h2>
            <div className="flex gap-3">
              {[{ val: 'yes', lbl: 'Oui' }, { val: 'no', lbl: 'Non' }].map(({ val, lbl }) => (
                <button key={val} data-testid={`drivable-${val}`} type="button" onClick={() => { setDrivable(val); }}
                  className={`flex-1 py-4 rounded-xl text-base font-bold border-2 transition-all ${drivable === val ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{lbl}</button>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2b: Reason (non-drivable) */}
        {showReasonSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-reason">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Motif de non roulage</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Panne mecanique', 'Accident', 'Panne electrique', 'Autre'].map(r => (
                <button key={r} data-testid={`reason-${r.toLowerCase().replace(/ /g, '-')}`} type="button" onClick={() => setReason(r)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${reason === r ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500'}`}>{r}</button>
              ))}
            </div>
            <Textarea data-testid="input-reason-text" placeholder="Precisions (optionnel)..." value={reasonText} onChange={(e) => setReasonText(e.target.value)} className="min-h-[80px] border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
          </section>
        )}

        {/* SECTION 3: Booleans (drivable=yes) */}
        {showAdditionalSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-additional">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Informations complementaires</h2>
            <div className="space-y-4">
              {BOOLEAN_QUESTIONS.map(({ key, label }) => (
                <BoolField key={key} label={label} value={boolAnswers[key]} onChange={(v) => setBool(key, v)} testId={`bool-${key}`} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: Photos (optionnel) */}
        {showPhotosSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-photos">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-1">Photos du vehicule</h2>
            <p className="text-xs text-gray-400 mb-4">Optionnel — {MAX_PHOTOS} photos maximum, 10 Mo par photo</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
            <div className="flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button data-testid="btn-upload-photo" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#ff4605] flex flex-col items-center justify-center gap-0.5 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <><Camera className="w-5 h-5 text-gray-400" /><span className="text-[10px] text-gray-400">Ajouter</span></>}
                </button>
              )}
            </div>
          </section>
        )}

        {/* SECTION 5: Contact */}
        {showContactSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-contact">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Vos coordonnees</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Prenom *" testId="input-firstname" placeholder="Jean" value={client.firstname} onChange={(v) => updateClient('firstname', v)} />
                <FormInput label="Nom *" testId="input-lastname" placeholder="Dupont" value={client.lastname} onChange={(v) => updateClient('lastname', v)} />
              </div>
              <FormInput label="Email *" testId="input-email" type="email" placeholder="jean@email.com" value={client.email} onChange={(v) => updateClient('email', v)} />
              <FormInput label="Telephone *" testId="input-phone" type="tel" placeholder="06 12 34 56 78" value={client.phone} onChange={(v) => updateClient('phone', v)} />
              <FormInput label="Code postal" testId="input-postal" placeholder="75011" value={client.postal_code} onChange={(v) => updateClient('postal_code', v)} maxLength={5} />
            </div>
          </section>
        )}

        {/* SECTION 6: Submit button */}
        {showContactSection && (
          <section className="animate-fade-in-up">
            <Button data-testid="btn-get-quote" onClick={handleSubmit} disabled={!contactFilled || submitting}
              className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {submitting ? 'Envoi en cours...' : 'Obtenir le prix de vente'}
              {!submitting && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
            <div className="text-center mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Sans engagement</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Donnees securisees</span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function ReadonlyField({ label, value, icon: Icon, testId }) {
  return (
    <div data-testid={testId}>
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">{Icon && <Icon className="w-3 h-3" />}{label}</div>
      <p className="font-bold text-[#2B3A67] text-sm">{value || '-'}</p>
    </div>
  );
}

function BoolField({ label, value, onChange, testId }) {
  return (
    <div>
      <p className="text-sm font-bold text-[#2B3A67] mb-2">{label}</p>
      <div className="flex gap-3">
        {[{ val: 'yes', lbl: 'Oui' }, { val: 'no', lbl: 'Non' }].map(({ val, lbl }) => (
          <button key={lbl} data-testid={`${testId}-${val}`} type="button" onClick={() => onChange(val)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${value === val ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>{lbl}</button>
        ))}
      </div>
    </div>
  );
}

function FormInput({ label, testId, value, onChange, type = 'text', placeholder = '', maxLength }) {
  return (
    <div>
      <label className="block text-sm font-bold text-[#2B3A67] mb-2">{label}</label>
      <Input data-testid={testId} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
    </div>
  );
}

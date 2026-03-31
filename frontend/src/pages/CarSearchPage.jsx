import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, Camera, X, ArrowRight, Car, Fuel, Calendar, Gauge, Settings2, Cog, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { identifyVehicle, getQuotation, uploadPhoto, saveLead, trackEvent } from '@/lib/api';
import { getMergedUtm, storeUtm } from '@/lib/utm';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

/* ── Fields required to unlock next sections (matches legacy valuesToOpenAdditional) ── */
const REQUIRED_VEHICLE_FIELDS = [
  'make', 'model', 'month', 'year', 'fuel', 'body', 'doors', 'gearbox', 'power', 'engineSize', 'dateRelease', 'version', 'km',
];

const BOOLEAN_QUESTIONS = [
  { key: 'imported', label: 'Vehicule importe ?' },
  { key: 'firstHand', label: 'Premiere main ?' },
  { key: 'maintenanceBook', label: 'Carnet d\'entretien ?' },
  { key: 'maintenanceInvoices', label: 'Factures d\'entretien ?' },
];

const MONTHS_FR = ['', 'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

export default function CarSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plate = searchParams.get('car_info') || searchParams.get('immat') || '';
  const fileRef = useRef(null);

  // ── Vehicle state ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identified, setIdentified] = useState(false);
  const [versions, setVersions] = useState([]);
  const [values, setValues] = useState({
    make: '', model: '', month: '', year: '', fuel: '', body: '', doors: '',
    gearbox: '', power: '', engineSize: '', dateRelease: '', version: '', km: '',
  });

  // ── Drivable / Additional ──
  const [drivable, setDrivable] = useState(null);       // null | 'yes' | 'no'
  const [reason, setReason] = useState('');
  const [reasonText, setReasonText] = useState('');

  // ── Boolean questions (only if drivable=yes) ──
  const [boolAnswers, setBoolAnswers] = useState({ imported: null, firstHand: null, maintenanceBook: null, maintenanceInvoices: null });

  // ── Photos ──
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ── Contact ──
  const [client, setClient] = useState({ firstname: '', lastname: '', email: '', phone: '', postal_code: '' });

  // ── Pricing ──
  const [pricing, setPricing] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);

  // ── UTM ──
  useEffect(() => { storeUtm(); }, []);

  // ── Auto-identify on mount ──
  useEffect(() => {
    if (plate) identifyPlate(plate);
  }, [plate]);

  // ── Progressive unlock checks ──
  const allVehicleFieldsFilled = useMemo(() => {
    return REQUIRED_VEHICLE_FIELDS.every(k => values[k] !== '' && values[k] !== null && values[k] !== undefined);
  }, [values]);

  const allBoolAnswered = useMemo(() => {
    return Object.values(boolAnswers).every(v => v !== null);
  }, [boolAnswers]);

  const showDrivableSection = allVehicleFieldsFilled;
  const showAdditionalSection = allVehicleFieldsFilled && drivable === 'yes';
  const showReasonSection = allVehicleFieldsFilled && drivable === 'no';
  const showContactSection = (drivable === 'no' && allVehicleFieldsFilled) || (drivable === 'yes' && allVehicleFieldsFilled && allBoolAnswered);

  // ── Handlers ──
  const identifyPlate = async (p) => {
    setLoading(true);
    setError('');
    try {
      trackEvent('estimation_started', { plate: p });
      const result = await identifyVehicle(p);
      if (result.found) {
        const v = result.vehicle;
        const date = v.dateRelease ? new Date(v.dateRelease) : null;
        const monthNum = date ? date.getMonth() + 1 : '';
        const monthName = date ? MONTHS_FR[date.getMonth() + 1] : '';
        setValues({
          make: v.make || '', model: v.model || '',
          month: monthName, year: v.year || (date ? date.getFullYear() : ''),
          fuel: v.fuel || '', body: v.body || '', doors: v.doors || '',
          gearbox: v.gearbox || '', power: v.power || '', engineSize: v.engineSize || '',
          dateRelease: v.dateRelease || '',
          version: '', // Must be selected by user
          km: v.km || '',
        });
        setVersions(result.versions || []);
        setIdentified(true);
        trackEvent('vehicle_identified', { plate: p, make: v.make, model: v.model });
      } else {
        setError('Vehicule non trouve. Verifiez la plaque.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'identification du vehicule.');
    } finally {
      setLoading(false);
    }
  };

  const updateValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
  const updateClient = (key, val) => setClient(prev => ({ ...prev, [key]: val }));
  const setBool = (key, val) => setBoolAnswers(prev => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const preview = URL.createObjectURL(file);
        setPreviews(p => [...p, preview]);
        const result = await uploadPhoto(file);
        setPhotos(p => [...p, result.path]);
        trackEvent('photo_uploaded');
      } catch { /* silent */ }
    }
    setUploading(false);
  };

  const removePhoto = (i) => {
    setPreviews(p => p.filter((_, idx) => idx !== i));
    setPhotos(p => p.filter((_, idx) => idx !== i));
  };

  const handleGetQuote = async () => {
    setQuoteLoading(true);
    try {
      const vehicleData = { ...values, plate };
      const result = await getQuotation(vehicleData, parseInt(values.km) || 0);
      setPricing(result.pricing);
      trackEvent('estimation_completed', { plate, base_price: result.pricing?.base_price, final_price: result.pricing?.final_price });
    } catch {
      setError('Erreur calcul estimation');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!client.firstname || !client.lastname || !client.email || !client.phone) return;
    setSubmitting(true);
    setError('');
    try {
      // 1. Collect extended tracking (legacy: gclid, gbraid, hsa_*, landing_page, referrer)
      const urlParams = new URLSearchParams(window.location.search);
      const tracking = {};
      ['gclid', 'gbraid', 'gad_source', 'gad_campaignid',
       'hsa_acc', 'hsa_cam', 'hsa_grp', 'hsa_ad', 'hsa_src', 'hsa_kw', 'hsa_mt', 'hsa_tgt', 'hsa_net',
      ].forEach(key => { const v = urlParams.get(key); if (v) tracking[key] = v; });
      tracking.landing_page = window.location.href;
      tracking.referrer = document.referrer || '';

      // 2. Save lead BEFORE redirect — server computes final price
      const saveResult = await saveLead({
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
        pricing: pricing || {},
        photos,
        utm: getMergedUtm(),
        tracking,
        source: 'website',
      });

      if (!saveResult?.id) {
        throw new Error('Sauvegarde echouee');
      }

      // 3. Use SERVER price (not client-side) for redirect
      const serverPrice = saveResult.price || 0;

      // 4. GTM dataLayer event (only after successful save)
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'custom_price_simulation',
        value: serverPrice,
        currency: 'EUR',
        item_name: `${values.make} ${values.model}`,
        transaction_id: `TX_${Date.now()}`,
      });

      trackEvent('lead_submitted', { plate, make: values.make, inserted_id: saveResult.id });

      // 5. Build redirect URL with query params (legacy-compatible)
      const versionId = values.version ? values.version.split(':')[0].trim() : '';
      const resultParams = new URLSearchParams();
      resultParams.set('reg', String(values.year || ''));
      resultParams.set('km', String(values.km || ''));
      resultParams.set('version', versionId);
      resultParams.set('drivable', drivable);
      resultParams.set('inserted_id', saveResult.inserted_id || saveResult.id);
      resultParams.set('car', `${values.make} ${values.model}`);
      resultParams.set('car_number', plate);
      resultParams.set('price', String(serverPrice));

      // Preserve UTM params
      const utm = getMergedUtm();
      Object.entries(utm).forEach(([k, v]) => {
        if (v) resultParams.set(k, v);
      });

      // 6. Redirect: drivable=no → car-estimation-page-2, else → result-page
      const targetPath = drivable === 'no' ? '/car-estimation-page-2' : '/result-page';
      window.location.href = `${window.location.origin}${targetPath}?${resultParams.toString()}`;

    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde. Veuillez reessayer.');
    } finally {
      setSubmitting(false);
    }
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
      {/* Header */}
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm" data-testid="error-msg">{error}</div>
        )}

        {/* ── No plate: show input ── */}
        {!plate && !identified && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-plate-input">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Entrez votre plaque d'immatriculation</h2>
            <form onSubmit={handleManualSearch} className="flex gap-3">
              <Input
                data-testid="input-manual-plate"
                type="text"
                placeholder="ex: AA123BB"
                value={manualPlate}
                onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl text-lg flex-1"
                maxLength={12}
              />
              <Button
                data-testid="btn-manual-search"
                type="submit"
                disabled={!manualPlate.trim()}
                className="h-12 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6 disabled:opacity-50"
              >
                Rechercher
              </Button>
            </form>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 1: Vehicle Information (always visible after identify)
           ══════════════════════════════════════════════════════ */}
        {identified && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-vehicle-info">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67]">Votre vehicule</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{plate}</span>
            </div>

            {/* Pre-filled info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-5">
              <ReadonlyField label="Marque" value={values.make} icon={Car} testId="field-make" />
              <ReadonlyField label="Modele" value={values.model} icon={Car} testId="field-model" />
              <ReadonlyField label="Mois" value={values.month} icon={Calendar} testId="field-month" />
              <ReadonlyField label="Annee" value={values.year} icon={Calendar} testId="field-year" />
              <ReadonlyField label="Carburant" value={values.fuel} icon={Fuel} testId="field-fuel" />
              <ReadonlyField label="Carrosserie" value={values.body} icon={Car} testId="field-body" />
              <ReadonlyField label="Portes" value={values.doors} icon={DoorOpen} testId="field-doors" />
              <ReadonlyField label="Boite" value={values.gearbox} icon={Cog} testId="field-gearbox" />
              <ReadonlyField label="Puissance" value={values.power ? `${values.power} ch` : ''} icon={Gauge} testId="field-power" />
              <ReadonlyField label="Vitesses" value={values.engineSize} icon={Settings2} testId="field-engine" />
              <ReadonlyField label="Date MEC" value={values.dateRelease} icon={Calendar} testId="field-reg" />
            </div>

            {/* Version dropdown (user must select) */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Version *</label>
              <select
                data-testid="select-version"
                value={values.version}
                onChange={(e) => updateValue('version', e.target.value)}
                className="w-full h-12 px-3 border-2 border-gray-200 focus:border-[#ff4605] focus:ring-2 focus:ring-[#ff4605]/10 rounded-xl bg-white text-[#2B3A67] font-medium appearance-none cursor-pointer"
              >
                <option value="">Selectionner</option>
                {versions.map(v => (
                  <option key={v.id} value={`${v.id}: ${v.name}`}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* KM (editable, pre-filled) */}
            <div>
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Kilometrage *</label>
              <Input
                data-testid="input-km"
                type="number"
                placeholder="Ex: 85000"
                value={values.km}
                onChange={(e) => updateValue('km', e.target.value)}
                className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl text-lg"
              />
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 2: Drivable? (unlocked when all vehicle fields filled)
           ══════════════════════════════════════════════════════ */}
        {showDrivableSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-drivable">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Le vehicule est-il roulant ?</h2>
            <div className="flex gap-3">
              {[{ val: 'yes', lbl: 'Oui' }, { val: 'no', lbl: 'Non' }].map(({ val, lbl }) => (
                <button
                  key={val}
                  data-testid={`drivable-${val}`}
                  type="button"
                  onClick={() => setDrivable(val)}
                  className={`flex-1 py-4 rounded-xl text-base font-bold border-2 transition-all ${
                    drivable === val ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 2b: Reason (only if NOT drivable)
           ══════════════════════════════════════════════════════ */}
        {showReasonSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-reason">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Motif de non roulage</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {['Panne mecanique', 'Accident', 'Panne electrique', 'Autre'].map(r => (
                <button
                  key={r}
                  data-testid={`reason-${r.toLowerCase().replace(/ /g, '-')}`}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    reason === r ? 'bg-[#ff4605]/10 border-[#ff4605] text-[#ff4605]' : 'bg-white border-gray-200 text-gray-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              data-testid="input-reason-text"
              placeholder="Precisions (optionnel)..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="min-h-[80px] border-2 border-gray-200 focus:border-[#ff4605] rounded-xl"
            />
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 3: Additional questions (only if drivable=yes)
           ══════════════════════════════════════════════════════ */}
        {showAdditionalSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-additional">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Informations complementaires</h2>
            <div className="space-y-4">
              {BOOLEAN_QUESTIONS.map(({ key, label }) => (
                <BoolField
                  key={key}
                  label={label}
                  value={boolAnswers[key]}
                  onChange={(v) => setBool(key, v)}
                  testId={`bool-${key}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 4: Photos (optional, visible with additional)
           ══════════════════════════════════════════════════════ */}
        {(showAdditionalSection || showReasonSection) && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-photos">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-3">Photos du vehicule (optionnel)</h2>
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
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
           SECTION 5: Contact form (unlocked per legacy logic)
           ══════════════════════════════════════════════════════ */}
        {showContactSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-contact">
            {/* Estimation preview (get quote if drivable) */}
            {drivable === 'yes' && !pricing && (
              <div className="mb-6">
                <Button
                  data-testid="btn-get-quote"
                  onClick={handleGetQuote}
                  disabled={quoteLoading}
                  className="w-full h-12 bg-[#2B3A67] hover:bg-[#3B4D8A] text-white font-bold rounded-xl"
                >
                  {quoteLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  Calculer mon estimation
                </Button>
              </div>
            )}

            {pricing && (
              <div className="bg-[#F3F4F6] rounded-xl p-5 mb-6 text-center" data-testid="estimation-preview">
                <p className="text-sm text-gray-500 mb-1">Estimation pour votre {values.make} {values.model}</p>
                <p className="font-['Mulish'] text-4xl font-[900] text-[#ff4605]">
                  {Number(pricing.final_price).toLocaleString('fr-FR')} EUR
                </p>
                <p className="text-xs text-gray-400 mt-1">Prix indicatif - offre finale apres expertise</p>
              </div>
            )}

            {drivable === 'no' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-800">
                Pour un vehicule non roulant, l'estimation sera faite sur place par nos experts.
              </div>
            )}

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

            <Button
              data-testid="btn-submit-lead"
              onClick={handleSubmit}
              disabled={!client.firstname || !client.lastname || !client.email || !client.phone || submitting}
              className="w-full h-14 mt-6 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {submitting ? 'Envoi en cours...' : 'Valider ma demande'}
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
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
        {Icon && <Icon className="w-3 h-3" />}
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
        {[{ val: 'yes', lbl: 'Oui' }, { val: 'no', lbl: 'Non' }].map(({ val, lbl }) => (
          <button
            key={lbl}
            data-testid={`${testId}-${val}`}
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

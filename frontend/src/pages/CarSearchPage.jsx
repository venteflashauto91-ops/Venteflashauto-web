import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Car, Calendar, Fuel, DoorOpen, Cog, Gauge, Settings2, CheckCircle2, Loader2, ArrowRight, Camera, X, MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { identifyVehicle, getQuotation, uploadPhoto, saveLead, trackEvent, getGarages, getAvailableSlots, getAppointmentConfig } from '@/lib/api';
import { getMergedUtm, storeUtm } from '@/lib/utm';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

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

  // ── Pricing ──
  const [pricing, setPricing] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // ── Garages & Appointments ──
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [apptConfig, setApptConfig] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

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
  // Show "Obtenir le prix" button when drivable=yes AND all booleans answered
  const showGetPriceButton = drivable === 'yes' && allBoolsAnswered && !pricing;
  // Show garages after price is displayed
  const showGarageSection = drivable === 'yes' && pricing;
  // Show contact after garage + date + slot selected (drivable) OR after reason (non-drivable)
  const showContactSection = (drivable === 'yes' && pricing && selectedGarage && selectedDate && selectedSlot) || (drivable === 'no' && reason);

  // ── Get Quote ──
  const handleGetQuote = async () => {
    setQuoteLoading(true);
    try {
      const result = await getQuotation({ ...values, plate }, parseInt(values.km) || 0);
      setPricing(result.pricing);
      // Load garages after price is shown
      const gResult = await getGarages(client.postal_code);
      setGarages(gResult.garages || []);
      const cfgResult = await getAppointmentConfig();
      setApptConfig(cfgResult);
    } catch { setError('Erreur lors du calcul'); }
    finally { setQuoteLoading(false); }
  };

  // ── Load available slots when garage + date change ──
  const loadSlots = useCallback(async (garageId, date) => {
    if (!garageId || !date) return;
    setSlotsLoading(true);
    setSelectedSlot('');
    try {
      const result = await getAvailableSlots(garageId, date);
      setAvailableSlots(result.slots || []);
    } catch { setAvailableSlots([]); }
    finally { setSlotsLoading(false); }
  }, []);

  const handleSelectGarage = (g) => {
    setSelectedGarage(g);
    setSelectedDate('');
    setSelectedSlot('');
    setAvailableSlots([]);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedGarage) loadSlots(selectedGarage.id, date);
  };

  // ── Photos ──
  const handlePhotoUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const result = await uploadPhoto(file);
        setPhotos(p => [...p, result.path]);
        setPreviews(p => [...p, URL.createObjectURL(file)]);
      } catch { /* skip */ }
    }
    setUploading(false);
  };
  const removePhoto = (i) => { setPhotos(p => p.filter((_, j) => j !== i)); setPreviews(p => p.filter((_, j) => j !== i)); };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!client.firstname || !client.lastname || !client.email || !client.phone) return;
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
        garage_id: selectedGarage?.id || null,
        garage_name: selectedGarage?.name || null,
        appointment_date: selectedDate || null,
        appointment_time: selectedSlot || null,
      });

      if (!saveResult?.id) throw new Error('Sauvegarde echouee');

      const serverPrice = saveResult.price || 0;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'custom_price_simulation', value: serverPrice, currency: 'EUR', item_name: `${values.make} ${values.model}`, transaction_id: `TX_${Date.now()}` });
      trackEvent('lead_submitted', { plate, make: values.make, inserted_id: saveResult.id });

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
      if (selectedGarage) resultParams.set('garage', selectedGarage.name);
      if (selectedDate) resultParams.set('rdv_date', selectedDate);
      if (selectedSlot) resultParams.set('rdv_time', selectedSlot);

      const utm = getMergedUtm();
      Object.entries(utm).forEach(([k, v]) => { if (v) resultParams.set(k, v); });

      const targetPath = drivable === 'no' ? '/car-estimation-page-2' : '/result-page';
      window.location.href = `${window.location.origin}${targetPath}?${resultParams.toString()}`;
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

  // ── Generate next 14 available dates ──
  const getAvailableDates = () => {
    if (!apptConfig) return [];
    const activeDays = apptConfig.active_days || [1, 2, 3, 4, 5];
    const disabledDates = new Set(apptConfig.disabled_dates || []);
    const dates = [];
    const d = new Date();
    d.setDate(d.getDate() + 1); // Start tomorrow
    while (dates.length < 14) {
      const iso = d.toISOString().split('T')[0];
      const dow = d.getDay() || 7; // 1=Mon...7=Sun
      if (activeDays.includes(dow) && !disabledDates.has(iso)) {
        dates.push({ iso, label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) });
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
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
                <button key={val} data-testid={`drivable-${val}`} type="button" onClick={() => { setDrivable(val); setPricing(null); setSelectedGarage(null); setSelectedDate(''); setSelectedSlot(''); }}
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

        {/* SECTION 3b: "Obtenir le prix de vente" button */}
        {showGetPriceButton && (
          <section className="animate-fade-in-up">
            <Button data-testid="btn-get-quote" onClick={handleGetQuote} disabled={quoteLoading}
              className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all">
              {quoteLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {quoteLoading ? 'Calcul en cours...' : 'Obtenir le prix de vente'}
            </Button>
          </section>
        )}

        {/* SECTION 4: Price display */}
        {pricing && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-lg p-6 md:p-8 animate-fade-in-up" data-testid="estimation-preview">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Estimation pour votre {values.make} {values.model}</p>
              <p className="font-['Mulish'] text-5xl sm:text-6xl font-[900] text-[#ff4605] mb-2">{Number(pricing.final_price).toLocaleString('fr-FR')} EUR</p>
              <p className="text-xs text-gray-400">Prix indicatif - offre finale apres expertise en centre</p>
            </div>
          </section>
        )}

        {/* SECTION 5: Garages (only after price, drivable=yes) */}
        {showGarageSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-garages">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-1">Choisissez votre centre</h2>
            <p className="text-xs text-gray-400 mb-4">Selectionnez le garage partenaire le plus proche</p>
            {garages.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">Aucun garage disponible</p>}
            <div className="space-y-3">
              {garages.map(g => (
                <button key={g.id} type="button" data-testid={`garage-${g.id}`} onClick={() => handleSelectGarage(g)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedGarage?.id === g.id ? 'border-[#ff4605] bg-[#ff4605]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2B3A67] text-sm">{g.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 shrink-0" />{g.address}, {g.postal_code} {g.city}</p>
                      {g.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 shrink-0" />{g.phone}</p>}
                    </div>
                    {g.hours && <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" />{g.hours}</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: Date picker (after garage selected) */}
        {selectedGarage && pricing && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-calendar">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-1">Date du rendez-vous</h2>
            <p className="text-xs text-gray-400 mb-4">Centre : {selectedGarage.name}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {getAvailableDates().map(d => (
                <button key={d.iso} type="button" data-testid={`date-${d.iso}`} onClick={() => handleSelectDate(d.iso)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all capitalize ${selectedDate === d.iso ? 'border-[#ff4605] bg-[#ff4605]/10 text-[#ff4605]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div data-testid="section-slots">
                <p className="text-sm font-bold text-[#2B3A67] mb-2">Creneaux disponibles</p>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 py-3"><Loader2 className="w-4 h-4 text-[#ff4605] animate-spin" /><span className="text-sm text-gray-400">Chargement...</span></div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Aucun creneau disponible pour cette date</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map(s => (
                      <button key={s} type="button" data-testid={`slot-${s.replace(':', '')}`} onClick={() => setSelectedSlot(s)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-bold border-2 transition-all ${selectedSlot === s ? 'border-[#ff4605] bg-[#ff4605] text-white' : 'border-gray-200 text-gray-600 hover:border-[#ff4605] hover:text-[#ff4605]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Photos (optional) */}
        {(showAdditionalSection || showReasonSection) && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-photos">
            <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-3">Photos du vehicule (optionnel)</h2>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload(e.target.files)} />
            <div className="flex flex-wrap gap-3">
              {previews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                </div>
              ))}
              <button data-testid="btn-upload-photo" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#ff4605] flex flex-col items-center justify-center gap-0.5 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <><Camera className="w-5 h-5 text-gray-400" /><span className="text-[10px] text-gray-400">Ajouter</span></>}
              </button>
            </div>
          </section>
        )}

        {/* SECTION 7: Contact + Submit */}
        {showContactSection && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-contact">
            {drivable === 'no' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-sm text-orange-800">
                Pour un vehicule non roulant, l'estimation sera faite sur place par nos experts.
              </div>
            )}

            {/* Recap for drivable */}
            {selectedGarage && selectedSlot && (
              <div className="bg-[#F3F4F6] rounded-xl p-4 mb-6" data-testid="appointment-recap">
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Recapitulatif RDV</p>
                <div className="flex items-center gap-3 text-sm text-[#2B3A67]">
                  <MapPin className="w-4 h-4 text-[#ff4605] shrink-0" />
                  <span className="font-bold">{selectedGarage.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#2B3A67] mt-1">
                  <Calendar className="w-4 h-4 text-[#ff4605] shrink-0" />
                  <span>{new Date(selectedDate + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="font-bold">{selectedSlot}</span>
                </div>
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

            <Button data-testid="btn-submit-lead" onClick={handleSubmit}
              disabled={!client.firstname || !client.lastname || !client.email || !client.phone || submitting}
              className="w-full h-14 mt-6 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50">
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

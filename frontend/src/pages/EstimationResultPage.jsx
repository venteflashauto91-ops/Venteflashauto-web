import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MapPin, Clock, Phone, Calendar, Car, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getLeadResult, getGarages, getAppointmentConfig, getAvailableSlots, bookAppointment, trackEvent } from '@/lib/api';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function EstimationResultPage() {
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('lead_id') || '';

  // ── Data from DB ──
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Garages & Appointments ──
  const [garages, setGarages] = useState([]);
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [apptConfig, setApptConfig] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  // ── Booking ──
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingResult, setBookingResult] = useState(null);

  // ── Contact RDV ──
  const [rdvContact, setRdvContact] = useState({ firstname: '', lastname: '', phone: '' });
  const updateRdvContact = (k, v) => setRdvContact(p => ({ ...p, [k]: v }));

  // ── Load lead data from DB ──
  useEffect(() => {
    if (!leadId) { setError('Lien invalide'); setLoading(false); return; }
    const load = async () => {
      try {
        const data = await getLeadResult(leadId);
        setLead(data);
        // Pre-fill RDV contact from lead data
        const c = data.client || {};
        setRdvContact({ firstname: c.firstname || '', lastname: c.lastname || '', phone: c.phone || '' });
        // Check if already booked
        if (data.lead_status === 'appointment_scheduled') {
          setBooked(true);
          setBookingResult({
            garage_name: data.garage_name,
            appointment_date: data.appointment_date,
            appointment_time: data.appointment_time,
          });
        }
        // Load garages
        const gResult = await getGarages(data.client?.postal_code);
        setGarages(gResult.garages || []);
        const cfgResult = await getAppointmentConfig();
        setApptConfig(cfgResult);
      } catch {
        setError('Impossible de charger les donnees. Verifiez le lien.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leadId]);

  // ── Load available slots ──
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
    setBookingError('');
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setBookingError('');
    if (selectedGarage) loadSlots(selectedGarage.id, date);
  };

  // ── Book appointment ──
  const rdvContactFilled = rdvContact.firstname.trim() && rdvContact.lastname.trim() && rdvContact.phone.trim();

  const handleBookAppointment = async () => {
    if (!selectedGarage || !selectedDate || !selectedSlot || !rdvContactFilled) return;
    setBooking(true);
    setBookingError('');
    try {
      const result = await bookAppointment(leadId, {
        garage_id: selectedGarage.id,
        garage_name: selectedGarage.name,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        client_firstname: rdvContact.firstname.trim(),
        client_lastname: rdvContact.lastname.trim(),
        client_phone: rdvContact.phone.trim(),
      });
      setBooked(true);
      setBookingResult(result);
      trackEvent('appointment_booked', { lead_id: leadId, garage: selectedGarage.name });
      // dataLayer for RDV
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'custom_rdv_confirmed', garage: selectedGarage.name, date: selectedDate, time: selectedSlot });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de la reservation. Veuillez reessayer.';
      setBookingError(msg);
    } finally {
      setBooking(false);
    }
  };

  // ── Generate next 14 available dates ──
  const getAvailableDates = () => {
    if (!apptConfig) return [];
    const activeDays = apptConfig.active_days || [1, 2, 3, 4, 5];
    const disabledDates = new Set(apptConfig.disabled_dates || []);
    const dates = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (dates.length < 14) {
      const iso = d.toISOString().split('T')[0];
      const dow = d.getDay() || 7;
      if (activeDays.includes(dow) && !disabledDates.has(iso)) {
        dates.push({ iso, label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) });
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#ff4605] animate-spin mx-auto mb-4" />
          <p className="text-[#2B3A67] font-semibold">Chargement de votre estimation...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-500 font-bold text-lg mb-4">{error || 'Donnees introuvables'}</p>
          <Link to="/"><Button className="bg-[#ff4605] text-white rounded-xl">Retour a l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const vehicle = lead.vehicle || {};
  const pricing = lead.pricing || {};
  const price = pricing.final_price || 0;

  return (
    <div data-testid="estimation-result-page" className="min-h-screen bg-[#F3F4F6]">
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

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">

        {/* SECTION 1: Price */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-lg p-6 md:p-8 animate-fade-in-up" data-testid="estimation-price-card">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Car className="w-5 h-5 text-[#ff4605]" />
              <span className="text-sm font-semibold text-gray-500">
                {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">Estimation pour votre vehicule</p>
            <p data-testid="estimation-price" className="font-['Mulish'] text-5xl sm:text-6xl font-[900] text-[#ff4605] mb-2">
              {Number(price).toLocaleString('fr-FR')} EUR
            </p>
            {lead.plate && <p className="text-sm text-gray-400">Immatriculation : {lead.plate}</p>}
            {lead.mileage > 0 && <p className="text-sm text-gray-400">{Number(lead.mileage).toLocaleString('fr-FR')} km</p>}
            <p className="text-xs text-gray-400 mt-2">Prix indicatif - offre finale apres expertise en centre</p>
          </div>
        </section>

        {/* BOOKED CONFIRMATION */}
        {booked && bookingResult && (
          <section className="bg-green-50 border border-green-200 rounded-xl p-6 animate-fade-in-up" data-testid="booking-confirmation">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h2 className="font-['Mulish'] text-lg font-[800] text-green-800">Rendez-vous confirme</h2>
                <p className="text-sm text-green-600">Votre rendez-vous a ete enregistre avec succes.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#2B3A67]">
                <MapPin className="w-4 h-4 text-[#ff4605] shrink-0" />
                <span className="font-bold">{bookingResult.garage_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#2B3A67]">
                <Calendar className="w-4 h-4 text-[#ff4605] shrink-0" />
                <span>{new Date(bookingResult.appointment_date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="font-bold">{bookingResult.appointment_time}</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-green-700">Un conseiller vous contactera pour confirmer les details.</p>
              <Link to="/">
                <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6" data-testid="btn-back-home">
                  Retour a l'accueil <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </section>
        )}

        {/* SECTION 2: Garages (only if not yet booked) */}
        {!booked && (
          <>
            <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-garages">
              <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-1">Prenez rendez-vous</h2>
              <p className="text-xs text-gray-400 mb-4">Selectionnez le garage partenaire le plus proche pour finaliser la vente</p>
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

            {/* SECTION 3: Date picker */}
            {selectedGarage && (
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
                          <button key={s} type="button" data-testid={`slot-${s.replace(':', '')}`} onClick={() => { setSelectedSlot(s); setBookingError(''); }}
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

            {/* SECTION 4: Contact + Recap + Confirm */}
            {selectedGarage && selectedDate && selectedSlot && (
              <section className="bg-white rounded-xl border border-gray-100 shadow-md p-5 md:p-6 animate-fade-in-up" data-testid="section-confirm-rdv">
                {/* Contact fields */}
                <h2 className="font-['Mulish'] text-lg font-[800] text-[#2B3A67] mb-4">Vos coordonnees pour le rendez-vous</h2>
                <div className="space-y-3 mb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-bold text-[#2B3A67] mb-1.5">Prenom *</label>
                      <Input data-testid="rdv-firstname" placeholder="Jean" value={rdvContact.firstname} onChange={(e) => updateRdvContact('firstname', e.target.value)}
                        className="h-11 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#2B3A67] mb-1.5">Nom *</label>
                      <Input data-testid="rdv-lastname" placeholder="Dupont" value={rdvContact.lastname} onChange={(e) => updateRdvContact('lastname', e.target.value)}
                        className="h-11 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#2B3A67] mb-1.5">Telephone portable *</label>
                    <Input data-testid="rdv-phone" type="tel" placeholder="06 12 34 56 78" value={rdvContact.phone} onChange={(e) => updateRdvContact('phone', e.target.value)}
                      className="h-11 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
                  </div>
                </div>

                {/* Recap */}
                <div className="bg-[#F3F4F6] rounded-xl p-4 mb-5" data-testid="appointment-recap">
                  <p className="text-xs text-gray-500 mb-2 font-bold uppercase">Recapitulatif de votre rendez-vous</p>
                  <div className="flex items-center gap-3 text-sm text-[#2B3A67]">
                    <MapPin className="w-4 h-4 text-[#ff4605] shrink-0" />
                    <span className="font-bold">{selectedGarage.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#2B3A67] mt-1">
                    <Calendar className="w-4 h-4 text-[#ff4605] shrink-0" />
                    <span>{new Date(selectedDate + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="font-bold">{selectedSlot}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#2B3A67] mt-1">
                    <Car className="w-4 h-4 text-[#ff4605] shrink-0" />
                    <span>{vehicle.make} {vehicle.model} — {Number(price).toLocaleString('fr-FR')} EUR</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4" data-testid="booking-error">
                    {bookingError}
                  </div>
                )}

                <Button data-testid="btn-confirm-rdv" onClick={handleBookAppointment} disabled={booking || !rdvContactFilled}
                  className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50">
                  {booking ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {booking ? 'Reservation en cours...' : 'Confirmer le rendez-vous'}
                  {!booking && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>

                <div className="text-center mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Sans engagement</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Annulation gratuite</span>
                </div>
              </section>
            )}
          </>
        )}

        {/* Contact footer */}
        <div className="bg-[#2B3A67] rounded-xl p-6 text-center animate-fade-in-up" data-testid="result-contact">
          <p className="text-white/80 text-sm mb-2">Une question ?</p>
          <a href="tel:0142000000" className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-4">
            <Phone className="w-5 h-5" />
            01 42 00 00 00
          </a>
          <Link to="/">
            <Button className="bg-[#ff4605] hover:bg-[#E65200] text-white font-bold rounded-xl px-6" data-testid="result-back-home">
              Retour a l'accueil <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

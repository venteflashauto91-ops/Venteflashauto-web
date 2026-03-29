import { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { getAppointmentSlots, getCenters } from '@/lib/api';
import { trackEvent, EVENTS } from '@/lib/tracking';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function FormStep5({ data, update, onNext, onBack }) {
  const [centers, setCenters] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const rdv = data.rdv;

  useEffect(() => {
    getCenters().then(res => {
      setCenters(res.centers);
      // Auto-select center based on code postal
      if (data.client.code_postal) {
        const prefix = data.client.code_postal.substring(0, 2);
        const match = res.centers.find(c => c.code_postal_prefix === prefix);
        if (match) update('rdv', { centre: match.id });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      update('rdv', { date: dateStr });
      getAppointmentSlots(dateStr).then(res => setSlots(res.slots)).catch(() => {});
    }
  }, [selectedDate]);

  const canContinue = rdv.date && rdv.heure && rdv.centre;

  const handleSelectSlot = (slot) => {
    update('rdv', { heure: slot });
    trackEvent(EVENTS.RDV_SELECTED, { date: rdv.date, heure: slot });
  };

  return (
    <div data-testid="form-step-5">
      <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#1E2A44] mb-2">
        Rendez-vous
      </h2>
      <p className="text-gray-500 mb-8 text-sm">Choisissez votre centre et votre creneau.</p>

      <div className="space-y-6">
        {/* Center selection */}
        <div>
          <label className="block text-sm font-bold text-[#1E2A44] mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            Centre
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {centers.map((c) => (
              <button
                key={c.id}
                data-testid={`center-select-${c.id}`}
                type="button"
                onClick={() => update('rdv', { centre: c.id })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  rdv.centre === c.id
                    ? 'bg-[#FF5C00]/10 border-[#FF5C00]'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-bold text-sm ${rdv.centre === c.id ? 'text-[#FF5C00]' : 'text-[#1E2A44]'}`}>
                  {c.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">{c.address}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-[#1E2A44] mb-3">
            <CalendarDays className="w-4 h-4 inline mr-1" />
            Date
          </label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              disabled={(date) => date < new Date() || date > addDays(new Date(), 30) || date.getDay() === 0}
              className="rounded-xl border border-gray-200"
            />
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && slots.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-[#1E2A44] mb-3">
              <Clock className="w-4 h-4 inline mr-1" />
              Creneau
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  data-testid={`slot-${slot.replace(':', '')}`}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    rdv.heure === slot
                      ? 'bg-[#FF5C00]/10 border-[#FF5C00] text-[#FF5C00]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button
        data-testid="form-step5-next"
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-14 mt-8 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#FF5C00]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Voir le recapitulatif
      </Button>
    </div>
  );
}

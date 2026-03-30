import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const boolFields = [
  { key: 'roulant', label: 'Le vehicule est-il roulant ?' },
  { key: 'importe', label: 'Vehicule importe ?' },
  { key: 'premiere_main', label: 'Premiere main ?' },
  { key: 'carnet_entretien', label: 'Carnet d\'entretien ?' },
  { key: 'factures_entretien', label: 'Factures d\'entretien ?' },
];

function BoolSelector({ label, value, onChange, testId }) {
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
              value === val
                ? 'bg-[#E84D1C]/10 border-[#E84D1C] text-[#E84D1C]'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FormStep2({ data, update, onNext, onBack }) {
  const v = data.vehicule;
  const set = (field, val) => update('vehicule', { [field]: val });

  const canContinue = v.kilometrage && v.roulant !== null;

  return (
    <div data-testid="form-step-2">
      <h2 className="font-['Poppins'] text-2xl sm:text-3xl font-bold text-[#2B3A67] mb-2">
        Informations vehicule
      </h2>
      <p className="text-gray-500 mb-2 text-sm">
        {v.marque} {v.modele} — {v.version}
      </p>
      <p className="text-gray-400 text-xs mb-8">Completez les informations pour affiner votre estimation.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-[#2B3A67] mb-2">Kilometrage</label>
          <Input
            data-testid="form-km-input"
            type="number"
            placeholder="Ex: 85000"
            value={v.kilometrage}
            onChange={(e) => set('kilometrage', e.target.value)}
            className="h-12 border-2 border-gray-200 focus:border-[#E84D1C] focus:ring-4 focus:ring-[#E84D1C]/10 rounded-xl text-lg"
          />
          <p className="text-xs text-gray-400 mt-1">Kilometrage actuel du vehicule</p>
        </div>

        {boolFields.map(({ key, label }) => (
          <BoolSelector
            key={key}
            label={label}
            value={v[key]}
            onChange={(val) => set(key, val)}
            testId={`form-${key}`}
          />
        ))}
      </div>

      <Button
        data-testid="form-step2-next"
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-14 mt-8 bg-[#E84D1C] hover:bg-[#D4410F] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#E84D1C]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuer
      </Button>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FormStep4({ data, update, onNext, onBack }) {
  const c = data.client;
  const set = (field, val) => update('client', { [field]: val });

  const canContinue = c.prenom && c.nom && c.email && c.telephone && c.code_postal;

  return (
    <div data-testid="form-step-4">
      <h2 className="font-['Mulish'] text-2xl sm:text-3xl font-bold text-[#2B3A67] mb-2">
        Vos coordonnees
      </h2>
      <p className="text-gray-500 mb-8 text-sm">Pour recevoir votre offre et planifier le rendez-vous.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Prenom</label>
            <Input
              data-testid="form-prenom"
              placeholder="Jean"
              value={c.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              className="h-12 border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Nom</label>
            <Input
              data-testid="form-nom"
              placeholder="Dupont"
              value={c.nom}
              onChange={(e) => set('nom', e.target.value)}
              className="h-12 border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2B3A67] mb-2">Email</label>
          <Input
            data-testid="form-email"
            type="email"
            placeholder="jean.dupont@email.com"
            value={c.email}
            onChange={(e) => set('email', e.target.value)}
            className="h-12 border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2B3A67] mb-2">Telephone</label>
          <Input
            data-testid="form-telephone"
            type="tel"
            placeholder="06 12 34 56 78"
            value={c.telephone}
            onChange={(e) => set('telephone', e.target.value)}
            className="h-12 border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-[#2B3A67] mb-2">Code postal</label>
          <Input
            data-testid="form-code-postal"
            type="text"
            placeholder="75011"
            value={c.code_postal}
            onChange={(e) => set('code_postal', e.target.value)}
            maxLength={5}
            className="h-12 border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
          />
        </div>
      </div>

      <Button
        data-testid="form-step4-next"
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-14 mt-8 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#FF5C00]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuer
      </Button>
    </div>
  );
}

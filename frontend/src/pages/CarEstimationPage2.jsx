import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { identifyVehicle, saveLead, trackEvent } from '@/lib/api';
import { getMergedUtm, storeUtm } from '@/lib/utm';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function CarEstimationPage2() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plate = searchParams.get('car_info') || '';

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mileage, setMileage] = useState('');
  const [defects, setDefects] = useState('');
  const [client, setClient] = useState({ firstname: '', lastname: '', email: '', phone: '', postal_code: '' });

  useEffect(() => { storeUtm(); }, []);

  useEffect(() => {
    if (plate) {
      identifyVehicle(plate).then(res => {
        if (res.found) setVehicle(res.vehicle);
      }).catch(() => {});
    }
  }, [plate]);

  const updateClient = (field, val) => setClient(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!client.firstname || !client.lastname || !client.phone) return;
    setLoading(true);
    try {
      await saveLead({
        plate,
        vehicle: vehicle || {},
        mileage: parseInt(mileage) || 0,
        is_drivable: false,
        condition: 'non_roulant',
        defects,
        first_owner: false,
        service_book: false,
        service_invoices: false,
        imported: false,
        client,
        pricing: { base_price: 0, final_price: 0, note: 'Vehicule non roulant - estimation sur place' },
        photos: [],
        utm: getMergedUtm(),
        source: 'website_non_drivable',
      });
      trackEvent('lead_submitted', { plate, type: 'non_drivable' });
      navigate('/result-page', {
        state: {
          plate,
          vehicle: vehicle || {},
          client,
          pricing: { final_price: 0 },
          nonDrivable: true,
        },
      });
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = client.firstname && client.lastname && client.phone;

  return (
    <div data-testid="car-estimation-page-2" className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link to="/">
            <img src={LOGO_URL} alt="Venteflashauto" className="h-6 md:h-7 w-auto" />
          </Link>
          <span className="font-['Mulish'] font-extrabold text-sm text-[#2B3A67]">
            Venteflash<span className="text-[#ff4605]">auto</span>
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 flex items-start gap-3" data-testid="non-drivable-warning">
          <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-['Mulish'] font-bold text-orange-800">Vehicule non roulant</h2>
            <p className="text-sm text-orange-700 mt-1">
              Pour un vehicule non roulant, l'estimation se fait sur place par nos experts.
              Remplissez le formulaire et nous vous contacterons rapidement.
            </p>
          </div>
        </div>

        {vehicle && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-md p-5 mb-6">
            <p className="text-sm text-gray-500">Vehicule identifie</p>
            <p className="font-bold text-[#2B3A67]">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
            <p className="text-xs text-gray-400">{plate}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-md p-6 space-y-4 mb-6">
          <h2 className="font-['Mulish'] text-xl font-bold text-[#2B3A67]">Informations</h2>

          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Kilometrage approximatif</label>
            <Input data-testid="input-mileage-p2" type="number" placeholder="Ex: 120000" value={mileage} onChange={(e) => setMileage(e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Description de la panne / des defauts</label>
            <Textarea data-testid="input-defects-p2" placeholder="Decrivez la panne ou les defauts du vehicule..." value={defects} onChange={(e) => setDefects(e.target.value)} className="min-h-[100px] border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
          </div>

          <h2 className="font-['Mulish'] text-xl font-bold text-[#2B3A67] pt-2">Vos coordonnees</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Prenom *</label>
              <Input data-testid="input-firstname-p2" placeholder="Jean" value={client.firstname} onChange={(e) => updateClient('firstname', e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2B3A67] mb-2">Nom *</label>
              <Input data-testid="input-lastname-p2" placeholder="Dupont" value={client.lastname} onChange={(e) => updateClient('lastname', e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Telephone *</label>
            <Input data-testid="input-phone-p2" type="tel" placeholder="06 12 34 56 78" value={client.phone} onChange={(e) => updateClient('phone', e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2B3A67] mb-2">Email</label>
            <Input data-testid="input-email-p2" type="email" placeholder="jean@email.com" value={client.email} onChange={(e) => updateClient('email', e.target.value)} className="h-12 border-2 border-gray-200 focus:border-[#ff4605] rounded-xl" />
          </div>
        </div>

        <Button
          data-testid="btn-submit-p2"
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full h-14 bg-[#ff4605] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4605]/30 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          Envoyer ma demande
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

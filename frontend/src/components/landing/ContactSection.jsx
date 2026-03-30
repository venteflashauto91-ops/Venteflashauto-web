import { MapPin, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const centers = [
  { name: 'Paris - Nation', address: '12 Rue de la Roquette, 75011 Paris', phone: '01 42 00 00 00' },
  { name: 'Lyon - Part-Dieu', address: '45 Rue Garibaldi, 69003 Lyon', phone: '04 72 00 00 00' },
  { name: 'Marseille - Prado', address: '88 Avenue du Prado, 13008 Marseille', phone: '04 91 00 00 00' },
];

export default function ContactSection() {
  const navigate = useNavigate();

  return (
    <section id="centres" data-testid="contact-section" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E84D1C] mb-3">Nos centres</p>
          <h2 className="font-['Poppins'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A67]">
            Trouvez un centre pres de chez vous
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {centers.map((c, i) => (
            <div
              key={i}
              data-testid={`center-${i}`}
              className="bg-white rounded-xl border border-gray-100 shadow-lg shadow-black/5 p-6 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E84D1C]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#E84D1C]" />
                </div>
                <div>
                  <h3 className="font-['Poppins'] font-bold text-[#2B3A67] text-lg">{c.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{c.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {c.phone}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Button
            data-testid="contact-rdv-btn"
            onClick={() => navigate('/estimation')}
            className="bg-[#E84D1C] hover:bg-[#D4410F] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#E84D1C]/30 active:scale-95"
          >
            Prendre rendez-vous
          </Button>
        </div>

        {/* Contact row */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#E84D1C]" />
            <span>01 42 00 00 00</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#E84D1C]" />
            <span>contact@venteflashauto.fr</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E84D1C]" />
            <span>5 centres en France</span>
          </div>
        </div>
      </div>
    </section>
  );
}

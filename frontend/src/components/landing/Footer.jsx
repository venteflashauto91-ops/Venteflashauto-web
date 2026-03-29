import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer data-testid="footer" className="bg-[#1E2A44] py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-[#FF5C00] rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-['Outfit'] font-extrabold text-lg text-white">
                VenteFlash<span className="text-[#FF5C00]">Auto</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Le service de reprise automobile rapide, fiable et transparent.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/estimation" className="hover:text-white transition-colors">Estimation gratuite</Link></li>
              <li><a href="#comment-ca-marche" className="hover:text-white transition-colors">Comment ca marche</a></li>
              <li><a href="#centres" className="hover:text-white transition-colors">Nos centres</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Mentions legales</a></li>
              <li><a href="#" className="hover:text-white transition-colors">CGV</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialite</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>01 42 00 00 00</li>
              <li>contact@venteflashauto.fr</li>
              <li>12 Rue de la Roquette, 75011 Paris</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">&copy; 2026 VenteFlashAuto. Tous droits reserves.</p>
          <p className="text-xs text-gray-500">Paiement securise - Sans engagement</p>
        </div>
      </div>
    </footer>
  );
}

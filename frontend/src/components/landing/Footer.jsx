import { Link } from 'react-router-dom';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/ihv05djw_venteflashauto_logo.webp';

export default function Footer() {
  return (
    <footer data-testid="footer" className="bg-[#2B3A67] py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img src={LOGO_URL} alt="Venteflashauto" className="h-7 w-auto object-contain" />
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
          <p className="text-xs text-gray-500">&copy; 2026 Venteflashauto. Tous droits reserves.</p>
          <p className="text-xs text-gray-500">Paiement securise - Sans engagement</p>
        </div>
      </div>
    </footer>
  );
}

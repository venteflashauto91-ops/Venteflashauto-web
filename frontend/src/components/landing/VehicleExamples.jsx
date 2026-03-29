import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BadgeEuro } from 'lucide-react';

const vehicles = [
  { marque: 'Peugeot', modele: '208', annee: '2021', prix: '12 500', img: 'https://images.pexels.com/photos/5076489/pexels-photo-5076489.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { marque: 'Renault', modele: 'Clio V', annee: '2020', prix: '11 200', img: 'https://images.unsplash.com/photo-1763071686691-3f77692c5ebc?crop=entropy&cs=srgb&fm=jpg&w=600' },
  { marque: 'BMW', modele: 'Serie 3', annee: '2019', prix: '24 800', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600' },
  { marque: 'Mercedes', modele: 'Classe A', annee: '2021', prix: '22 300', img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600' },
  { marque: 'Volkswagen', modele: 'Golf', annee: '2022', prix: '18 600', img: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600' },
  { marque: 'Toyota', modele: 'Yaris', annee: '2023', prix: '14 900', img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600' },
];

export default function VehicleExamples() {
  return (
    <section data-testid="vehicle-examples-section" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E84D1C] mb-3">Ventes recentes</p>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A67]">
            Ils nous ont fait confiance
          </h2>
        </div>
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {vehicles.map((v, i) => (
              <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <div
                  data-testid={`vehicle-card-${i}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-lg shadow-black/5 overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={v.img}
                      alt={`${v.marque} ${v.modele}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#2B3A67]/90 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                      <BadgeEuro className="w-4 h-4 text-[#E84D1C]" />
                      {v.prix} EUR
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-['Outfit'] font-bold text-[#2B3A67]">{v.marque} {v.modele}</h3>
                    <p className="text-sm text-gray-500">Achetee en {v.annee}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
}

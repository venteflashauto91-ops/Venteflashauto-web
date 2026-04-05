import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const vehicles = [
  { img: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/pidh4bo2_ChatGPT%20Image%205%20avr.%202026%2C%2022_35_58.png' },
  { img: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/1j154bqh_ChatGPT%20Image%205%20avr.%202026%2C%2022_42_37.png' },
  { img: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/jd8z4wk9_ChatGPT%20Image%205%20avr.%202026%2C%2022_44_58.png' },
  { img: 'https://customer-assets.emergentagent.com/job_car-buyback-1/artifacts/kp8w3bbe_ChatGPT%20Image%205%20avr.%202026%2C%2022_47_19.png' },
];

export default function VehicleExamples() {
  return (
    <section data-testid="vehicle-examples-section" className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff4605] mb-3">Ventes recentes</p>
          <h2 className="font-['Mulish'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B3A67]">
            Ils nous ont fait confiance
          </h2>
        </div>
        <Carousel opts={{ align: 'start', loop: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {vehicles.map((v, i) => (
              <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                <div
                  data-testid={`vehicle-card-${i}`}
                  className="rounded-xl overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-lg shadow-black/5"
                >
                  <img
                    src={v.img}
                    alt="Vehicule vendu"
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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

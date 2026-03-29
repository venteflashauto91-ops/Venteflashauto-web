import { useEffect } from 'react';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import SocialProof from '@/components/landing/SocialProof';
import HowItWorks from '@/components/landing/HowItWorks';
import VehicleExamples from '@/components/landing/VehicleExamples';
import Testimonials from '@/components/landing/Testimonials';
import ContactSection from '@/components/landing/ContactSection';
import Footer from '@/components/landing/Footer';
import StickyEstimate from '@/components/landing/StickyEstimate';
import { trackEvent, EVENTS } from '@/lib/tracking';

export default function LandingPage() {
  useEffect(() => {
    trackEvent(EVENTS.PAGE_VIEW, { page: 'landing' });
  }, []);

  return (
    <div data-testid="landing-page" className="min-h-screen">
      <Header />
      <HeroSection />
      <SocialProof />
      <HowItWorks />
      <VehicleExamples />
      <Testimonials />
      <ContactSection />
      <Footer />
      <StickyEstimate />
    </div>
  );
}

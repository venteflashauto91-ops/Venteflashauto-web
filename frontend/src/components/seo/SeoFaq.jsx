import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

function FaqItem({ question, answer, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      data-testid={`faq-${index}`}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${open ? 'bg-[#ff4605]/10' : 'bg-gray-100'}`}>
          <HelpCircle className={`w-4 h-4 transition-colors ${open ? 'text-[#ff4605]' : 'text-gray-400'}`} />
        </div>
        <h3 className="font-bold text-[#2B3A67] text-sm flex-1 pr-2">{question}</h3>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 pb-4 pl-16 text-sm text-gray-600 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

export function SeoFaq({ faq, locationName }) {
  if (!faq?.length) return null;

  return (
    <section className="py-14 md:py-20 bg-white" data-testid="seo-faq">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-2">
            Questions frequentes
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Tout savoir sur le rachat de voiture{locationName !== 'France' ? ` a ${locationName}` : ''}
          </p>
        </div>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <FaqItem key={i} question={f.question} answer={f.answer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

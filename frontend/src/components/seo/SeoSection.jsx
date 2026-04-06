const API = process.env.REACT_APP_BACKEND_URL;

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
}

export function SeoSection({ section, index, imageUrl, locationName }) {
  const hasImage = !!imageUrl;
  const isReversed = index % 2 === 1;
  const resolved = resolveUrl(imageUrl);

  if (!hasImage) {
    return (
      <section
        data-testid={`seo-section-${index}`}
        className="py-12 md:py-16 border-b border-gray-100 last:border-0"
      >
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-4">
            {section.title}
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-4xl">{section.content}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid={`seo-section-${index}`}
      className="py-12 md:py-16 border-b border-gray-100 last:border-0"
    >
      <div className={`max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${isReversed ? 'md:[direction:rtl]' : ''}`}>
        {/* Text */}
        <div className={isReversed ? 'md:[direction:ltr]' : ''}>
          <h2 className="font-['Mulish'] text-xl sm:text-2xl font-bold text-[#2B3A67] mb-4">
            {section.title}
          </h2>
          <p className="text-gray-600 leading-relaxed">{section.content}</p>
        </div>

        {/* Image */}
        <div className={`${isReversed ? 'md:[direction:ltr]' : ''} aspect-[4/3] rounded-2xl overflow-hidden shadow-lg`}>
          <img
            src={resolved}
            alt={`${section.title} - ${locationName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

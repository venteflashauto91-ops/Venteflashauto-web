import { useState, useRef } from 'react';
import { Camera, X, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { uploadPhoto } from '@/lib/api';
import { trackEvent, EVENTS } from '@/lib/tracking';

const conditions = [
  { value: 'excellent', label: 'Excellent', desc: 'Comme neuf, aucun defaut' },
  { value: 'bon', label: 'Bon', desc: 'Quelques traces d\'usure normales' },
  { value: 'moyen', label: 'Moyen', desc: 'Defauts visibles, reparations possibles' },
  { value: 'mauvais', label: 'Mauvais', desc: 'Degats importants, non roulant' },
];

export default function FormStep3({ data, update, onNext, onBack }) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef(null);

  const v = data.vehicule;

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const newPreviews = [...previews];
    const newPhotos = [...data.photos];

    for (const file of Array.from(files)) {
      try {
        const preview = URL.createObjectURL(file);
        newPreviews.push(preview);
        const result = await uploadPhoto(file);
        newPhotos.push(result.path);
        trackEvent(EVENTS.PHOTO_UPLOADED);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
    setPreviews(newPreviews);
    update('photos', newPhotos);
    setUploading(false);
  };

  const removePhoto = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    update('photos', data.photos.filter((_, i) => i !== index));
  };

  const canContinue = v.etat;

  return (
    <div data-testid="form-step-3">
      <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-[#1E2A44] mb-2">
        Etat du vehicule
      </h2>
      <p className="text-gray-500 mb-8 text-sm">Indiquez l'etat general et ajoutez des photos.</p>

      <div className="space-y-6">
        {/* Condition tiles */}
        <div>
          <label className="block text-sm font-bold text-[#1E2A44] mb-3">Etat general</label>
          <div className="grid grid-cols-2 gap-3">
            {conditions.map((c) => (
              <button
                key={c.value}
                data-testid={`condition-${c.value}`}
                type="button"
                onClick={() => update('vehicule', { etat: c.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  v.etat === c.value
                    ? 'bg-[#FF5C00]/10 border-[#FF5C00]'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className={`font-bold text-sm ${v.etat === c.value ? 'text-[#FF5C00]' : 'text-[#1E2A44]'}`}>
                  {c.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Defects */}
        <div>
          <label className="block text-sm font-bold text-[#1E2A44] mb-2">Defauts (optionnel)</label>
          <Textarea
            data-testid="form-defauts"
            placeholder="Decrivez les defauts eventuels..."
            value={v.defauts}
            onChange={(e) => update('vehicule', { defauts: e.target.value })}
            className="min-h-[100px] border-2 border-gray-200 focus:border-[#FF5C00] focus:ring-4 focus:ring-[#FF5C00]/10 rounded-xl"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm font-bold text-[#1E2A44] mb-2">Photos du vehicule (optionnel)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  data-testid={`remove-photo-${i}`}
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              data-testid="upload-photo-btn"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#FF5C00] flex flex-col items-center justify-center gap-1 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400">Ajouter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Button
        data-testid="form-step3-next"
        onClick={onNext}
        disabled={!canContinue}
        className="w-full h-14 mt-8 bg-[#FF5C00] hover:bg-[#E65200] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#FF5C00]/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continuer
      </Button>
    </div>
  );
}

# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers. Estimation en ligne via plaque d'immatriculation, formulaire progressif avec capture de leads. Architecture securisee remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React, react-router-dom, Shadcn/UI, Tailwind CSS, react-helmet-async
- **Backend**: FastAPI (Python), BFF architecture
- **Database**: MongoDB (motor async)
- **Security**: Autobiz credentials backend-only, admin auth JWT, secrets masked

## Funnel (v2)
### Flow Roulant
/car-search → vehicule → booleans → photos → client → "Obtenir le prix" → POST /api/leads/estimate → redirect /estimation-result?lead_id=xxx → prix + garages + RDV

### Flow Non-Roulant
/car-search → vehicule → motif → photos → client → "Obtenir le prix" → POST /api/leads/estimate → redirect /car-estimation-page-2?lead_id=xxx

## SEO Local Architecture
### Structure
- /rachat-voiture — page nationale
- /rachat-voiture/essonne — page departement
- /rachat-voiture/{city-slug} — pages villes

### Pages creees (7)
1. /rachat-voiture (nationale)
2. /rachat-voiture/essonne (departement)
3. /rachat-voiture/bretigny-sur-orge
4. /rachat-voiture/saint-michel-sur-orge
5. /rachat-voiture/sainte-genevieve-des-bois
6. /rachat-voiture/epinay-sur-orge
7. /rachat-voiture/le-plessis-pate

### SEO Page Design (v2 - Redesign Complete)
- **Modular components** in /app/frontend/src/components/seo/
- **SeoHero**: Dynamic background image (hero_image from DB, fallback Unsplash), overlay, H1, CTA, micro-reassurance
- **SeoSection**: Alternating 2-column layout (text/image) when section_images available, full-width text otherwise
- **SeoCtaBlock**: Reusable CTA with "Estimer ma voiture gratuitement en 2 minutes" + sub-bullets, 3 positions (hero, mid, final)
- **SeoSteps**: "Comment ca marche" 3-step visual block (Estimation, RDV, Paiement)
- **SeoTrustStats**: Trust block with numbers (+500, 48h, 100%, Tous) + icons
- **SeoVehicleGallery**: Vehicle cards with image, model, city, delay (gallery_vehicles from DB, defaults fallback)
- **SeoFaq**: Animated accordion with icon transitions, schema FAQ preserved
- **SeoNearbyCities**: City links, department link, optional city_image

### Image Management
- **Upload endpoint**: POST /api/admin/seo-upload (Pillow WebP conversion, max 1200px, quality 80)
- **Storage**: Emergent Object Storage, served via /api/files/
- **DB fields**: hero_image, city_image, section_images[], gallery_vehicles[]
- **Admin UI**: SeoImageUpload component with upload, preview, replace, delete
- **Security**: Auth required, type validation (jpg/png/webp), max 5MB

## Completed Features
- [x] Landing page
- [x] Formulaire progressif (vehicule → booleans → photos → client → bouton)
- [x] Auto-scroll apres selection drivable + apres booleans
- [x] Admin: config formulaire (enabled/required par champ)
- [x] Identification + Quotation Autobiz reelle
- [x] Pricing serveur (ranges + discount)
- [x] Photos upload (object storage, max 5, max 10 Mo)
- [x] Save lead AVANT redirect, lead_status=estimated
- [x] Webhooks N8N (estimation + appointment optionnel)
- [x] Page /estimation-result (prix + garages + calendrier + contact RDV + confirmation)
- [x] Page /car-estimation-page-2 (non-roulant dedie)
- [x] Booking RDV avec concurrency protection
- [x] Tracking complet (UTM + gclid + dataLayer)
- [x] Dashboard admin (JWT, settings, fourchettes, garages, RDV, leads avec filtres/stats, form config)
- [x] Recherche avancee leads (9 criteres + texte libre)
- [x] Architecture SEO locale complete (7 pages, template, admin CRUD)
- [x] Header sticky avec transition scroll
- [x] SEO pages redesign complet (8 composants modulaires)
- [x] Image upload + WebP conversion pour SEO pages
- [x] Admin gestion images SEO (hero, city, section, gallery vehicles)

## Backlog
- P1: Activer webhook reel N8N
- P1: Activer HubSpot reel
- P2: Email confirmation RDV
- P2: Connexion client et suivi vente (V2)
- P2: Ajouter plus de villes SEO (scalable via admin)
- P3: Refactoring server.py en routes separees
- P3: Refactoring AdminPage.jsx en sous-composants

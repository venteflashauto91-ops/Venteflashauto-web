# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers (similaire a venteflashauto.fr). Estimation en ligne via saisie de plaque d'immatriculation, formulaire progressif avec capture de leads et prise de rendez-vous, soumission automatisee vers API externe (plateforme VO). Optimise pour la conversion, rapide, mobile-first. Architecture securisee et moderne remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React (SPA) avec react-router-dom, Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python), architecture BFF (Backend-for-Frontend)
- **Database**: MongoDB (motor async driver)
- **Security**: Autobiz credentials NEVER exposed to frontend. All API calls server-side.
- **Design**: Polices Poppins/Mulish, couleur principale #ff4605, fond #F3F4F6

## Core Routes
- `/` - Landing page avec saisie plaque
- `/car-search?car_info=PLATE` - Formulaire progressif
- `/result-page?reg=&km=&version=&drivable=yes&inserted_id=&car=&car_number=&price=` - Confirmation roulant
- `/car-estimation-page-2?...&drivable=no&...` - Confirmation non-roulant
- `/estimation` - Redirect legacy vers /car-search

## Business Flow (migrated from legacy index.php + request-script.js)
1. User enters plate on landing page -> navigates to /car-search?car_info=PLATE
2. Backend identifies vehicle (Autobiz or mock) -> 13 fields pre-filled
3. User selects version + confirms KM -> drivable section unlocked
4. If drivable=yes: 4 boolean questions -> contact form -> "Calculer estimation" (preview price)
5. If drivable=no: reason selection -> contact form (no estimation)
6. Submit: saveLead called (SERVER computes final price) -> on success: dataLayer.push -> redirect
7. Redirect: drivable=yes -> /result-page, drivable=no -> /car-estimation-page-2
8. All data in URL query params (bookmarkable, refresh-safe, analytics-friendly)

## Pricing Logic (legacy exact replica)
```
base_price = Autobiz._quotation[AUTOBIZ_MARKET_VALUE]  // e.g. tradeIn
price = base_price

// Check ranges table: base_price BETWEEN start_value AND end_value
if (range found):
    range_price = price + (price * range_value / 100)  // e.g. range_value = -20 means -20%
    price = range_price
else:
    discount_price = price + (price * DEFAULT_DISCOUNT_PERCENT / 100)
    price = discount_price

final_price = round(price)
```
Default ranges seeded: 0-3k(-25%), 3-5k(-20%), 5-10k(-15%), 10-20k(-12%), 20-50k(-10%), 50-200k(-8%)

## API Endpoints
- `POST /api/autobiz/identify` - Identification vehicule par plaque
- `POST /api/autobiz/quote` - Estimation de prix (preview)
- `POST /api/leads/save` - Sauvegarde lead + pricing serveur + tracking + HubSpot + webhook
  Returns: { inserted_id, price, base_price, range_price, discount_price, status }
- `GET /api/leads` - Liste des leads
- `GET /api/ranges` / `POST /api/ranges` / `DELETE /api/ranges/{id}` - CRUD fourchettes
- `GET /api/settings` - Configuration globale
- `POST /api/upload` / `GET /api/files/{path}` - Upload/serve photos vehicule
- `GET /api/centers` - Centres de reprise
- `GET /api/appointments/slots` - Creneaux RDV
- `POST /api/tracking` - Evenements analytics

## DB Schema
- `car_leads`: { id, plate, vehicle, mileage, is_drivable, condition, defects, first_owner, service_book, service_invoices, imported, client, pricing{base_price, range_price, discount_price, final_price, discount_percent, range_used}, photos, tracking{utm_*, gclid, gbraid, hsa_*, landing_page, referrer, user_agent, ip}, source, status, created_at, hubspot, webhook }
- `ranges`: { id, start_value, end_value, range_value }
- `settings`: { key, autobiz_market_value, default_discount_percent }

## GTM Analytics Event
```javascript
window.dataLayer.push({ event: "custom_price_simulation", value: serverPrice, currency: "EUR", item_name: "Brand Model", transaction_id: "TX_{timestamp}" });
```

## Completed Features
- [x] Landing page avec design exact (skyline, logo, social proof, temoignages)
- [x] Formulaire progressif a revele conditionnel (13 champs -> drivable -> contact)
- [x] Identification vehicule (mockee, prete pour Autobiz reel)
- [x] Estimation de prix serveur (logique ranges legacy exacte)
- [x] Sauvegarde des leads AVANT redirection (logique legacy)
- [x] Retour legacy-compatible: inserted_id, price, base_price, range_price, discount_price
- [x] Evenement GTM dataLayer.push custom_price_simulation
- [x] Query params URL complets + UTMs preserves
- [x] Page resultat /result-page (roulant) - lecture query params
- [x] Page resultat /car-estimation-page-2 (non-roulant) - lecture query params
- [x] Pages refresh-safe (bookmarkable)
- [x] Tracking complet: UTM + gclid + gbraid + hsa_* + user_agent + ip + referrer + landing_page
- [x] HubSpot: contact + deal avec vf_* properties (behind ENABLE_HUBSPOT)
- [x] Webhook: payload legacy complet (behind ENABLE_WEBHOOK)
- [x] Upload photos vehicule
- [x] Bouton submit desactive pendant envoi
- [x] Gestion erreurs (affichage erreur si save echoue)
- [x] Autobiz quotation avec retry logic (5 tentatives, 2s delay)
- [x] Seed automatique des fourchettes de prix

## Mocked (waiting for credentials)
- autobiz_service.py: identification + cotation vehicule
  Needs: AUTOBIZ_USERNAME, AUTOBIZ_PASSWORD, AUTOBIZ_BASE_URL

## Optional integrations (behind env vars)
- HubSpot: ENABLE_HUBSPOT=true + HUBSPOT_API_KEY
- Webhook: ENABLE_WEBHOOK=true + WEBHOOK_URL

## Backlog
- P0: Connexion API Autobiz reelle (credentials)
- P1: Dashboard Admin (visualiser leads, gerer fourchettes de prix, settings)
- P1: Integration HubSpot reelle (quand credentials disponibles)
- P1: Integration Webhook reelle (quand URL disponible)
- P2: Connexion client et suivi de vente (V2)

# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers (similaire a venteflashauto.fr). Estimation en ligne via saisie de plaque d'immatriculation, formulaire progressif avec capture de leads et prise de rendez-vous, soumission automatisee vers API externe (plateforme VO). Optimise pour la conversion, rapide, mobile-first. Architecture securisee et moderne remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React (SPA) avec react-router-dom, Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python), architecture BFF (Backend-for-Frontend)
- **Database**: MongoDB (motor async driver)
- **Design**: Polices Poppins/Mulish, couleur principale #ff4605, fond #F3F4F6

## Core Routes
- `/` - Landing page avec saisie plaque
- `/car-search?car_info=PLATE` - Formulaire progressif
- `/result-page?reg=&km=&version=&drivable=yes&inserted_id=&car=&car_number=&price=` - Confirmation roulant
- `/car-estimation-page-2?reg=&km=&version=&drivable=no&inserted_id=&car=&car_number=&price=0` - Confirmation non-roulant
- `/estimation` - Redirect legacy vers /car-search

## Business Flow (matches legacy request-script.js)
1. User enters plate on landing page → navigates to /car-search?car_info=PLATE (UTMs preserved)
2. Vehicle identified via backend mock/Autobiz → 13 fields pre-filled
3. User selects version + confirms KM → drivable section unlocked
4. If drivable=yes: 4 boolean questions → contact form → "Calculer estimation" → price shown
5. If drivable=no: reason selection → contact form (no estimation)
6. Submit: saveLead called FIRST → on success: dataLayer.push(custom_price_simulation) → redirect with query params
7. Redirect: drivable=yes → /result-page, drivable=no → /car-estimation-page-2
8. Result pages read ONLY from URL query params (bookmarkable, SEO-compatible, analytics-friendly)

## GTM Analytics Event
```javascript
window.dataLayer.push({
  event: "custom_price_simulation",
  value: finalPrice,
  currency: "EUR",
  item_name: "Brand Model",
  transaction_id: "TX_{timestamp}"
});
```

## API Endpoints
- `POST /api/autobiz/identify` - Identification vehicule par plaque
- `POST /api/autobiz/quote` - Estimation de prix
- `POST /api/leads/save` - Sauvegarde lead en BDD (returns {id, status})
- `GET /api/leads` - Liste des leads
- `GET /api/ranges` - Fourchettes de prix
- `POST /api/ranges` - Creer une fourchette
- `DELETE /api/ranges/{id}` - Supprimer une fourchette
- `GET /api/settings` - Configuration globale
- `POST /api/upload` - Upload photo vehicule
- `GET /api/centers` - Centres de reprise
- `GET /api/appointments/slots` - Creneaux RDV
- `POST /api/tracking` - Evenements analytics

## DB Schema
- `car_leads`: { id, plate, vehicle, mileage, is_drivable, condition, defects, first_owner, service_book, service_invoices, imported, client, pricing, photos, utm, source, status, created_at, hubspot, webhook }
- `ranges`: { id, start_value, end_value, range_value }
- `settings`: { key, autobiz_market_value, default_discount_percent }

## Completed Features
- [x] Landing page avec design exact (skyline, logo, social proof, temoignages)
- [x] Formulaire progressif a revele conditionnel (13 champs → drivable → contact)
- [x] Identification vehicule mockee (5 plaques connues + generation aleatoire)
- [x] Estimation de prix avec logique de fourchettes
- [x] Sauvegarde des leads AVANT redirection (logique legacy)
- [x] Evenement GTM dataLayer.push custom_price_simulation
- [x] Redirect avec query params complets (reg, km, version, drivable, inserted_id, car, car_number, price + UTMs)
- [x] Page resultat /result-page (roulant) - lecture query params uniquement
- [x] Page resultat /car-estimation-page-2 (non-roulant) - lecture query params uniquement
- [x] Pages fonctionnelles apres refresh/bookmark
- [x] Preservation UTM dans les redirections
- [x] Upload photos vehicule
- [x] Events tracking
- [x] Seed automatique des fourchettes de prix par defaut
- [x] Fallback saisie manuelle de plaque si pas de param URL
- [x] Bouton submit desactive pendant envoi avec texte "Envoi en cours..."
- [x] Gestion erreurs API (affichage erreur si save echoue, pas de redirect)

## Mocked/Stubbed
- MOCK: autobiz_service.py (identification + cotation vehicule)
- STUB: hubspot_service.py (CRM - desactive)
- STUB: webhook_service.py (webhook - desactive)

## Backlog
- P0: Connexion API Autobiz reelle (necessite credentials AUTOBIZ_USERNAME, AUTOBIZ_PASSWORD, AUTOBIZ_BASE_URL)
- P1: Dashboard Admin (visualiser leads, gerer fourchettes de prix)
- P1: Integration HubSpot reelle (necessite HUBSPOT_API_KEY)
- P1: Integration Webhook reelle (necessite WEBHOOK_URL)
- P2: Connexion client et suivi de vente (V2)

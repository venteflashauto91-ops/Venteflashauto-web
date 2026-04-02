# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers. Estimation en ligne via plaque d'immatriculation, formulaire progressif avec capture de leads. Architecture securisee remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React, react-router-dom, Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python), BFF architecture
- **Database**: MongoDB (motor async)
- **Security**: Autobiz credentials backend-only, admin auth JWT, secrets masked

## Funnel (v2 - refactored April 2026)

### Flow Roulant
```
/car-search → véhicule → version+KM → drivable=oui → 4 booleans → photos (opt) → client contact
→ "Obtenir le prix de vente"
→ POST /api/leads/estimate (save lead_status=estimated, calc prix, webhook N8N)
→ redirect /estimation-result?lead_id=xxx
→ GET /api/leads/{lead_id}/result (prix depuis DB, refresh-safe)
→ garages → calendrier → créneau → "Confirmer le RDV"
→ PUT /api/leads/{lead_id}/appointment (lead_status=appointment_scheduled, webhook 2 opt)
→ confirmation affichée
```

### Flow Non-Roulant
```
/car-search → véhicule → version+KM → drivable=non → motif → photos (opt) → client contact
→ "Obtenir le prix de vente"
→ POST /api/leads/estimate (save lead_status=estimated, prix=0, webhook N8N)
→ redirect /car-estimation-page-2?lead_id=xxx
→ page dédiée sans garages, message "estimation sur place"
```

## Lead Status Flow
- `estimated` → lead créé, webhook envoyé, prix calculé, pas encore de RDV
- `appointment_scheduled` → garage + créneau confirmés, lead mis à jour

## API Endpoints
- `POST /api/leads/estimate` — créer lead + calculer prix + webhook
- `GET /api/leads/{lead_id}/result` — charger lead pour page résultat
- `PUT /api/leads/{lead_id}/appointment` — réserver RDV, mettre à jour statut
- `POST /api/autobiz/identify` — identification véhicule
- `POST /api/autobiz/quote` — cotation véhicule
- `GET /api/garages` — garages actifs
- `GET /api/appointments/available` — créneaux disponibles
- `GET /api/admin/stats` — statistiques (conversion rate, estimated vs appointed)
- `GET /api/admin/leads` — leads avec filtres (lead_status, has_appointment, garage_id, date)
- Admin CRUD: garages, ranges, settings, appointment-config

## Autobiz API Integration (REAL)
- **Auth**: POST `{base_url}/users/v1/auth` → accessToken
- **Identify**: GET `{base_url}/referential/v1/car-details/registration/{plate}/FR`
- **Quotation**: GET `{base_url}/quotation/v1/version/{versionId}/year/{year}/mileage/{mileage}/quotation`

## Pricing Logic
```
base_price = Autobiz._quotation[tradeIn]
if range BETWEEN start_value AND end_value:
    price = base_price + (base_price * range_value / 100)
else:
    price = base_price + (base_price * DEFAULT_DISCOUNT_PERCENT / 100)
final_price = round(price)
```

## Webhooks
1. **Webhook Estimation** (ENABLE_WEBHOOK) — au moment de l'estimation, payload legacy complet + lead_status
2. **Webhook Appointment** (ENABLE_WEBHOOK_APPOINTMENT) — au moment du RDV, payload avec garage+créneau

## Completed Features
- [x] Landing page
- [x] Formulaire progressif refactoré (véhicule → booleans → photos → client → bouton)
- [x] Identification véhicule via Autobiz réelle
- [x] Quotation via Autobiz réelle
- [x] Pricing serveur (ranges + discount default)
- [x] Photos upload (object storage, max 5, max 10 Mo)
- [x] Save lead AVANT redirect, prix serveur, lead_status=estimated
- [x] Webhook N8N au moment estimation (non-bloquant si échec)
- [x] Webhook N8N optionnel au moment RDV (ENABLE_WEBHOOK_APPOINTMENT)
- [x] Page /estimation-result — prix + garages + calendrier + RDV (chargé depuis DB, refresh-safe)
- [x] Page /car-estimation-page-2 — non-roulant dédié (chargé depuis DB)
- [x] Booking RDV avec concurrency protection
- [x] Tracking complet (UTM + gclid + gbraid + hsa_* + user_agent + ip)
- [x] dataLayer.push pour analytics
- [x] Dashboard admin avec auth JWT
- [x] Admin: Settings, Fourchettes CRUD, Garages CRUD, RDV config
- [x] Admin: Leads avec filtres (lead_status, has_appointment) + stats conversion
- [x] Settings dynamiques (DB → .env fallback, cache 60s)
- [x] Distinction claire estimated vs appointment_scheduled dans admin

## Backlog
- P1: Activer et tester HubSpot réel (API key via admin)
- P1: Activer et tester Webhook réel (URL N8N via admin)
- P2: Email confirmation RDV (structure préparée)
- P2: Connexion client et suivi de vente (V2)

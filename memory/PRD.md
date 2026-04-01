# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers. Estimation en ligne via plaque d'immatriculation, formulaire progressif avec capture de leads. Architecture securisee remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React, react-router-dom, Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python), BFF architecture
- **Database**: MongoDB (motor async)
- **Security**: Autobiz credentials backend-only, admin auth JWT, secrets masked

## Autobiz API Integration (REAL)
- **Auth**: POST `{base_url}/users/v1/auth` — credentials in HTTP headers (username, password) → returns `accessToken`
- **Identify**: GET `{base_url}/referential/v1/car-details/registration/{plate}/FR` → returns vehicle details + versions with real IDs
- **Quotation**: GET `{base_url}/quotation/v1/version/{versionId}/year/{year}/mileage/{mileage}/quotation` → returns `_quotation` with `tradeIn`, `b2cMarketValue`, etc.
- **Retry**: 5 attempts with 2s delay on quotation
- **Fallback**: Mock data if credentials not configured or API error

## Pricing Logic
```
base_price = Autobiz._quotation[tradeIn]
if range BETWEEN start_value AND end_value:
    price = base_price + (base_price * range_value / 100)
else:
    price = base_price + (base_price * DEFAULT_DISCOUNT_PERCENT / 100)
final_price = round(price)
```

## Completed Features
- [x] Landing page design exact
- [x] Formulaire progressif (13 champs, drivable branching)
- [x] Identification vehicule via API Autobiz reelle (/referential/v1/car-details/registration)
- [x] Quotation via API Autobiz reelle (/quotation/v1)
- [x] Pricing serveur (ranges legacy + discount default)
- [x] saveLead AVANT redirect, prix serveur, dataLayer.push
- [x] Query params URL (refresh-safe, analytics-compatible)
- [x] Tracking complet (UTM + gclid + gbraid + hsa_* + user_agent + ip)
- [x] HubSpot: contact + deal vf_* (behind ENABLE_HUBSPOT)
- [x] Webhook: payload legacy complet (behind ENABLE_WEBHOOK)
- [x] Dashboard admin avec auth JWT
- [x] Admin: Settings, Fourchettes CRUD, Leads, Test Autobiz
- [x] Settings dynamiques (DB → .env fallback, cache 60s)
- [x] Bouton "Tester la connexion" Autobiz dans l'admin

## Backlog
- P1: Integration HubSpot reelle (API key via admin dashboard)
- P1: Integration Webhook reelle (URL via admin dashboard)
- P2: Connexion client et suivi de vente (V2)

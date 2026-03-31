# VenteFlashAuto - PRD

## Problem Statement
Site web de reprise de vehicules pour particuliers (similaire a venteflashauto.fr). Estimation en ligne via saisie de plaque d'immatriculation, formulaire progressif avec capture de leads. Architecture securisee et moderne remplacant un plugin WordPress legacy.

## Architecture
- **Frontend**: React (SPA), react-router-dom, Shadcn/UI, Tailwind CSS
- **Backend**: FastAPI (Python), BFF architecture
- **Database**: MongoDB (motor async)
- **Security**: Autobiz credentials backend-only, admin auth JWT, secrets masked

## Core Routes
- `/` - Landing page
- `/car-search?car_info=PLATE` - Formulaire progressif
- `/result-page?...` - Confirmation roulant (query params)
- `/car-estimation-page-2?...` - Confirmation non-roulant (query params)
- `/admin` - Dashboard admin (protege par JWT)

## Business Flow
1. Saisie plaque → identification → 13 champs → version → drivable
2. Roulant: booleans → contact → estimation → saveLead serveur → dataLayer.push → redirect /result-page
3. Non-roulant: raison → contact → saveLead serveur → redirect /car-estimation-page-2
4. Prix calcule cote serveur (ranges table + Autobiz quotation)

## Admin Dashboard
- **Auth**: Mot de passe dans .env (`ADMIN_PASSWORD`) → JWT token 24h
- **Configuration**: Autobiz API, Pricing, HubSpot, Webhook (toggles + secrets masques)
- **Fourchettes**: CRUD table ranges (start/end/percentage)
- **Leads**: Liste paginee avec details expandables
- **Dynamic settings**: Services lisent MongoDB en priorite, fallback .env (cache 60s)

## API Endpoints
### Public
- `POST /api/autobiz/identify` - Identification vehicule
- `POST /api/autobiz/quote` - Estimation de prix (preview)
- `POST /api/leads/save` - Sauvegarde lead (returns pricing breakdown)

### Admin (JWT protege)
- `POST /api/admin/login` - Auth admin
- `GET/POST /api/admin/settings` - Configuration globale
- `GET/POST/DELETE /api/admin/ranges` - Fourchettes de prix
- `GET /api/admin/leads` - Liste des leads
- `GET /api/admin/stats` - Statistiques dashboard

## Completed Features
- [x] Landing page design exact
- [x] Formulaire progressif (13 champs, drivable branching)
- [x] Pricing serveur (ranges legacy + discount default)
- [x] saveLead AVANT redirect, prix serveur, dataLayer.push
- [x] Query params URL (refresh-safe, analytics-compatible)
- [x] Tracking complet (UTM + gclid + gbraid + hsa_* + user_agent + ip)
- [x] HubSpot: contact + deal vf_* (behind ENABLE_HUBSPOT)
- [x] Webhook: payload legacy complet (behind ENABLE_WEBHOOK)
- [x] Dashboard admin avec 3 onglets (Configuration, Fourchettes, Leads)
- [x] Auth admin JWT (mot de passe .env uniquement)
- [x] Secrets masques (jamais exposes en clair)
- [x] Settings dynamiques (DB → .env fallback, cache 60s)
- [x] Autobiz retry logic (5 tentatives, 2s delay)

## Mocked
- autobiz_service.py (identification + cotation vehicule)

## Backlog
- P0: Connexion API Autobiz reelle (credentials via admin dashboard)
- P1: Integration HubSpot reelle (API key via admin dashboard)
- P1: Integration Webhook reelle (URL via admin dashboard)
- P2: Connexion client et suivi de vente (V2)

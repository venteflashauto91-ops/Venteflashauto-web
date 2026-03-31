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
- `/result-page` - Page de confirmation apres soumission
- `/estimation` - Redirect legacy vers /car-search

## API Endpoints
- `POST /api/autobiz/identify` - Identification vehicule par plaque
- `POST /api/autobiz/quote` - Estimation de prix
- `POST /api/leads/save` - Sauvegarde lead en BDD
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
- `car_leads`: { vehicle, client, pricing, is_drivable, condition, defects, photos, utm, status, created_at }
- `ranges`: { start_value, end_value, range_value }
- `settings`: { key, autobiz_market_value, default_discount_percent }

## Completed Features (March 2026)
- [x] Landing page avec design exact (skyline, logo, social proof, temoignages)
- [x] Formulaire progressif a revele conditionnel (13 champs -> drivable -> contact)
- [x] Identification vehicule mockee (5 plaques connues + generation aleatoire)
- [x] Estimation de prix avec logique de fourchettes
- [x] Sauvegarde des leads en MongoDB
- [x] Page resultat avec prix et prochaines etapes
- [x] Upload photos vehicule
- [x] Suivi UTM parameters
- [x] Events tracking
- [x] Seed automatique des fourchettes de prix par defaut
- [x] Nettoyage fichiers obsoletes (FormStep1-6, FormPage, CarEstimationPage2)
- [x] Fallback saisie manuelle de plaque si pas de param URL

## Mocked/Stubbed
- MOCK: autobiz_service.py (identification + cotation vehicule)
- STUB: hubspot_service.py (CRM - desactive)
- STUB: webhook_service.py (webhook - desactive)

## Backlog
- P0: Connexion API Autobiz reelle (necessite credentials utilisateur)
- P1: Dashboard Admin (visualiser leads, gerer fourchettes de prix)
- P1: Integration HubSpot reelle (necessite HUBSPOT_API_KEY)
- P1: Integration Webhook reelle (necessite WEBHOOK_URL)
- P2: Connexion client et suivi de vente (V2)

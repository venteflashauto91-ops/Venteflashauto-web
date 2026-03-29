# VenteFlash Auto - PRD

## Problem Statement
Site de reprise de vehicules pour particuliers (style venteflashauto.fr) avec estimation en ligne, formulaire multi-etapes, capture de leads, prise de RDV, et envoi automatique vers une API VO.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI (port 3000)
- **Backend**: FastAPI + MongoDB + Object Storage (port 8001)
- **Database**: MongoDB (leads, partial_leads, files, tracking_events)
- **Storage**: Emergent Object Storage (photos vehicules)

## User Personas
1. **Vendeur particulier** - Veut vendre rapidement son vehicule avec estimation transparente
2. **Admin plateforme** - Consulte les leads et gere les RDV (futur)

## Core Requirements
- [x] Landing page conversion-optimized avec Hero, Social Proof, How It Works, Testimonials, Contact
- [x] Formulaire multi-etapes (6 steps): Identification -> Infos -> Etat/Photos -> Coordonnees -> RDV -> Confirmation
- [x] API mock identification vehicule (remplacable par Autobiz)
- [x] Estimation de prix indicative
- [x] Upload photos vehicule (Object Storage cloud)
- [x] Prise de RDV avec calendrier + creneaux
- [x] Stockage leads MongoDB
- [x] Tracking evenements (page_view, estimation_started, lead_submitted, etc.)
- [x] Sauvegarde leads partiels (abandon)
- [x] Sticky CTA button
- [x] Mobile-first responsive design

## What's Been Implemented (2026-03-29)
- Full landing page with all sections
- Complete 6-step form flow (identification through confirmation)
- Backend API: vehicle/identify, vehicle/estimate, leads CRUD, upload, appointments, centers, tracking
- Object Storage integration for vehicle photos
- Mock vehicle identification with 8+ test plates
- Lead storage in MongoDB with full data
- Partial lead saving for abandonment tracking
- Responsive design (mobile + desktop)

## Prioritized Backlog
### P0 (Critical - Next)
- [ ] Brancher API Autobiz reelle pour identification vehicule
- [ ] Brancher API plateforme VO pour envoi leads

### P1 (Important)
- [ ] Espace client (login, suivi vente)
- [ ] Dashboard admin pour consulter les leads
- [ ] Notifications email (confirmation RDV, suivi)
- [ ] Google Analytics integration

### P2 (Nice to have)
- [ ] A/B testing framework
- [ ] Estimation IA avancee
- [ ] Geolocalisation centres
- [ ] SMS notifications
- [ ] SEO optimization (meta tags, sitemap)

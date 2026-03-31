# VenteFlash Auto - PRD

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI + MongoDB + Object Storage
- **Services**: autobiz_service, pricing_service, hubspot_service, webhook_service
- **Database**: car_leads, ranges, settings, files, tracking_events

## Business Flow
1. User enters plate on homepage
2. Redirect to /car-search?car_info=PLATE (preserves UTM)
3. Backend identifies vehicle via Autobiz (mock until credentials configured)
4. Vehicle data prefilled on form
5. User completes mileage, condition, details
6. Backend calculates price via ranges
7. User fills contact form
8. Lead saved to car_leads
9. Redirect to /result-page
10. Optional: HubSpot + webhook integrations (stubs ready)

## Pages
- / - Landing page (hero, social proof, how it works, testimonials, centers, footer)
- /car-search - Vehicle form + estimation + contact
- /result-page - Confirmation + estimation display
- /car-estimation-page-2 - Non-drivable vehicles flow

## API Routes
- POST /api/autobiz/identify - Vehicle identification (backend-only)
- POST /api/autobiz/quote - Price quotation + range pricing
- POST /api/leads/save - Save complete lead
- GET /api/leads - List leads
- GET /api/ranges - List price ranges
- POST /api/ranges - Create range
- DELETE /api/ranges/{id} - Delete range
- GET /api/settings - Configuration status

## Env Variables
- AUTOBIZ_USERNAME, AUTOBIZ_PASSWORD, AUTOBIZ_BASE_URL
- AUTOBIZ_MARKET_VALUE=tradeIn
- DEFAULT_DISCOUNT_PERCENT=0
- HUBSPOT_API_KEY, ENABLE_HUBSPOT=false
- WEBHOOK_URL, ENABLE_WEBHOOK=false

## What's Been Implemented (2026-03-31)
- [x] Secure backend-only Autobiz integration (mock active)
- [x] Range-based pricing with 6 default brackets
- [x] Full lead capture flow (plate → identify → quote → contact → save)
- [x] Non-drivable vehicles alternative flow
- [x] UTM parameter preservation
- [x] Object Storage for photos
- [x] HubSpot + Webhook stubs
- [x] Landing page with all sections

## Backlog
### P0
- [ ] Configure real Autobiz credentials
- [ ] Connect real HubSpot API key
### P1
- [ ] Admin dashboard for leads/ranges management
- [ ] Email notifications
- [ ] Real webhook integration

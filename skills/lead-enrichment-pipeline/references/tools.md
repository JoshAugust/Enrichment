# Tool Reference

## Apollo.io

**Config:** `.config/apollo/config.json` → `api_key`

### Org Enrichment (1 credit)
```
GET https://api.apollo.io/api/v1/organizations/enrich?domain={domain}
Headers: x-api-key: {key}, Content-Type: application/json
```
Returns: `organization.estimated_num_employees`, `organization.name`, `organization.industry`, `organization.founded_year`

### People Search (FREE)
```
POST https://api.apollo.io/api/v1/mixed_people/api_search
Body: { "q_organization_domains": "domain.com", "per_page": 3, "person_titles": ["CEO","CTO","Founder","Co-founder","President","VP","Director","Owner","Managing Director","COO","CFO","Head of"] }
```

### People Match + Phone Reveal (1 + 8 credits)
```
POST https://api.apollo.io/api/v1/people/match
Body: { "first_name": "...", "last_name": "...", "organization_name": "...", "domain": "...", "reveal_phone_number": true, "webhook_url": "{tunnel_url}/webhook/apollo-phone" }
```
Phone reveals are ASYNC — webhook receives: `{ people: [{ phone_numbers: [{ sanitized_number, type_cd, confidence_cd }] }] }`

### Rate Limits
- 50 requests/minute max
- Use 1.2s delay between calls
- On 429: wait 60s and retry

## Google Maps Places API

**Config:** `.config/google-maps/config.json` → `api_key`
**Project:** joshua-personal-gmail
**Free tier:** 10,000 requests/month

### Text Search
```
POST https://places.googleapis.com/v1/places:searchText
Headers: X-Goog-Api-Key: {key}, X-Goog-FieldMask: places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.types
Body: { "textQuery": "Company Name software", "maxResultCount": 1 }
```

### Existing Implementation
`jordan.ai/sources/google-maps.js` (202 lines) — handles search, phone extraction, category matching.

## HubSpot

**Config:** `.config/hubspot/config.json` → `access_token`
**Portal:** 244821378 (na2 region)

### List Companies (paginated)
```
GET https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=domain,name&after={cursor}
Headers: Authorization: Bearer {token}
```

### Rate Limits
- 100 requests per 10 seconds
- Paginate with `paging.next.after`

## Orange Slice

**Config:** `.config/orangeslice/config.json` → API key
**Status:** Credits DEPLETED as of 2026-04-02 (402 error). Use Google Maps Places API instead.

### Previously Available Services
- `services.googleMaps.scrape()` — 10 credits/result
- `services.person.contact.get()` — 275 credits (email+phone from LinkedIn URL)
- `services.company.revenue()` — 2 credits (NOT wired up in SDK)

## Cloudflare Tunnel (for webhook)

Quick tunnel for Apollo phone reveal webhooks:
```bash
cloudflared tunnel --url http://localhost:{port}
```
URL changes on restart (quick tunnels, no account). Extract from stderr output.

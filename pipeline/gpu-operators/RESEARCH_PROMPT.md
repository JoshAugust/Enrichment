# GPU Operator Research Task

You are researching GPU cloud operators and AI infrastructure companies for Corgi Insurance's GPU Residual Value Guaranty (RVG) product.

## Your Assigned Companies
Research EACH company in your batch. For every company, find:

1. **Company basics**: Full name, description (2-3 sentences), website, HQ location, founded year, employee count
2. **GPU fleet**: Estimated number of GPUs, hardware types (NVIDIA H100, A100, B200, etc.), estimated total GPU asset value in $M
3. **Financing**: How they funded GPU purchases — venture equity, debt facilities, GPU-backed loans, sale-leaseback, public equity, etc. Include amounts where known.
4. **Stage**: Seed, Series A/B/C/D, Growth/Pre-IPO, Public, Established
5. **Total raised**: All equity + debt
6. **Last round**: Most recent funding round and amount
7. **Industry**: GPU Cloud, AI Infrastructure, Neocloud, Data Center, etc.
8. **Contacts**: 1-3 key people (CEO, CFO, VP Infrastructure, CTO). Include name, title, LinkedIn URL if findable, company email pattern or general email.

## RVG Scoring (0-100)
Score each company on GPU RVG fit:
- **GPU Fleet Scale** (0-30): 20,000+ = 30, 5,000-20,000 = 25, 1,000-5,000 = 20, 500-1,000 = 15, <500 = 10
- **Hardware Generation** (+5 bonus): Latest-gen (B200/GB200/Blackwell) = +5
- **Financing Profile** (0-25): GPU-backed debt = 25, Debt-financed = 22, Venture = 15, Public = 12, Unknown = 8
- **GPU Asset Value** (0-20): $50-200M sweet spot = 20, $200M-1B = 15, >$1B = 12, <$50M = 10
- **Company Maturity** (0-15): Growth stage actively scaling = 12, Established/mature = 15, Early = 8
- **Contact Quality** (0-10): 3+ contacts with emails = 10, partial info = 6, minimal = 4

Grade: A = 80+, B = 60-79, C = <60

## Output Format
Return a JSON array. Each element:
```json
{
  "company": "Company Name",
  "description": "2-3 sentence description with key facts",
  "description_source": "Sources used (e.g., 'Company website + Crunchbase + news (2025)')",
  "industry": "GPU Cloud / AI Infrastructure",
  "website": "example.com",
  "hq": "City, State/Country",
  "founded": 2020,
  "employees": "~100",
  "employee_source": "LinkedIn (2025)",
  "total_raised": "$500M equity + $1B debt",
  "last_round": "Series C $200M (Mar 2025)",
  "gpu_fleet": "5,000",
  "hardware": "NVIDIA H100, A100",
  "est_gpu_value_m": 150,
  "financing_profile": "Venture equity + debt facility",
  "stage": "Growth / Series C",
  "rvg_score": 78,
  "grade": "B",
  "score_breakdown": "Explanation of score components",
  "contacts": [
    {
      "name": "Jane Doe",
      "title": "CEO",
      "email": "jane@example.com or info@example.com",
      "email_type": "Personal or Company",
      "email_source": "How found",
      "linkedin": "https://linkedin.com/in/janedoe",
      "phone": null
    }
  ],
  "company_phone": null,
  "company_linkedin": "https://linkedin.com/company/example"
}
```

## IMPORTANT
- Be thorough — search company websites, Crunchbase, news articles, press releases, SEC filings
- If you can't find GPU fleet details, estimate based on funding, data center capacity, or business model
- Focus on companies that OWN GPUs (not just use cloud GPUs)
- Debt-financed companies are higher priority (RVG lowers their cost of capital)
- Do NOT include companies already in the existing list (provided below)

## EXISTING COMPANIES (DO NOT DUPLICATE)
- Lambda Labs
- Crusoe Energy Systems
- Applied Digital (APLD)
- Verda (formerly DataCrunch)
- Voltage Park / Lightning AI
- NexGen Cloud / Hyperstack
- Ori Industries / Radiant
- Nscale
- FluidStack
- GMI Cloud
- Salad Cloud
- TensorWave
- Foundry / Mithril
- Massed Compute
- Denvr Dataworks
- Hosted.ai
- Shadeform

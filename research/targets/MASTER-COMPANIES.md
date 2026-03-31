# MASTER-COMPANIES.md — Deduplicated Full Target Universe

**Compiled:** 2026-03-29 | **Subagent:** wave5-dedup-master-v2  
**Sources:** 12 research files + PRIORITY-SCORED-MASTER.md (64 ranked companies)  
**Total unique companies:** ~230  
**Method:** Full grep scan + cross-reference with priority scoring table

---

## SUMMARY COUNTS BY CATEGORY

| Category | Count | HIGH CONFIDENCE (3+ files) |
|----------|------:|:--------------------------:|
| GPU Cloud Operators (Neo-clouds) | 28 | 14 |
| Telecom GPU Operators | 13 | 8 |
| Sovereign AI / Government GPU | 20 | 10 |
| Middle East GPU Programs | 12 | 7 |
| Africa GPU Operators | 13 | 5 |
| Asia-Pacific GPU Operators | 14 | 6 |
| LATAM GPU Operators | 14 | 3 |
| Energy Companies (GPU / HPC) | 9 | 3 |
| Academic / HPC Centers | 13 | 3 |
| Private Credit / GPU Lenders | 20 | 10 |
| Bermuda Insurers / Reinsurers | 24 | 5 |
| Lloyd's Syndicates (Tech/Specialty) | 11 | 3 |
| Specialty Tech Insurers (MGAs / Carriers) | 18 | 3 |
| NVIDIA Ecosystem Partners | 16 | 6 |
| Colocation / Data Center Infrastructure | 5 | 3 |
| DGX / SuperPOD Enterprise Customers | 10 | 2 |
| **TOTAL** | **~230** | **~100** |

---

## SCORING NOTE
Companies marked 🔴🟠🟡🟢⚪ carry priority tier from PRIORITY-SCORED-MASTER.md.  
Companies marked ✦ are HIGH CONFIDENCE (appear in 3+ source files).  
Companies without tier marker were not scored (insurers, lenders, academic, ecosystem).

---

## 1. GPU CLOUD OPERATORS (NEO-CLOUDS)

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **CoreWeave (CRWV)** ✦ | GPU Cloud | USA | 🔴 S (95pts) | priority-scored, contacts-gpu-operators, nvidia-partner-ecosystem, sec-edgar, contacts-email-patterns | 250K+ GPUs; $12.9B GPU-backed debt; IPO 2025 |
| **nscale** ✦ | GPU Cloud | UK/Europe | 🔴 S (90pts) | priority-scored, contacts-gpu-operators, nvidia-partner-ecosystem, contacts-email-patterns | 200K GB300 contracted; $1.4B Blue Owl/PIMCO loan |
| **Crusoe Energy** ✦ | GPU Cloud | USA | 🔴 S (90pts) | priority-scored, contacts-gpu-operators, nvidia-partner-ecosystem, contacts-email-patterns | $750M Brookfield + $225M Upper90; stranded gas DC |
| **Lambda Labs** ✦ | GPU Cloud | USA | 🟠 1 (85pts) | priority-scored, contacts-gpu-operators, nvidia-partner-ecosystem, contacts-email-patterns | $500M GPU ABS (Macquarie); pr@lambda.ai confirmed |
| **Nebius Group (NBIS)** ✦ | GPU Cloud | Netherlands/Global | 🟠 1 (80pts) | priority-scored, contacts-gpu-operators, nvidia-partner-ecosystem, contacts-email-patterns | Nasdaq; 60K GPU Finland + 35K Kansas City; $2B capex 2025 |
| **Firmus Technologies** ✦ | GPU Cloud | Australia | 🟡 2 (75pts) | priority-scored, nvidia-partner-ecosystem, contacts-gpu-operators | 54K GB300 Tasmania; $330M raise; NVIDIA equity investor |
| **FluidStack** | GPU Cloud | UK/Europe | 🟡 2 (75pts) | priority-scored, family-offices-private-credit-gpu | $10B Macquarie GPU financing; powers Mistral/Anthropic |
| **Applied Digital (APLD)** ✦ | GPU Cloud | USA | 🟡 2 (70pts) | priority-scored, contacts-gpu-operators, sec-edgar | Nasdaq; 200MW+ HPC capacity; equipment-heavy |
| **Bit Digital (BTBT)** | GPU Cloud | USA | 🟡 2 (70pts) | priority-scored, sec-edgar | 2,048 H100s deployed; BTC→AI pivot; Nasdaq |
| **IREN Ltd (IREN)** ✦ | GPU Cloud | Australia/USA | 🟡 2 (70pts) | priority-scored, contacts-gpu-operators, sec-edgar, contacts-email-patterns | Nasdaq; AI cloud division; confirmed emails |
| **Together AI** ✦ | GPU Cloud | USA | 🟡 2 (70pts) | priority-scored, contacts-gpu-operators, contacts-email-patterns | $305M Series B; 50K+ customers; firstname@together.ai |
| **Vultr** ✦ | GPU Cloud | USA | 🟡 2 (70pts) | priority-scored, nvidia-partner-ecosystem, contacts-gpu-operators | $3.5B valuation; Elite NPN; 32 DC locations |
| **Voltage Park** ✦ | GPU Cloud | USA | 🟡 2 (70pts) | priority-scored, contacts-gpu-operators, contacts-email-patterns | 24K+ H100s; Jed McCaleb-backed non-profit |
| **Hut 8 Corp (HUT)** | GPU Cloud | USA (Miami) | 🟢 3 (65pts) | priority-scored, contacts-gpu-operators, sec-edgar | Nasdaq/TSX; BTC→AI; Highrise AI subsidiary |
| **DigitalOcean (DOCN)** | GPU Cloud | USA | 🟢 3 (65pts) | priority-scored, contacts-gpu-operators, sec-edgar | Nasdaq; H100 GPU Droplets (Paperspace/Gradient) |
| **5C Group** | GPU Cloud | Global | 🟢 3 (65pts) | priority-scored, family-offices-private-credit-gpu | $835M Brookfield Infrastructure debt; liquid-cooled |
| **xAI / Valor Compute Infra** | GPU Cloud / AI | USA | 🟠 1 (80pts) | priority-scored, family-offices-private-credit-gpu | $5.4B VCI fund; GB200 fleet; Apollo $3.5B debt |
| **GMI Cloud** | GPU Cloud | Asia/Global | Unscored | nvidia-partner-ecosystem | NPN partner; GPU cloud for AI workloads |
| **RunPod** | GPU Cloud | USA | Unscored | contacts-gpu-operators | Distributed GPU cloud; $20M seed 2024; ~90 employees |
| **Cirrascale Cloud Services** | GPU Cloud | USA (San Diego) | Unscored | contacts-gpu-operators, academic-hpc-commercial-gpu | Private AI cloud; NVIDIA B200; 40 employees |
| **VAST Data** | GPU Cloud / Storage | USA | Unscored | contacts-gpu-operators, contacts-email-patterns | $9.1B valuation; Series E; AI data platform |
| **Soluna Holdings (SLNH)** | GPU Cloud | USA | ⚪ 4 (50pts) | priority-scored, sec-edgar | Green compute; H100 + renewable energy |
| **WhiteFiber (WYFI)** | GPU Cloud | USA | ⚪ 4 (50pts) | priority-scored, sec-edgar | H100 PP&E; small public company; Nasdaq |
| **Lepton AI** (acquired) | GPU Cloud | USA | Unscored | contacts-gpu-operators | ⚠️ Acquired by NVIDIA April 2025; not an active target |
| **Vertical Data Inc (VDTA)** | GPU Cloud | USA (Henderson NV) | Unscored | sec-edgar | Small GPU cloud; H100; EDGAR 10-K filer |
| **Treasure Global (TGL)** | GPU Cloud | USA | Unscored | sec-edgar | Small; EDGAR 10-K filer; GPU infrastructure |
| **Penguin Computing / Penguin Solutions (POD)** | HPC Cloud | USA | Unscored | academic-hpc-commercial-gpu | Used at 97% US universities; bare-metal HPC cloud |
| **Rescale** | HPC Cloud Platform | USA | Unscored | academic-hpc-commercial-gpu | Brokers AWS/Azure/GCP + HPC; UM investor |

---

## 2. SOVEREIGN AI / GOVERNMENT GPU PROGRAMS

| Company / Entity | Category | Geography | Priority | Source Files | Notes |
|-----------------|----------|-----------|----------|--------------|-------|
| **HUMAIN** ✦ | Sovereign AI | Saudi Arabia | 🟠 1 (85pts) | priority-scored, middle-east-sovereign-ai | 600K GPU 3-yr plan; $77B strategy; PIF-backed |
| **G42 / Core42** ✦ | Sovereign AI | UAE (Abu Dhabi) | 🟠 1 (85pts) | priority-scored, middle-east-sovereign-ai | 21.5K deployed + 60.4K pipeline; Stargate UAE 1GW |
| **Stargate JV** ✦ | AI Infrastructure | USA | 🟠 1 (85pts) | priority-scored, middle-east-sovereign-ai | 450K+ GB200; OpenAI/SoftBank/Oracle; $500B commitment |
| **Oracle Cloud Infrastructure** ✦ | Hyperscaler | USA/Global | 🟠 1 (80pts) | priority-scored, middle-east-sovereign-ai, nvidia-partner-ecosystem | 450K+ GB200 Stargate; 147 DCs; $25B+ 2025 capex |
| **NEOM / TONOMUS** ✦ | Sovereign AI | Saudi Arabia | 🟡 2 (70pts) | priority-scored, middle-east-sovereign-ai | DataVolt 1.5GW AI Factory ($5B); PIF project finance |
| **Qai / QCRI (Qatar)** | Sovereign AI | Qatar | 🟡 2 (70pts) | priority-scored, middle-east-sovereign-ai | $20B Brookfield-Qai JV; Fanar Arabic LLM |
| **SDAIA** | Government AI | Saudi Arabia | ⚪ 4 (55pts) | priority-scored, middle-east-sovereign-ai | 500–5K H100/Blackwell; ALLaM Arabic LLM |
| **TII / Falcon LLM** | Sovereign AI / Research | UAE (Abu Dhabi) | 🟢 3 (65pts) | priority-scored, middle-east-sovereign-ai | 4,096 A100s; Falcon 180B; NVIDIA Joint Lab Sept 2025 |
| **MBZUAI** | Research / AI University | UAE (Abu Dhabi) | Unscored | middle-east-sovereign-ai | Mohamed bin Zayed University of AI; ~$30-50M GPU fleet |
| **Ooredoo Kuwait** | Telco / AI DC | Kuwait | ⚪ 4 (50pts) | priority-scored, middle-east-sovereign-ai | First integrated AI DC Kuwait; H200 GPUs |
| **Microsoft Azure** ✦ | Hyperscaler | USA/Global | 🟢 3 (60pts) | priority-scored, captive-insurance-gpu, nvidia-partner-ecosystem | ~72K Blackwell/week; $80B+ 2025 capex; Orcas Ltd captive |
| **Amazon Web Services** ✦ | Hyperscaler | USA/Global | 🟢 3 (60pts) | priority-scored, captive-insurance-gpu, nvidia-partner-ecosystem | 400K+ NVIDIA GPUs; $75B+ capex; Day One captive |
| **Google Cloud** ✦ | Hyperscaler | USA/Global | 🟢 3 (60pts) | priority-scored, captive-insurance-gpu, nvidia-partner-ecosystem | 100Ks GPUs; $75B+ capex; Imi Assurance captive |
| **ORNL / Frontier** | Govt. Lab / HPC | USA | ⚪ 4 (55pts) | priority-scored | 37,888 AMD MI250X; DOE-funded; no debt |
| **LLNL / El Capitan** | Govt. Lab / HPC | USA | ⚪ 4 (55pts) | priority-scored | 43,808 AMD MI300A; NNSA-funded; classified |
| **LANL / Venado** | Govt. Lab / HPC | USA | ⚪ 4 (55pts) | priority-scored | ~36K NVIDIA GH200; NNSA-funded; HPE Cray |
| **FPT Corporation** ✦ | Sovereign AI | Vietnam | 🟢 3 (65pts) | priority-scored, africa-emerging-gpu-operators | $200M AI factory; thousands H100; NVIDIA MoU Dec 2024 |
| **Yotta Data Services** ✦ | Data Center / AI Cloud | India | 🟠 1 (80pts) | priority-scored, africa-emerging-gpu-operators, nvidia-partner-ecosystem | 16K+ H100; IndiaAI Mission; $1B NVIDIA commitment |
| **Cassava / Africa Data Centres** ✦ | Data Center / AI Cloud | Pan-Africa | 🟠 1 (80pts) | priority-scored, contacts-gpu-operators, africa-emerging-gpu-operators | 12K–15K H100 across 5 AI Factories; NVIDIA+Google backed |
| **Israel National AI / Nebius IL** | Sovereign AI | Israel | Unscored | middle-east-sovereign-ai | National supercomputer; Nebius (IL) vehicle; innovation authority |

---

## 3. TELECOM GPU OPERATORS

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **Deutsche Telekom / T-Systems** ✦ | Telecom / AI Cloud | Germany | 🟠 1 (80pts) | priority-scored, telecom-gpu-infrastructure, nvidia-partner-ecosystem | ~10K DGX B200; €1B NVIDIA investment; public company |
| **Orange Group** ✦ | Telecom / AI Cloud | France/Africa | 🟠 1 (80pts) | priority-scored, telecom-gpu-infrastructure | Cloud Avenue NPN; EU Blackwell cluster; public |
| **SK Telecom** ✦ | Telecom / AI Cloud | South Korea | 🟡 2 (75pts) | priority-scored, telecom-gpu-infrastructure | Haein cluster; SK Group AI Factory 50K+ GPUs by 2027 |
| **SoftBank Corp** ✦ | Telecom / AI Cloud | Japan | 🟡 2 (75pts) | priority-scored, telecom-gpu-infrastructure, nvidia-partner-ecosystem | 10K+ GPUs; world-first AI-RAN; Stargate $40B commitment |
| **Singtel / Nxera** ✦ | Telecom / GPU Cloud | Singapore/APAC | 🟡 2 (70pts) | priority-scored, telecom-gpu-infrastructure, africa-emerging-gpu-operators | H100 + GB200; first GB200 among telcos; public |
| **NTT Group** | Telecom / AI Cloud | Japan/Global | 🟡 2 (70pts) | priority-scored, telecom-gpu-infrastructure | DGX-Ready DCs; Enterprise AI Factories; debt-financed capex |
| **AT&T** | Telecom / Edge AI | USA | 🟢 3 (65pts) | priority-scored, telecom-gpu-infrastructure | 5B tokens/day AI platform; NVIDIA AI Enterprise |
| **Telefónica** | Telecom / Edge AI | Spain/LATAM | 🟢 3 (65pts) | priority-scored, telecom-gpu-infrastructure | Hundreds GPUs Spain pilot; LATAM AI ambitions |
| **KT Corp** | Telecom / GPU Cloud | South Korea | ⚪ 4 (50pts) | priority-scored, telecom-gpu-infrastructure | HAC GPUaaS; AMD MI250 + NVIDIA Blackwell; 250K GPU national program |
| **Verizon** | Telecom / Edge AI | USA | ⚪ 4 (55pts) | priority-scored, telecom-gpu-infrastructure | NVIDIA GPU on 5G MEC; Vultr partnership |
| **Vodafone** | Telco (Hyperscaler-dep) | UK/Europe/Africa | Unscored | telecom-gpu-infrastructure | Deliberately avoids GPU hardware; Azure/GCP dependent |
| **BT Group** | Telco (Hyperscaler-dep) | UK | Unscored | telecom-gpu-infrastructure | Avoids owned GPU fleet; hyperscaler-dependent |
| **Telstra** | Telco (Hyperscaler-dep) | Australia | Unscored | telecom-gpu-infrastructure | Avoids owned GPU hardware; cloud-only strategy |

---

## 4. AFRICA GPU OPERATORS

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **Cassava / Africa Data Centres** ✦ | Data Center / AI Cloud | Pan-Africa (ZW HQ) | 🟠 1 (80pts) | priority-scored, contacts-gpu-operators, africa-emerging-gpu-operators | 3K H100 live (Joburg); 12–15K GPU across 5 AI Factories |
| **iXAfrica Data Centres** ✦ | Data Center | Kenya (Nairobi) | 🟢 3 (60pts) | priority-scored, contacts-gpu-operators, africa-emerging-gpu-operators | East Africa's first hyperscale AI-ready DC; Oracle cloud |
| **Kasi Cloud** ✦ | Data Center | Nigeria (Lagos) | 🟢 3 (65pts) | priority-scored, contacts-gpu-operators, africa-emerging-gpu-operators | $250M 100MW AI campus in Lekki |
| **Teraco** | Colocation / AI DC | South Africa | Unscored | africa-emerging-gpu-operators | Africa's dominant colo; DGX-Ready; JB5/JB7 AI-ready |
| **CHPC (National HPC Centre SA)** | National HPC | South Africa | Unscored | africa-emerging-gpu-operators | 30× V100 Lengau + new 4-PFlop system; R400M investment |
| **Safaricom** | Telco / AI | Kenya | ⚪ 4 (50pts) | priority-scored, africa-emerging-gpu-operators | $500M 3-yr AI commitment; iXAfrica partnership |
| **MTN Nigeria** | Telco / AI DC | Nigeria | Unscored | africa-emerging-gpu-operators | Sifiso Dabengwa DC — largest Tier III West Africa |
| **MainOne / DCX** | Data Center | Nigeria | Unscored | africa-emerging-gpu-operators | $120M Eko Atlantic facility; GPU shipments late 2025 |
| **GPU Marketplace Nigeria** | GPU Rental | Nigeria (Lagos) | Unscored | africa-emerging-gpu-operators | GPU rental <$1/hour; early-stage market signal |
| **Nexus Core Systems** | Data Center | Morocco | Unscored | africa-emerging-gpu-operators | 500MW AI campus; Naver + NVIDIA; solar/wind powered |
| **C4IR Rwanda / RISA** | Govt. AI | Rwanda (Kigali) | Unscored | africa-emerging-gpu-operators | Policy/governance hub; micro data centers; African AI policy |
| **Atlancis / Servernah Cloud** | Sovereign Cloud | Kenya | Unscored | africa-emerging-gpu-operators | East & Central Africa first GPU-powered AI factory |
| **African Union AI Program** | Policy / Regulatory | Continental | Unscored | africa-emerging-gpu-operators | AI Declaration Kigali 2025; shapes data localization rules |

---

## 5. ASIA-PACIFIC GPU OPERATORS

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **Yotta Data Services** ✦ | Data Center / AI Cloud | India | 🟠 1 (80pts) | priority-scored, africa-emerging-gpu-operators, nvidia-partner-ecosystem | 16K+ H100; Shakti Cloud; IndiaAI Mission Round 1+2 |
| **Jio Platforms / Reliance** | Telecom / AI | India | 🟢 3 (60pts) | priority-scored, africa-emerging-gpu-operators | 752 H200 + 268 AMD MI300X; 10K GPU supercomputer planned |
| **Elea Data Centers** | Data Center | Brazil/LATAM | 🟢 3 (60pts) | priority-scored, latam-gpu-operators | Rio AI City; Oracle + NVIDIA partners |
| **BDx / GPU Merdeka (Indosat)** | Sovereign AI | Indonesia | ⚪ 4 (50pts) | priority-scored, africa-emerging-gpu-operators | First sovereign AI DC Indonesia; H100; Indosat+Lintasarta+BDx JV |
| **CtrlS Datacenters** | Data Center | India | Unscored | africa-emerging-gpu-operators | IndiaAI Mission Round 1; Asia's largest Rated-4 DC network |
| **Tata Communications** | Telecom / AI Cloud | India | Unscored | africa-emerging-gpu-operators | Nationwide GPU cloud build-out; IndiaAI Mission ecosystem |
| **IndiaAI Mission (MeitY)** | Govt. Programme | India | Unscored | africa-emerging-gpu-operators | ₹10,000 crore; 34,333 GPUs approved; 17,300+ installed |
| **NSCC Singapore** | National HPC | Singapore | Unscored | africa-emerging-gpu-operators | ASPIRE 2A (352 A100) + H100 20PFlops; S$270M 2024 system |
| **IMDA Singapore** | Govt. Regulatory | Singapore | Unscored | africa-emerging-gpu-operators | Governs 300MW DC capacity; S$1B+ AI budget 5 years |
| **Telkom Indonesia** | Telecom / AI | Indonesia | Unscored | africa-emerging-gpu-operators | First DGX A100 in Indonesia; IBM watsonx; MSFT $1.7B |
| **Viettel** | Telco / Sovereign AI | Vietnam | Unscored | africa-emerging-gpu-operators | 140MW DC by 2026; KT $94.6M AI collaboration |
| **VNG Cloud** | Cloud / AI | Vietnam | Unscored | africa-emerging-gpu-operators | NVIDIA collaboration; Bangkok AI Cloud hub |
| **VinAI** | AI Research | Vietnam | Unscored | nvidia-dgx-superpod-customers | DGX SuperPOD A100; Vietnam's flagship AI supercomputer |
| **NAVER / NAVER CLOVA** ✦ | Internet / AI | South Korea | Unscored | nvidia-dgx-superpod-customers, telecom-gpu-infrastructure | 140 DGX A100 (1,120 A100s); Korean/Japanese NLP |

---

## 6. LATAM GPU OPERATORS

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **Elea Data Centers** ✦ | Data Center | Brazil | 🟢 3 (60pts) | priority-scored, latam-gpu-operators | Rio AI City 1.8GW; Oracle + NVIDIA; Alessandro Lombardi (CEO) |
| **Omnia / Pátria Investimentos** | Data Center | Brazil | ⚪ 4 (55pts) | priority-scored, latam-gpu-operators | TikTok 300MW deal (R$50B); Brookfield affiliate |
| **Petrobras CENPES** ✦ | Energy / HPC | Brazil | ⚪ 4 (50pts) | priority-scored, latam-gpu-operators, energy-companies-gpu | 224 A100 Tatu; Harpia 146 PFlops; state-controlled |
| **LNCC (Santos Dumont SC)** | Govt. HPC | Brazil | Unscored | latam-gpu-operators | 248 H100 + 144 GH200 + 36 MI300A; PBIA 2024-2028 |
| **KIO Data Centers** | Data Center | Mexico | Unscored | latam-gpu-operators | QRO1/QRO2/CDMX/Guadalajara; 12MW Phase 1 Dec 2025 |
| **Foxconn (Mexico)** ✦ | Manufacturing | Mexico | Unscored | latam-gpu-operators, nvidia-partner-ecosystem | NVIDIA GB200 manufacturing; Guadalajara; $500M+ invested |
| **ODATA Mexico** | Data Center | Mexico | Unscored | latam-gpu-operators | Querétaro area DC operator |
| **Ilkari (Colombia)** | Sovereign DC | Colombia | Unscored | latam-gpu-operators | ILK-COL1 Tocancipá Free Trade Zone; TIA-942-C Rated-3 |
| **G42 × Colombia Government** | Govt. Partnership | Colombia | Unscored | latam-gpu-operators | AI Computing Hub Initiative; G42 Group |
| **NLHPC / Leftraru (Univ. Chile)** | Academic HPC | Chile | Unscored | latam-gpu-operators | AMD MOU Nov 2025; CMM-Universidad de Chile |
| **CENIA** | Govt. AI | Chile | Unscored | latam-gpu-operators | National Center for AI; Santiago |
| **Universidad de Tarapacá (IAI)** | Academic | Chile | Unscored | latam-gpu-operators | Instituto de Alta Investigación; Arica |
| **SMN Argentina (Clementina XXI)** | Government | Argentina | Unscored | latam-gpu-operators | National Meteorological Service; Buenos Aires |
| **OpenAI × Sur Energy (Patagonia)** | Private Investment | Argentina | Unscored | latam-gpu-operators | Planned Patagonia data center; power from SMR |

---

## 7. ENERGY COMPANIES (GPU / HPC)

| Company | Category | Geography | Priority | Source Files | Notes |
|---------|----------|-----------|----------|--------------|-------|
| **ExxonMobil** ✦ | Energy / HPC | USA | 🟢 3 (65pts) | priority-scored, energy-companies-gpu | Discovery 6: 4,032 NVIDIA Grace Hopper chips; 222 PFlops |
| **Saudi Aramco / Aramco Digital** ✦ | Energy / AI Cloud | Saudi Arabia | 🟡 2 (75pts) | priority-scored, middle-east-sovereign-ai, energy-companies-gpu | Dammam-7: 1,000+ GPU nodes; Groq inferencing DC |
| **TotalEnergies** | Energy / HPC | France | ⚪ 4 (50pts) | priority-scored, energy-companies-gpu | Pangea 4 (1.6 PFlops hybrid); cloud-first approach |
| **BP** | Energy / AI | UK | Unscored | energy-companies-gpu | AI for seismic/upstream; workflow-AI focus; Palantir partnership |
| **Shell** | Energy / HPC | Netherlands | Unscored | energy-companies-gpu | 2025 CPU-centric upgrade; GPU details undisclosed |
| **Equinor** | Energy / AI | Norway | Unscored | energy-companies-gpu | $330M cumulative AI ROI; Databricks; seismic compute |
| **Chevron** | Energy / AI | USA | ⚪ 4 (50pts) | priority-scored, energy-companies-gpu | GPU for seismic; also building DC power infrastructure |
| **Petrobras CENPES** ✦ | Energy / HPC | Brazil | ⚪ 4 (50pts) | priority-scored, latam-gpu-operators, energy-companies-gpu | 224 A100 Tatu; Harpia 146 PFlops |
| **BHP** | Mining / AI | Australia | Unscored | energy-companies-gpu | AI/GPU for mine optimization; Melbourne HQ |

---

## 8. ACADEMIC / HPC CENTERS

| Company | Category | Geography | Source Files | Notes |
|---------|----------|-----------|--------------|-------|
| **TACC (Texas Advanced Computing Center)** | Academic HPC | USA | academic-hpc-commercial-gpu | STAR Industry Program; Frontera; commercial access |
| **NCSA (National Center for Supercomputing Applications)** | Academic HPC | USA | academic-hpc-commercial-gpu | vForge ($/ node-hr); IPP; 35+ yrs industry program; $10M+ ARR |
| **SDSC (San Diego Supercomputer Center)** | Academic HPC | USA | academic-hpc-commercial-gpu | Expanse Industry; Plexus portal (Core Scientific) |
| **PSC (Pittsburgh Supercomputing Center)** | Academic HPC | USA | academic-hpc-commercial-gpu | Bridges-2; cost-recovery commercial access |
| **NCAR / CISL** | Academic HPC | USA | academic-hpc-commercial-gpu | NSF-funded; effectively closed to commercial; no GPU sales |
| **MIT Lincoln Laboratory** | FFRDC | USA | academic-hpc-commercial-gpu | No commercial GPU sales; FFRDC-restricted |
| **Stanford HAI** | Research / Academic | USA | academic-hpc-commercial-gpu | Marlowe cluster; internal only; no commercial time |
| **Berkeley BAIR** | Research / Academic | USA | academic-hpc-commercial-gpu | BAIR Open Research Commons; industry sponsorship only |
| **Penguin Computing / POD** | HPC Cloud (Commercial) | USA | academic-hpc-commercial-gpu | 97% US universities as customers; bare-metal HPC cloud |
| **Cirrascale Cloud Services** | GPU Cloud | USA | academic-hpc-commercial-gpu, contacts-gpu-operators | Private AI cloud; B200s; 40 employees; San Diego |
| **Rescale** | HPC Cloud Platform | USA | academic-hpc-commercial-gpu | Brokers AWS/Azure/GCP; UM investor; distribution channel |
| **LNCC (Brazil)** | National HPC | Brazil | latam-gpu-operators | 248 H100 + 144 GH200 + 36 MI300A; PBIA 2024-2028 |
| **NLHPC / Leftraru (Chile)** | Academic HPC | Chile | latam-gpu-operators | AMD MOU; University of Chile / CMM |

---

## 9. PRIVATE CREDIT / GPU LENDERS

> ⚠️ These are financing counterparties — excluded from GPU operator scoring (no GPU fleet). Relevant as warm intro paths since lenders often require insurance as loan covenant.

| Company | Category | Geography | Source Files | Notes |
|---------|----------|-----------|--------------|-------|
| **Blackstone (Tactical Opps / Credit)** ✦ | Alt Asset Manager | USA | family-offices-private-credit-gpu, contacts-email-patterns | $1.27T AUM; CoreWeave $7.5B GPU debt; primary GPU lender |
| **Magnetar Capital** ✦ | Hedge Fund / Alt Credit | USA | family-offices-private-credit-gpu, contacts-email-patterns | $22.8B AUM; first institutional CoreWeave investor; invented GPU debt playbook |
| **Blue Owl Capital** ✦ | BDC / Direct Lender | USA | family-offices-private-credit-gpu, contacts-email-patterns | $307.4B AUM; nscale $1.4B deal; OTIC BDC |
| **PIMCO** ✦ | Fixed Income / Private Credit | USA | family-offices-private-credit-gpu, contacts-email-patterns | $2T+ AUM; nscale co-lender; European GPU appetite |
| **Apollo Global Management** ✦ | Alt Asset Manager | USA | family-offices-private-credit-gpu, lloyds-syndicates-tech | $733B AUM; xAI $3.5B GPU debt package; Syndicate 1969 |
| **Brookfield Asset Management** ✦ | Infrastructure / Alt | Canada | family-offices-private-credit-gpu | $1T+ AUM; Crusoe GPU facility; Qai $20B JV |
| **Macquarie (SAF Division)** | Infrastructure / Asset Finance | Australia | family-offices-private-credit-gpu | $900B+ AUM; Lambda $500M GPU ABS; Fluidstack $10B facility |
| **BlackRock / GIP** | Asset Manager / Infrastructure | USA | family-offices-private-credit-gpu | $11.5T AUM; AI Infrastructure Partnership (AIP); GIP Oct 2024 |
| **Carlyle Group** | PE / Private Credit | USA | family-offices-private-credit-gpu | $420B AUM; AI infrastructure deployment; C-PACE adjacent |
| **DigitalBridge Credit** | Digital Infra Credit | USA | family-offices-private-credit-gpu | $1.1B Credit Fund I; expert team; acquired by SoftBank $4B Dec 2025 |
| **Valor Equity Partners (VCI)** | Growth Equity / Infra Fund | USA | family-offices-private-credit-gpu | $55B AUM; $5.4B xAI GPU sale-leaseback; GPU fund template |
| **Trinity Capital (TRIN)** | BDC / Equipment Finance | USA | family-offices-private-credit-gpu | $4–5B portfolio; GPU Equipment Finance vertical; Nasdaq TRIN |
| **Hercules Capital (HTGC)** | BDC / Venture Lending | USA | family-offices-private-credit-gpu | $4.5B+ portfolio; largest pure venture BDC; AI company exposure |
| **Upper90 Capital** | Asset-Backed Private Credit | USA | family-offices-private-credit-gpu | Pioneered neocloud GPU debt; $50M–$500M range |
| **Eldridge Industries** | Alt Asset Manager / Insurance | USA | family-offices-private-credit-gpu | $70B+ AUM; insurance holding gives long-duration GPU capital |
| **CDPQ** | Pension / Sovereign-adjacent | Canada | family-offices-private-credit-gpu | $450B CAD AUM; AI infrastructure co-investments |
| **Great Elm Capital (GECC)** | BDC / Specialty Finance | USA | family-offices-private-credit-gpu | $553M AUM; CoreWeave deal participant; accessible mid-market |
| **Coatue Management** | Hedge / Growth Equity | USA | family-offices-private-credit-gpu | $50B+ AUM; GPU equity + structured debt; neocloud connections |
| **ATEL Capital Group** | Equipment Leasing / Venture Debt | USA | family-offices-private-credit-gpu | Multi-billion; 1977 founded; 5,000+ FINRA network; mid-market GPU |
| **Western Technology Investment (WTI/P10)** | Venture Debt / Equip Finance | USA | family-offices-private-credit-gpu | Part of P10 ($23B); tech venture debt; GPU equipment loans |

---

## 10. BERMUDA INSURERS / REINSURERS

> Primary capacity market for specialty GPU/tech asset insurance placement.

| Company | Category | Geography | Source Files | Notes |
|---------|----------|-----------|--------------|-------|
| **Everest Group (Everest Re)** ✦ | P&C Reinsurer | Bermuda / USA | bermuda-insurance-market, contacts-email-patterns | Large Bermuda Class 4; specialty appetite |
| **RenaissanceRe (RenRe)** ✦ | Reinsurer | Bermuda | bermuda-insurance-market, contacts-email-patterns | Cat-focused; dual email pattern `first.last@renre.com` |
| **Arch Capital Group** ✦ | Specialty Insurer | Bermuda | bermuda-insurance-market, contacts-email-patterns, specialty-tech-insurers | `flast@archgroup.com`; ATA AI facility capacity |
| **AXIS Capital Holdings** ✦ | Specialty Insurer | Bermuda | bermuda-insurance-market, contacts-email-patterns | Dedicated Cyber & Technology CUO appointed 2024 |
| **Convex Group** ✦ | Specialty Insurer/Reinsurer | Bermuda/London | bermuda-insurance-market, contacts-email-patterns, specialty-tech-insurers | Cornerstone ATA $750M AI facility; $5B+ premiums; 2019 founded |
| **Fidelis Insurance / TFP** ✦ | Specialty Insurer | Bermuda | bermuda-insurance-market, contacts-email-patterns | "Asset-backed finance" line; Richard Brindle (CEO) |
| **Hiscox** ✦ | Specialty Insurer | Bermuda/Lloyd's | bermuda-insurance-market, lloyds-syndicates-tech, contacts-email-patterns | Syndicate 33; `first.last@hiscox.com` confirmed |
| **PartnerRe** | Reinsurer | Bermuda | bermuda-insurance-market | Broad specialty appetite; Covéa-owned |
| **Aspen Insurance Holdings** | Specialty Insurer | Bermuda | bermuda-insurance-market | Specialty lines including tech |
| **Lancashire Holdings** | Specialty Insurer | Bermuda/Lloyd's | bermuda-insurance-market | Property catastrophe + specialty; lean underwriter |
| **SiriusPoint** | Specialty Insurer/Reinsurer | Bermuda | bermuda-insurance-market | Growing specialty book |
| **Conduit Re** | Reinsurer | Bermuda | bermuda-insurance-market | Class of 2020 startup; more receptive to novel structures |
| **Hamilton Insurance Group** | Specialty Insurer | Bermuda | bermuda-insurance-market | AI-enhanced underwriting; tech-forward |
| **Chubb (Bermuda)** | Global P&C | Bermuda | bermuda-insurance-market | Largest global P&C; broad specialty |
| **Hannover Re (Bermuda)** | Reinsurer | Bermuda | bermuda-insurance-market | Financial Solutions unit — bespoke structured (re)insurance; Chantal Cardinez |
| **Mosaic Insurance** | Specialty Insurer | Bermuda | bermuda-insurance-market | Class of 2021; credit, surety, transactional lines |
| **Fidelis / RVI Group** | Residual Value Specialist | Bermuda | bermuda-insurance-market | **KEY SPECIALIST** — dominant RVI writer; capacity providers critical |
| **Relm Insurance** | Emerging Tech Insurer | Bermuda | bermuda-insurance-market | Class of 2020; explicitly targets emerging tech risks |
| **Somers Re** | Reinsurer | Bermuda | bermuda-insurance-market | Specialist re |
| **Brit Insurance (Bermuda)** ✦ | Specialty Insurer | Bermuda/Lloyd's | bermuda-insurance-market, lloyds-syndicates-tech | Syndicate 2987 |
| **Canopius (Bermuda)** ✦ | Specialty Insurer | Bermuda/Lloyd's | bermuda-insurance-market, lloyds-syndicates-tech, specialty-tech-insurers | Syndicate 4444; dedicated tech insurance; crypto/mining coverage |
| **Antares Reinsurance** | Reinsurer | Bermuda | bermuda-insurance-market | Mid-size specialty re |
| **Ariel Re** | Reinsurer | Bermuda | bermuda-insurance-market | Cat + specialty |
| **Argo Group International** | Specialty Insurer | Bermuda | bermuda-insurance-market | Specialty underwriter |
| **Awbury Insurance** ✦ | Specialty Insurer | Bermuda/USA/London | contacts-email-patterns | All contacts directly confirmed at awbury.com; `first.last@awbury.com` |

---

## 11. LLOYD'S SYNDICATES (TECH / SPECIALTY)

| Syndicate | Managing Agent | Source Files | Notes |
|-----------|----------------|--------------|-------|
| **Syndicate 2623 / 623** | Beazley | lloyds-syndicates-tech | ⭐ TOP PICK: Broadest tech specialty + innovation appetite |
| **Syndicate 1414** | Ascot | lloyds-syndicates-tech | ⭐ TOP PICK: Explicit tech hardware E&O + specie/cargo infra |
| **Syndicate 4444** | Canopius | lloyds-syndicates-tech | ⭐ TOP PICK: Dedicated tech industry product; largest capacity |
| **Syndicate 2987** | Brit | lloyds-syndicates-tech | Specialty; Bermuda + Lloyd's presence |
| **Syndicate 33** | Hiscox | lloyds-syndicates-tech | Strong tech + professional lines |
| **Syndicate 457** | Munich Re | lloyds-syndicates-tech | ATA AI facility capacity; financial solutions expertise |
| **Syndicate 1969** | Apollo | lloyds-syndicates-tech | Apollo private credit link; specialty lines |
| **Syndicate 1084** | Chaucer | lloyds-syndicates-tech | Specialty property + casualty |
| **Syndicate 4020** | Ark | lloyds-syndicates-tech | Specialty reinsurer; newer entrant |
| **Syndicate 1225** | AEGIS London | lloyds-syndicates-tech | US-owned mutual at Lloyd's; commercial lines |
| **Syndicate 1200** | Westfield Specialty (ex-Argo) | lloyds-syndicates-tech | Specialty; formerly Argo Group |

---

## 12. SPECIALTY TECH INSURERS (CARRIERS / MGAs)

| Company | Type | Geography | Source Files | Notes |
|---------|------|-----------|--------------|-------|
| **Advanced Technology Assurance (ATA)** | MGU | London | specialty-tech-insurers | $750M multi-line AI/DC facility; 10+ capacity providers |
| **FM Global / FM Intellium** | Mutual Insurer | USA/Global | specialty-tech-insurers | $5B/risk capacity; 1,100+ DCs insured; engineering-led |
| **SCOR (Syndicate 2015)** ✦ | Reinsurer | France/Lloyd's | specialty-tech-insurers, bermuda-insurance-market | ATA facility lead (EIL); Cyber/Tech E&O at Lloyd's |
| **Arch Insurance International** ✦ | Specialty Insurer | Bermuda | specialty-tech-insurers, bermuda-insurance-market | ATA facility named capacity; broad specialty lines |
| **Convex Group** ✦ | Specialty Re/Insurer | Bermuda/London | specialty-tech-insurers, bermuda-insurance-market, contacts-email-patterns | ATA cornerstone investor; $5B+ premiums |
| **Parametrix Insurance** | Insurtech / Parametric MGA | Israel/USA | specialty-tech-insurers | Cloud downtime parametric BI; AWS/Azure/GCP outage triggers |
| **Descartes Underwriting** | MGA / Parametric | France/Global | specialty-tech-insurers | $140M/policy parametric; data center natural peril suite |
| **HSB / Hartford Steam Boiler** | Equipment Breakdown | USA (Munich Re) | specialty-tech-insurers | Oldest equipment breakdown specialist; TechAdvantage™ |
| **Berkley Technology Underwriters** | Specialty Insurer | USA (W.R. Berkley) | specialty-tech-insurers | 100% tech-focused subsidiary; data centers + equipment |
| **Intact Insurance Specialty Solutions** | Specialty Insurer | Canada/USA | specialty-tech-insurers | Large North American tech P&C; CleanTech to MedTech |
| **Canopius** ✦ | Lloyd's / Global Specialty | UK/Global | specialty-tech-insurers, bermuda-insurance-market, lloyds-syndicates-tech | Crypto/mining + data center physical asset coverage |
| **Markel (UK Technology Division)** | Specialty Insurer | UK/Global | specialty-tech-insurers | Covers prototypes in development — hardware startups |
| **Sompo International** | Specialty Insurer | Japan/Global | specialty-tech-insurers | Inland marine tech equipment; IT/telecom sector |
| **Tokio Marine Kiln (TMK)** | Lloyd's Managing Agent | UK/Global | specialty-tech-insurers | Complex tech property; Tokio Marine parent |
| **RLI Corp** | Specialty Insurer | USA | specialty-tech-insurers | Marine division: on-site servers + leased hardware; $1M–$10M |
| **Philadelphia Insurance (PHLY)** | Specialty Insurer | USA (Tokio Marine) | specialty-tech-insurers | Large specialty tech writer; E&S market |
| **Vouch Insurance** | Insurtech | USA | specialty-tech-insurers | GPU servers explicitly covered; inland marine prototypes |
| **Superscript** | Insurtech / Digital MGA | UK | specialty-tech-insurers | Standalone equipment-only insurance; no bundle required |
| **Cowbell Cyber (Prime Tech)** | Insurtech / Cyber MGA | USA | specialty-tech-insurers | Cyber + Tech E&O single form; AWS config integration |

---

## 13. NVIDIA ECOSYSTEM PARTNERS (Channel / Infrastructure)

| Company | Category | Geography | Source Files | Notes |
|---------|----------|-----------|--------------|-------|
| **Equinix** ✦ | Colocation / AI Factory | USA/Global | nvidia-partner-ecosystem, contacts-gpu-operators, priority-scored | 260+ DCs; DGX-Ready; AI Factory with NVIDIA; REIT debt |
| **Digital Realty** | Colocation | USA/Global | nvidia-partner-ecosystem | DGX-Ready certified; global DC operator |
| **Dell Technologies** ✦ | OEM / Infrastructure | USA | nvidia-partner-ecosystem | NVIDIA Partner; PowerEdge GPU servers; enterprise |
| **HPE (Hewlett Packard Enterprise)** ✦ | OEM / HPC | USA | nvidia-partner-ecosystem | Cray EX systems; Apollo GPU servers; Frontier SC builder |
| **Lenovo** | OEM / HPC | China/Global | nvidia-partner-ecosystem | Harpia SC for Petrobras; HPC clusters globally |
| **Super Micro Computer (Supermicro)** ✦ | GPU Server OEM | USA | nvidia-partner-ecosystem, sec-edgar, priority-scored | GPU servers as inventory + capex; $14.9B revenue |
| **GIGABYTE Technology** | GPU Server OEM | Taiwan/Global | nvidia-partner-ecosystem | GPU server manufacturer; NVIDIA partner |
| **Insight Enterprises** | IT Solutions / VAR | USA | nvidia-partner-ecosystem | Elite NPN partner; GPU procurement channel |
| **Exxact Corporation** | HPC Integrator | USA | nvidia-partner-ecosystem | GPU workstation/server integrator; deep HPC |
| **World Wide Technology (WWT)** | IT Solutions | USA | nvidia-partner-ecosystem | Large VAR; GPU deployment services |
| **Pure Storage** | Storage | USA | nvidia-partner-ecosystem | Everpure; AI data pipeline storage |
| **Computacenter** | IT Infrastructure | UK/Europe | nvidia-partner-ecosystem | European IT channel; GPU procurement |
| **Vesper Technologies (Vespertec)** | GPU Cloud / VAR | Global | nvidia-partner-ecosystem | NVIDIA NPN certified |
| **SoftServe** | IT Services | Ukraine/USA | nvidia-partner-ecosystem | AI/ML engineering services; NVIDIA partner |
| **Cambridge Computer** | HPC Solutions | USA | nvidia-partner-ecosystem | HPC systems integrator; research GPU deployments |
| **GMI Cloud** | GPU Cloud | Asia/Global | nvidia-partner-ecosystem | GPU cloud; NPN member |

---

## 14. DGX / SUPERPOD ENTERPRISE CUSTOMERS

| Company | Category | Geography | Source Files | Notes |
|---------|----------|-----------|--------------|-------|
| **Block Inc (Jack Dorsey)** | FinTech / AI Research | USA | nvidia-dgx-superpod-customers | First NA DGX SuperPOD GB200; open-source frontier models |
| **Recursion Pharmaceuticals (RXRX)** ✦ | Pharma / AI | USA | nvidia-dgx-superpod-customers, sec-edgar, priority-scored | BioHive-2: 504 H100; TOP500 #35; largest pharma SC |
| **Amgen** | Pharma / Biotech | USA | nvidia-dgx-superpod-customers | DGX Cloud (BioNeMo); protein LLM training; biologics |
| **ServiceNow** | Enterprise SaaS | USA | nvidia-dgx-superpod-customers | DGX Cloud + on-prem SuperPOD hybrid; GenAI for IT |
| **CCC Intelligent Solutions** | InsurTech / AI | USA | nvidia-dgx-superpod-customers | DGX Cloud; AI for insurance claims + auto repair |
| **NAVER / NAVER CLOVA** | Internet / AI | South Korea | nvidia-dgx-superpod-customers | 140 DGX A100 (1,120 GPUs); Korean/Japanese NLP models |
| **Sony Group Corporation** | Electronics / Media | Japan | nvidia-dgx-superpod-customers | DGX SuperPOD A100; Sony R&D Center AI infra |
| **VinAI** | AI Research | Vietnam | nvidia-dgx-superpod-customers | DGX SuperPOD; Vietnam's fastest AI SC; AVs + healthcare |
| **MTS (Mobile TeleSystems)** | Telco / AI | Russia | nvidia-dgx-superpod-customers | DGX SuperPOD; Russia's largest telco; AI + cloud |
| **AMAX** | Server Integrator | USA | nvidia-dgx-superpod-customers | 64 DGX B200 (512 Blackwell); voice synthesis client unnamed |
| **Roblox (RBLX)** | Gaming / AI | USA | priority-scored | $50–150M annual GPU capex; 3D AI; Nasdaq |

---

## 15. CAPTIVE INSURANCE & SELF-INSURANCE ENTITIES

> Companies with known captive structures that write tech/property coverage internally.

| Company | Captive Entity | Domicile | Source Files | Notes |
|---------|---------------|---------|--------------|-------|
| **Microsoft** | Orcas Ltd | Bermuda (+ Vermont branch) | captive-insurance-gpu | Employee benefits + general P&L focus; not GPU-specific |
| **Google / Alphabet** | Imi Assurance, Inc. | Hawaii | captive-insurance-gpu | Nat cat + employee benefits; not GPU residual value |
| **Meta** | Ekahi Insurance Company, LLC | Hawaii | captive-insurance-gpu | Employee healthcare only |
| **Amazon** | Day One Insurance | USA | captive-insurance-gpu | Employee healthcare captive; no GPU property captive |

---

## HIGH CONFIDENCE FLAG — Companies in 3+ Source Files

The following companies appear across 3 or more research files and are highest-confidence research targets:

**GPU Cloud (3+ files):**
CoreWeave ✦ | nscale ✦ | Crusoe Energy ✦ | Lambda Labs ✦ | Nebius Group ✦ | Applied Digital ✦ | IREN ✦ | Together AI ✦ | Vultr ✦ | Voltage Park ✦ | Firmus ✦

**Sovereign AI / Hyperscaler (3+ files):**
Yotta ✦ | Cassava/ADC ✦ | Oracle ✦ | Microsoft ✦ | AWS ✦ | Google ✦ | HUMAIN ✦ | G42/Core42 ✦

**Insurance / Specialty (3+ files):**
Everest Re ✦ | Arch Capital ✦ | AXIS Capital ✦ | Convex Group ✦ | Fidelis ✦ | Hiscox ✦ | SCOR ✦ | Canopius ✦ | Brit ✦ | Awbury ✦

**Lenders (3+ files):**
Blackstone ✦ | Magnetar ✦ | Blue Owl ✦ | PIMCO ✦ | Apollo ✦ | Brookfield ✦

**NVIDIA Ecosystem (3+ files):**
Equinix ✦ | Dell ✦ | HPE ✦ | Supermicro ✦

**Telecom (3+ files):**
Deutsche Telekom ✦ | Orange ✦ | SK Telecom ✦ | SoftBank ✦ | Singtel ✦ | NAVER ✦

---

## APPENDIX: Companies Explicitly Excluded / Low Priority

| Company | Reason |
|---------|--------|
| Vodafone, BT Group, Telstra | Deliberately avoid GPU hardware; hyperscaler-dependent |
| NCAR, MIT Lincoln Lab, Stanford HAI, Berkeley BAIR | No commercial GPU time; government/academic-restricted |
| Lepton AI | ⚠️ Acquired by NVIDIA April 7, 2025 — not a viable target |
| Vertical Data Inc (VDTA) | Minimal scale; aspirational GPU filings only |
| Treasure Global (TGL) | Speculative GPU filings; minimal substance |
| Petros Pharma, Oncotelic, Fourth Wave Energy | No real GPU infrastructure |
| MTS (Russia) | Sanctioned entity; not a viable commercial target |
| African Union | Policy body only; not a direct operator or buyer |
| IMDA Singapore | Regulatory body only |
| IndiaAI Mission (MeitY) | Demand aggregator/policy programme; not direct operator |

---

*End of MASTER-COMPANIES.md — Generated 2026-03-29*

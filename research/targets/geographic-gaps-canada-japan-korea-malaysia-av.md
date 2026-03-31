# Geographic Gap Fill: Canada, Japan, South Korea, Malaysia & Autonomous Vehicles
*Research compiled: March 2026*
*Focus: Leadership, GPU fleet estimates, financing structure, insurance implications*

---

## TABLE OF CONTENTS
1. [Canada](#canada)
2. [Japan](#japan)
3. [South Korea](#south-korea)
4. [Malaysia](#malaysia)
5. [Autonomous Vehicles](#autonomous-vehicles)

---

## CANADA

### 1. Cohere Inc.

**Overview:** Toronto-based enterprise AI company (founded 2019), focused on LLMs for business — the most prominent Canadian-born AI infrastructure play.

**Leadership:**
- **Aidan Gomez** — Co-Founder & CEO (former Google Brain researcher, lead author of "Attention Is All You Need")
- **Nick Frosst** — Co-Founder
- **Ivan Zhang** — Co-Founder & CTO

**GPU Fleet / Compute Infrastructure:**
- Exact GPU count not publicly disclosed
- Building a **multibillion-dollar AI data centre in Canada** in partnership with **CoreWeave** (anchor tenant agreement)
- CoreWeave facility in **Cambridge, Ontario** operational; Cohere is primary customer
- Total project value: **$725 million CAD**
- Infrastructure uses NVIDIA's latest GPUs (H100/Blackwell generation)
- Cohere also accesses compute from external providers including AWS, GCP, and Azure
- CoreWeave context: operates ~250,000 GPUs across 32 data centers globally

**Financing Structure:**
- **Private funding rounds:**
  - Series C: $270M (2023)
  - Total previously raised: ~$445M USD
  - Series D: **$500M USD** (August 2025) at $6.8B valuation — led by Radical Ventures & Inovia Capital; participation from AMD Ventures, NVIDIA, PSP Investments, Salesforce Ventures
  - $100M extension (additional) → BDC (Business Development Bank of Canada) + Nexxus Capital Management → valuation $7B USD
- **Government financing:**
  - **$240M CAD** from Government of Canada (December 2024 / finalized March 2025) as the **first investment under the $2B Canadian Sovereign AI Compute Strategy**
  - Investment tied to requirement to build domestic compute capacity (the CoreWeave facility)
  - Broader $700M AI Compute Challenge program underpins this

**Insurance Implications:**
- Mixed cloud/on-prem model: sovereign compute assets partially held by CoreWeave JV, creating shared liability exposures
- GPU fleet financed partly via government grant → potential clawback/performance covenant risk
- D&O exposure for Gomez et al. given dual sovereign mandate (Canadian government expectations vs. commercial VC returns)
- As enterprise AI provider: customer contract indemnity risks for LLM failures in enterprise deployments; professional indemnity / E&O exposure
- Data centre in Ontario: property + business interruption; liquid cooling liability

---

### 2. Digital Research Alliance of Canada (the Alliance)

**Overview:** Federal non-profit managing Canada's national research computing infrastructure — the academic/public-sector equivalent of a hyperscaler for GPU compute. Formerly Compute Canada.

**Leadership:**
- **Jeff Moon** — CEO
- Governed by a Board representing Canadian universities and research institutions

**GPU Fleet / Compute Infrastructure:**
- Current national fleet includes clusters at **University of Waterloo** (Nibi) and **University of Toronto** (Trillium) — launched 2025
  - Combined: **3x the CPU** and **5x the GPU** power of replaced systems
- Additional national systems at Université de Montréal, University of British Columbia, University of Victoria, Simon Fraser University
- **$40M investment (2025-2026 FY)** for dedicated AI infrastructure: multi-GPU clusters for AI/ML workloads
- **$85M funding (2025-2027):** sovereign public supercomputing buildout for researchers/government/industry
- **$95.4M award (October 2024):** Ontario government + Alliance to upgrade Waterloo + Toronto sites

**Financing Structure:**
- Funding model: **federal appropriations** via ISED (Innovation, Science and Economic Development Canada)
- Tripartite cost-sharing: federal + provincial + institutional
- No equity or debt financing; entirely grant-funded
- New $2B Canadian Sovereign AI Compute Strategy feeds into the Alliance's mandate

**Insurance Implications:**
- Public institution model: sovereign immunity limits certain liability exposures
- Data custodianship risk: hosts sensitive research data for 200+ Canadian universities — breach liability and cyber insurance are primary concerns
- Critical national infrastructure classification → potential regulatory/compliance insurance requirements
- Infrastructure shared across provinces → multi-jurisdiction loss scenarios

---

### 3. Other Canadian GPU Cloud Operators

#### Coreweave Canada (Cambridge, Ontario)
- US-headquartered but significant Canadian footprint as Cohere's compute partner
- Cambridge, ON data center — NVIDIA H100/Blackwell equipped
- See CoreWeave profile in main research for full details

#### Borealis AI (Royal Bank of Canada subsidiary)
- Machine learning research lab; limited public infrastructure data
- Compute likely sourced internally via RBC cloud budget

#### Vector Institute for Artificial Intelligence (Toronto)
- Canada's leading AI research institute
- Operates Vaughan cluster (NVIDIA DGX systems); compute donated/procured via corporate sponsors (NVIDIA, Google, government)
- ~640 A100-class GPUs in research cluster (2023 figures); likely expanded since

---

## JAPAN

### 4. KDDI Corporation

**Overview:** Japan's second-largest telecom by revenue (~¥5.7T/year). Major enterprise cloud player via KDDI Smart Cloud; aggressively building AI compute infrastructure as part of Japan's national AI push.

**Leadership:**
- **Makoto Takahashi** — President & CEO
- **Yasuyuki Tera** — Executive Vice President (Cloud/DX division)

**GPU Fleet / Compute Infrastructure:**
- **HGX-based AI compute cluster** launched for generative AI and LLM training/inference (partnership with ELYZA business group)
- **Osaka Sakai Data Center project** (June 2024 agreement):
  - Joint venture with Super Micro Computer, Sharp Corporation, and Datasection
  - Site: former Sharp Sakai Plant (largest LCD factory site in Japan, ~1,640 acres available)
  - Announced as "largest AI data center in Asia" target
  - **NVIDIA GB200 NVL72** liquid-cooled platform specified
  - HPE engaged (June 2025) as systems integrator — HPE delivers NVIDIA GB200 NVL72 rack-scale systems
  - Operational target: **early 2026**
- **Government subsidy:** ¥10.2 billion (~$66M USD) from Japan's METI for AI supercomputer development
- KDDI also part of NVIDIA's November 2024 Japan Cloud Leaders initiative (alongside SoftBank, GMO, Highreso, Rutilea, Sakura Internet)
- Future plans: GB200 NVL72 liquid-cooled data center

**Financing Structure:**
- Primarily corporate balance sheet (KDDI is listed TSE: 9433, market cap ~¥8T)
- Government METI subsidy: ¥10.2B (~$66M USD)
- JV structure with Sharp/Supermicro/Datasection for Osaka Sakai site
- HPE systems integrator contract (capex spend through HPE)

**Insurance Implications:**
- Large-scale liquid-cooled GB200 deployment → elevated property/equipment breakdown risk
- JV partnership structure → contractor/construction phase wrap-up insurance; delineated operational liability
- ELYZA LLM exposure: enterprise AI liability for commercial deployments
- Telecom-grade SLA requirements mean high business interruption insurance needs

---

### 5. Fujitsu Limited + RIKEN

**Overview:** Fujitsu is Japan's largest IT services company. In partnership with RIKEN (Japan's national research institute), Fujitsu has powered Fugaku — the world's former #1 supercomputer. Now building FugakuNEXT with NVIDIA.

**Leadership:**
- **Takahito Tokita** — President & CEO, Fujitsu
- **Hiroshi Matsumoto** — President, RIKEN
- **Satoshi Matsuoka** — Director, RIKEN R-CCS (the Fugaku operator)

**GPU Fleet / Compute Infrastructure:**
- **Fugaku (existing):** ~7.6M A64FX processor cores (ARM-based, Fujitsu proprietary — no NVIDIA GPUs). Peak: 537 PetaFLOPS (FP64). Available via "Virtual Fugaku" on AWS and Rescale cloud platforms (August 2024 launch).
- **FugakuNEXT (planned ~2030):**
  - RIKEN + Fujitsu + **NVIDIA** collaboration (announced August 2025)
  - **Fujitsu awarded design contract** (June 2025) — basic design phase runs to February 2026
  - **AI-oriented performance target: 600+ ExaFLOPS (FP8 sparse)** → "Zetta-scale" HPC target
  - Will use **NVIDIA GPUs as accelerators** (first time for Japan's flagship system)
  - CPU: **Fujitsu MONAKA-X** (2nm, ARM-based) with **NVLink Fusion** integration to NVIDIA GPU architecture
  - **Development budget: ~¥110B (~$740M USD)**
- **Fujitsu Cloud Service HPC:** Commercial access to PRIMEHPC FX1000 (A64FX, same as Fugaku) — available today

**Financing Structure:**
- FugakuNEXT: **government-funded** via MEXT (Ministry of Education, Culture, Sports, Science and Technology)
- Budget: ¥110B (~$740M) → public appropriation
- Fujitsu as prime contractor (design & build); NVIDIA as GPU subsystem partner
- Fugaku Cloud: RIKEN/Fujitsu commercial licensing model; Rescale/AWS partnerships for cloud access

**Insurance Implications:**
- National strategic asset classification → government backstop; Fujitsu holds contractor liability
- NVLink Fusion integration risk: cutting-edge 2nm heterogeneous architecture → extended warranty and equipment failure risk at scale
- Cloud exposure: Virtual Fugaku on AWS creates liability chain (RIKEN → AWS → end user)
- IP and export control risks given US-Japan GPU technology flows

---

### 6. NEC Corporation + AIST (ABCI)

**Overview:** NEC is a major Japanese IT/networking company. The **ABCI (AI Bridging Cloud Infrastructure)** is operated by AIST (National Institute of Advanced Industrial Science and Technology) — Japan's primary public AI compute resource for researchers and companies.

**Leadership:**
- **Takayuki Morita** — President & CEO, NEC Corporation
- **Yoichi Nabeshima** — President, AIST
- ABCI operations managed by AIST's Grid Technology Research Center

**GPU Fleet / Compute Infrastructure:**
- **ABCI 2.0 (current, 2021-):**
  - **6,128 NVIDIA A100 GPUs** (SXM4, 80GB)
  - ~37 PetaFLOPS AI performance
  - Operated by AIST; HPE Cray EX systems
- **ABCI 3.0 (launched 2024):**
  - **2,020 NVIDIA H100 GPUs** (SXM5) added as Phase 1 upgrade
  - Additional capacity specifically for generative AI workloads
  - Accessible to Japanese companies and universities through application
- **NEC's own AI compute (SX-Aurora TSUBASA):**
  - NEC manufactures vector processors (NEC Vector Engine); not NVIDIA GPUs but proprietary accelerators
  - NEC operates its own AI cloud services using both GPU and vector processor infrastructure
- AIST also participates in Japan's national NVIDIA GPU allocation program (METI-funded)

**Financing Structure:**
- ABCI: **METI government-funded** (National Research and Development Agency)
- ABCI 2.0/3.0 expansion capex funded via national budget appropriations
- NEC's own GPU/AI infrastructure: corporate capex (NEC listed TSE: 6701)
- NEC SX-Aurora is proprietary product business — R&D on balance sheet

**Insurance Implications:**
- ABCI = national critical research infrastructure → government self-insurance / limited third-party insurance exposure
- NEC as operator of sensitive government systems → professional indemnity / E&O for AI services
- NEC's vector processor business competes with NVIDIA → IP litigation risk (minor)
- Cloud access to ABCI creates multi-tenant liability concerns for AIST

---

### 7. Preferred Networks (PFN)

**Overview:** Tokyo-based deep learning startup. Known for Chainer (pioneering ML framework, now retired) and MN-Core AI chip. Operates some of Japan's largest private AI compute clusters.

**Leadership:**
- **Toru Nishikawa** — Co-Founder & CEO
- **Daisuke Okanohara** — Co-Founder & CTO

**GPU Fleet / Compute Infrastructure:**
- **MN-3 Supercomputer (2020):** 1,088 MN-Core chips (PFN proprietary) — topped Green500 list in 2020 for energy efficiency
- **MN-2 Cluster:** 1,024 NVIDIA V100 GPUs (2019)
- **MN-Core 2** announced for next-generation cluster; PFN developing custom chips in-house
- Estimated current NVIDIA GPU holdings: ~1,000-3,000 GPUs (V100/A100 generation), supplemented by proprietary MN-Core accelerators
- Fleet primarily used for robotics, autonomous driving, drug discovery

**Financing Structure:**
- Notable investors: Toyota Motor Corporation, Fanuc, Hitachi, ENEOS (energy), Mitsui, NTT Docomo
- Toyota committed ~$100M+ strategic investment
- Primarily private (unlisted); valuation ~$2B+ (2019 estimates, may have changed)
- Revenue from enterprise AI/robotics contracts with Toyota, Toyota Industries

**Insurance Implications:**
- Robotics/autonomous systems work creates product liability exposure (if AI used in industrial automation)
- Custom silicon (MN-Core) creates equipment insurance complexity — non-standard hardware, limited secondary market
- Toyota strategic relationship means automotive recall/liability may flow upstream to PFN's software stack

---

### 8. Sakura Internet

**Overview:** Japanese cloud/hosting provider. Selected by METI as a strategic provider for Japan's sovereign AI compute buildout — one of the most significant beneficiaries of Japan's GPU subsidy program.

**Leadership:**
- **Junichi Tanaka** — Founder & CEO

**GPU Fleet / Compute Infrastructure:**
- **Selected by METI** for Japan's sovereign AI cloud initiative — one of few Japanese hyperscalers chosen
- NVIDIA partnership: part of NVIDIA's November 2024 Japan Cloud Leaders announcement
- **H100 cluster deployment funded by METI subsidy program** — one of the largest beneficiaries (~¥20B+ estimated subsidy)
- **KDDI, SAKURA internet, and Highreso signed agreement (August 2025)** to jointly meet GPU demand and share infrastructure
- High-density liquid-cooled data centers in Hokkaido (cold climate advantage for cooling efficiency)

**Financing Structure:**
- Listed on TSE: 3778 — can access public equity markets
- **METI subsidy:** major component (exact amount not publicly disclosed, but among top recipients in Japan's ¥40B+ GPU program)
- Corporate bond / bank loan financing for data center buildout

**Insurance Implications:**
- Sovereign AI cloud designation means heightened regulatory scrutiny and SLA requirements
- METI-subsidized assets likely require government insurance covenants
- Cold-climate Hokkaido operations: weather/disaster risk (though generally lower cooling costs)
- KDDI/Highreso JV GPU-sharing: multi-party shared infrastructure liability

---

## SOUTH KOREA

### 9. Naver Corporation / Naver Cloud

**Overview:** South Korea's dominant search/internet company. Operating HyperCLOVA X (largest Korean-language LLM) and building sovereign AI infrastructure. Naver Cloud is the cloud subsidiary.

**Leadership:**
- **Choi Soo-yeon** — CEO, Naver Corporation
- **Kim Yoo-won** — CEO, Naver Cloud
- **Ha Jung-woo** — Chief AI Officer

**GPU Fleet / Compute Infrastructure:**
- **Previous cluster:** 2,048 NVIDIA A100 GPUs (used for HyperCLOVA X training)
- **January 2026:** Completed **4,000 NVIDIA B200 GPU cluster** — announced as South Korea's largest AI cluster
  - B200 cluster: trains a 72B parameter model in 1.5 months vs. 18 months on A100 cluster
- **Government allocation (July 2025):** Secured **3,056 NVIDIA H200 GPUs** through Korean government allocation program
- **Planned deployment:** Over **60,000 GPUs** (NVIDIA RTX PRO 6000 Blackwell + other Blackwell GPUs) for sovereign and physical AI
  - Capital commitment: **>1 trillion won (~$691M USD)**
- **GAK Sejong Data Center:** Asia's largest single-company data center (294,000 sqm, 600,000 rack units, 65 exabytes storage)
- AMD collaboration: March 2026 — Lisa Su visited Naver; HyperCLOVA X to run on AMD GPUs as well

**Financing Structure:**
- Naver Corporation: KOSPI-listed (035420.KS), market cap ~$15B
- GPU investment funded via operating cash flow and capital markets
- Strategic participation in Korea's **National AI Computing Center** program
- Government-allocated H200 GPUs: subsidized/allocated through Korean government NVIDIA partnership (announced APEC 2024)

**Insurance Implications:**
- Korea's largest private AI cluster → critical infrastructure concentration risk
- 60,000+ GPU target creates massive property and equipment breakdown exposure
- HyperCLOVA X enterprise deployments: E&O/professional indemnity for AI failures
- Multi-vendor GPU strategy (NVIDIA + AMD) creates integration risk and warranty complexity
- GAK Sejong data center scale: significant BI exposure if disrupted

---

### 10. Samsung SDS

**Overview:** Samsung Group's IT services and cloud subsidiary. Pivoting to GPU-centric AI cloud provider and bidding on Korea's national AI infrastructure. Parent: Samsung Electronics.

**Leadership:**
- **Hwang Sung-woo** — CEO & President, Samsung SDS
- **Lee Jae-yong (Jay Y. Lee)** — Samsung Group Chairman (ultimate parent oversight)

**GPU Fleet / Compute Infrastructure:**
- **Strategy:** GPU-centric AI Cloud (announced REAL Summit 2024, September 2024)
- Operating 5 domestic data centers: Sangam, Suwon, Chuncheon, Dongtan, Gumi
- **Dongtan HPC Data Center:** Dedicated HPC facility, opened 2025 — primary GPU facility
- **Gumi Data Center:** Under development (2027-2028) — faster compute, lower power
- **National AI Computing Center bid:** Samsung SDS submitted solo bid for MSIT's center project valued at **~$1.41B**, targeting **50,000 high-performance GPUs by 2030**
  - Consortium with Kakao and KT
- **OpenAI partnership:** Joint development of Stargate AI data centers (announced 2025)
- **GPU-as-a-Service (GPUaaS):** Revenue stream launching from Dongtan operational date
- NVIDIA AI Factory partnership: Samsung + NVIDIA announced AI megafactory for intelligent manufacturing

**Financing Structure:**
- Samsung SDS is KOSPI-listed (018260.KS); market cap ~$5B
- Parent Samsung Electronics (market cap ~$250B) provides strategic backing
- Government contract pursuit: $1.41B MSIT National AI Computing Center bid
- OpenAI Stargate JV: milestone-based capital structure

**Insurance Implications:**
- Stargate JV with OpenAI creates novel liability exposure — AI infrastructure for global frontier models
- GPUaaS commercial service: SLA liability for uptime commitments
- Samsung brand association amplifies reputational risk from data center failures
- National AI Computing Center (if won): government contract insurance requirements
- NVIDIA AI Factory: manufacturing liability for AI-enabled smart factory systems

---

### 11. Kakao Corp / KakaoCloud

**Overview:** South Korea's dominant messaging/internet platform (KakaoTalk). KakaoCloud is the cloud subsidiary. Pursuing AI-native transformation.

**Leadership:**
- **Chung Shin-a** — Co-CEO, Kakao Corp
- **Kim Byung-hak** — Co-CEO, Kakao Corp
- **Park Hee-young** — CEO, Kakao Cloud

**GPU Fleet / Compute Infrastructure:**
- Part of Korea's **50,000+ NVIDIA GPU national deployment** alongside NAVER Cloud and NHN Cloud
- **Ansan Data Center** (June 2024): 47,378 sqm, Hanyang University Erica campus, ~120,000 server capacity
- **Namyangju Data Center:** KRW 600B (~$442M) investment; 92,000 sqm AI-focused facility, **targeting 2029 completion**
- Participant in Korea's **National AI Computing Center** consortium (with Samsung SDS, KT)
- **KakaoCloud GPU-as-a-Service:** Active product (GPU cloud, vision AI, ML, RAG)
- AMD partnership: SmartNIC development, cloud-native infrastructure

**Financing Structure:**
- Kakao Corp: KOSPI-listed (035720.KS)
- Namyangju DC: KRW 600B (~$442M) — corporate capex
- National AI Computing Center: government contract funding if awarded
- AMD strategic partnership: technology/co-development arrangement

**Insurance Implications:**
- Kakao has faced government scrutiny (2022 platform outage caused national emergency) — heightened BI insurance requirements
- Messaging platform + AI cloud convergence: unified liability exposure
- Construction risk on Namyangju DC (2029): builder's risk, wrap-up liability
- AMD partnership differentiates from NVIDIA-dependent peers but creates integration risk

---

### 12. LG CNS / LG AI Research (EXAONE)

**Overview:** LG CNS is LG Group's IT services arm. LG AI Research is the central AI R&D unit developing EXAONE — LG's enterprise LLM series.

**Leadership:**
- **Hyun-bum Shin** — CEO, LG CNS
- **Kyunghoon Cho** — Director, LG AI Research

**GPU Fleet / Compute Infrastructure:**
- **EXAONE training:** Uses **Google Cloud TPUs and GPUs** (AI Hypercomputer) — not a proprietary fleet
  - EXAONE 1.0 (2021): Google Cloud GPU
  - EXAONE 2.0 (2023): Google Cloud GPU/TPU
  - EXAONE 3.0 (2024): Google Cloud TPUs + GPUs → 56% faster inference, 35% less memory, 72% lower operating costs vs. prior version
  - EXAONE 4.0: FriendliAI partnership for API deployment
- **Inference:** LG AI Research adopted **FuriosaAI RNGD AI accelerator** — achieves 2.25x better LLM inference per watt vs. GPUs
- **K-EXAONE:** Designed to run on A100-class GPUs (not bleeding-edge H100)
- **LG CNS infrastructure:** Enterprise cloud + on-prem deployments for LG Group companies

**Financing Structure:**
- LG CNS: listed on KOSPI (LG Electronics majority owner)
- EXAONE development: LG AI Research funded via LG Group R&D budget (estimated $100-200M+ annual AI R&D)
- Google Cloud: opex-based GPU/TPU consumption model (no owned hardware)
- FuriosaAI: Korean domestic AI chip strategic partnership

**Insurance Implications:**
- Outsourced compute model (Google Cloud) limits property/equipment exposure but creates vendor concentration risk
- EXAONE enterprise deployments via LG CNS: professional indemnity/E&O
- FuriosaAI partnership: novel AI accelerator creates warranty and performance risk
- LG Group vertical deployments (factories, appliances, vehicles) create product liability chain from AI failures

---

## MALAYSIA

### 13. YTL Power International Berhad

**Overview:** Malaysian utility and infrastructure conglomerate (part of YTL Corporation). Executing Malaysia's most ambitious sovereign AI data centre project — a multi-billion dollar GPU campus in Johor, directly adjacent to Singapore.

**Leadership:**
- **Tan Sri Francis Yeoh Sock Ping** — Managing Director, YTL Corporation (founding family patriarch)
- **Dato' Yeoh Seok Hong** — Executive Director, YTL Power
- **Dato' Yeoh Seok Kian** — Deputy Managing Director, YTL Power / YTL Digital Capital CEO
- **Tom Furlong** — CEO, YTL AI Cloud (former VP at Meta AI Infrastructure)

**GPU Fleet / Compute Infrastructure:**
- **Phase 1 (OPERATIONAL October 2025):**
  - Malaysia's **first NVIDIA-powered AI data center** — completed in Kulai, Johor
  - Powered by **NVIDIA GB200 NVL72 (Grace Blackwell) liquid-cooled GPUs** — latest generation
  - Global hyperscalers already among customers (identities not disclosed)
  - YTL AI Cloud is now operational as commercial GPU cloud
- **Full Campus Plan:**
  - **1,640 acres** at YTL Green Data Center Park, Kulai, Johor
  - Planned total capacity: aligned with 2GW+ power envelope
  - Total YTL AI programme investment: **RM10 billion (~$2.38B USD)** — split 50/50 between DC infrastructure and AI solutions/LLM
  - **Original 2023 announcement:** US$4.3B investment across multiple phases
- **Power:**
  - 500 MW solar plant
  - 600 MW backup from national grid
  - Proximity to Singapore: strategic location for regional hyperscaler demand
- **Ilmu LLM:** Malaysia's first large language model, built by YTL as part of AI solutions half of investment

**Financing Structure:**
- YTL Power International: **Bursa Malaysia listed** (YTLPOWR.KL), market cap ~RM30B+
- Majority financing via corporate balance sheet + **project finance structure** (typical for large utility-grade infrastructure)
- **Government support:** Malaysian government earmarked **MYR 5.9B (~$1.41B)** in 2026 budget for national AI sector (benefits YTL project)
- NVIDIA partnership terms: likely includes GPU supply agreement, possibly GPU-backed financing (consistent with NVIDIA's DGX-as-a-service model for strategic partners)
- **Potential project finance:** Given scale ($4.3B), likely structured with:
  - Senior debt from Malaysian banks (Maybank, CIMB, RHB) + international banks
  - Green bonds possible (solar co-location)
  - MIDA (Malaysian Investment Development Authority) incentives
- Power infrastructure: YTL Power's own generation assets provide self-sufficient power (competitive advantage vs. peers)

**Insurance Implications:**
- **Largest GPU campus in Southeast Asia** → highest-value AI infrastructure property insurance programme in the region
- GB200 NVL72 liquid-cooled systems: equipment breakdown risk + liquid damage exposure (massive liability if coolant failure damages rack of $10M+ GPUs)
- 1,640-acre campus in Johor: natural catastrophe exposure (tropical storms, flooding — Malaysia's seasonal flooding risk)
- Power infrastructure dual-dependency (solar + grid): business interruption complexity
- Hyperscaler anchor tenants: SLA-driven BI exposure likely $100M+ per incident at scale
- Construction/development phase (ongoing): builder's risk wrap-up
- Sovereign AI mandate: government contract performance risk
- Geopolitical: Johor is adjacent to Singapore — potential spillover in any regional conflict scenario
- **Insurability premium:** GB200 NVL72 is cutting-edge hardware — first-generation deployment risk; limited historical loss data for actuaries

---

## AUTONOMOUS VEHICLES

### 14. Waymo (Alphabet subsidiary)

**Overview:** Google/Alphabet's autonomous driving unit — the market leader in commercial robotaxi deployments (San Francisco, Phoenix, Austin, Los Angeles). Focused on L4 fully driverless operation.

**Leadership:**
- **Tekedra Mawakana** — Co-CEO
- **Dmitri Dolgov** — Co-CEO (former research lead, co-author of key AV papers)
- **Sundar Pichai** — Alphabet CEO (ultimate parent)

**GPU Fleet / Compute Infrastructure:**
- **Exact cluster size: NOT publicly disclosed** (Waymo treats this as competitive intelligence)
- **Key facts confirmed:**
  - Training primarily on **Google TPUs** (TPU v4/v5) via Google's internal cloud — Waymo benefits from Alphabet's $50B+ TPU fleet
  - Also uses NVIDIA GPUs for certain workloads (Waymo's GTC 2025/2026 sessions indicate NVIDIA use)
  - "Unrivaled compute infrastructure" — Waymo's own characterization
  - Training dataset: **500,000+ hours of real-world driving data**
  - Confirmed use of large-scale simulation (billions of miles simulated)
  - Multi-billion parameter ML models (vision transformers, sensor fusion)
- **Scaling laws confirmed:** Waymo published research (2024) confirming scaling laws apply to AV — more compute + more data = better performance
- **Comparative context:** Tesla FSD v13 used 50,000 GPU cluster; Waymo likely comparable or larger given Google TPU access
- **Estimated equivalent GPU-hours:** Among the top 5 AV compute operations globally

**Financing Structure:**
- **100% Alphabet-owned subsidiary** (not independently listed)
- **External funding raised:**
  - 2020: $2.25B from Silver Lake, AutoNation, Andreessen Horowitz, et al.
  - 2023: $2.5B (Alphabet + external investors)
  - Total external capital: ~$11B lifetime
- **Revenue model:** Waymo One ride-hailing fees; expanding commercial fleet
- Compute funded via Alphabet parent (Google Cloud internal transfer pricing + Alphabet R&D budget)
- Alphabet FY2025 total capex: ~$75B (primarily data centers/TPUs) → Waymo accesses a portion

**Insurance Implications:**
- **Highest-profile AV insured fleet globally** — Waymo One commercially insured in CA, AZ, TX
- Primary vehicle insurance: Waymo One fleet is **self-insured + commercial auto excess layers**
- **Training compute insurance:** Alphabet self-insures most internal compute; standard corporate property programme
- Scaling law publication creates legal exposure: if competitors show they couldn't scale due to compute access, Waymo's market position challenged on antitrust grounds
- Accident liability: each Waymo One incident = potential product liability test case; ~50+ incidents reported to California DMV
- Reputational risk: single high-profile incident can set back entire AV timeline → catastrophic BI implication

---

### 15. Mobileye Global Inc. (Intel subsidiary, NASDAQ: MBLY)

**Overview:** Israeli-founded, Intel-owned (88%+) AV technology company. World's largest ADAS (Advanced Driver Assistance Systems) provider. Transitioning from ADAS to L4 AV.

**Leadership:**
- **Professor Amnon Shashua** — Co-Founder, President & CEO (also Intel's EVP)
- **Nimrod Nehushtan** — CFO
- **Pat Gelsinger** (former Intel CEO; replaced by Lip-Bu Tan in 2024)

**GPU Fleet / Compute Infrastructure:**
- **Exact fleet: NOT publicly disclosed** in SEC filings (treated as competitive IP)
- **Infrastructure facts:**
  - Uses "advanced AI training infrastructure" (per company statements)
  - Primarily in-house compute for training EyeQ-optimized models
  - Acquires **Mentee Robotics for $900M (January 2026)** — specifically to access their AI training infrastructure for physical AI/humanoid robotics
  - Revenue pipeline of **$24.5B over 8 years** funds ongoing R&D
  - Intel parent provides HPC resources (Intel Gaudi AI accelerators, Xeon clusters)
- **EyeQ chip fleet context:** Mobileye has shipped 170M+ EyeQ chips — inference fleet, not training
- **Likely training infrastructure:** Mix of Intel Gaudi + NVIDIA GPU clusters + Intel cloud (Intel Tiber AI Cloud)

**Financing Structure:**
- **NASDAQ listed (MBLY)** — IPO November 2022 at $21B valuation
- Intel retains ~88% ownership
- Market cap: ~$15-20B (fluctuating with Intel corporate challenges)
- Revenue: ~$1.7B (FY2024); cash flow positive on operations
- **Intel parent stress:** Intel's financial difficulties (2024-2025 cost cuts, layoffs) create uncertainty about compute capex for Mobileye
- Mentee Robotics acquisition ($900M): funded from Mobileye balance sheet / Intel parent
- **Government contracts:** Israeli government strategic partnerships (data not public)

**Insurance Implications:**
- **Largest AV technology provider by deployed fleet** (170M+ chips in ~1B vehicles by 2030 projection)
- Product liability: ADAS failures in production vehicles — mass tort exposure
- Intel parent financial stress creates key-person/continuity risk for Mobileye
- Mentee Robotics humanoid integration: novel product liability for physical AI systems
- Israeli domicile + US listing: geopolitical concentration risk (Middle East operational exposure)
- IPO D&O: listed company governance obligations

---

### 16. Wayve (UK)

**Overview:** Cambridge, UK-based autonomous driving startup. Pioneering "embodied AI" approach — training one generalist AI model across vehicles, robots, and environments. Europe's best-funded AV startup.

**Leadership:**
- **Alex Kendall** — Co-Founder & CEO (Cambridge professor, computer vision researcher)
- **Amar Shah** — Co-Founder & President

**GPU Fleet / Compute Infrastructure:**
- **Training infrastructure: Microsoft Azure** (strategic partnership)
  - CEO Alex Kendall: *"NVIDIA has been the oxygen of everything that allows us to train AI"*
  - *"We train on NVIDIA GPUs... this is what enables us to build billion-parameter models trained on petabytes of data"*
  - Trains on **NVIDIA H100/Blackwell GPUs** via Azure's NVIDIA-powered HPC clusters
- **Vehicle hardware:** 
  - NVIDIA Drive AGX Thor (Gen 3 autonomous vehicle kit)
  - Built on NVIDIA DRIVE Orin + successor DRIVE Thor (Blackwell architecture)
- **Scale context:** Training on petabytes of driving data; billion-parameter models — consistent with ~1,000-5,000 H100 equivalent GPU-months of compute per major training run
- **Cloud-first model:** No owned GPU fleet; all training on Azure/NVIDIA cloud — pure opex model

**Financing Structure:**
- **Series C (May 2024): $1.05B** — led by SoftBank Group; new investors: NVIDIA, Microsoft; existing: Eclipse Ventures
- **Series D (February 2026): $1.2B** — led by Eclipse, Balderton, SoftBank Vision Fund 2; participation: Microsoft, NVIDIA, Uber; automakers: Mercedes-Benz, Nissan, Stellantis
- **Total committed capital: $1.5B** (including milestone-based Uber investment for robotaxi deployment)
- **Post-money valuation (Series D): $8.6B**
- **Total raised lifetime: ~$2.5B+**
- Key investors: SoftBank (lead multiple rounds), NVIDIA (strategic, compute access), Microsoft (Azure compute + strategic), Uber (commercial deployment partner)
- Revenue target: commercial robotaxi trials 2026; supervised autonomy software in consumer vehicles 2027 (Nissan)

**Insurance Implications:**
- **Cloud-only compute model** (Azure/NVIDIA): no owned GPU assets — primary insurance is cyber/E&O, not property
- NVIDIA as both investor and compute provider: conflict of interest if NVIDIA cloud pricing changes
- SoftBank dominant investor history (WeWork, etc.): governance risk
- UK incorporation + global commercial rollout: multi-jurisdiction insurance requirements
- Robotaxi commercial trials (2026 UK): AV-specific insurance regulatory frameworks in UK/EU
- Nissan OEM deployment (2027): product liability flows into consumer vehicles globally — mass market liability scale
- $8.6B valuation on $2.5B raised: significant dilution/down-round risk → D&O exposure

---

### 17. Motional (Hyundai + Aptiv JV)

**Overview:** 50/50 joint venture between Hyundai Motor Group and Aptiv (formerly Delphi Automotive). Commercializing L4 driverless robotaxi technology. Operations in Las Vegas (commercial Lyft partnership) and Boston.

**Leadership:**
- **Karl Iagnemma** — President & CEO
- **Akio Toyoda** (Hyundai Motor representation on JV board)
- **Kevin Clark** — CEO, Aptiv (50% JV parent)

**GPU Fleet / Compute Infrastructure:**
- **No public disclosure** of specific GPU cluster sizes
- **Known infrastructure:**
  - NVIDIA partnership: Motional vehicles use NVIDIA DRIVE platform for in-vehicle compute
  - IONIQ 5 robotaxi fleet: NVIDIA DRIVE Orin SoC (compute platform for autonomous operation)
  - Training cluster: likely hosted on cloud (AWS/GCP/Azure) with NVIDIA HPC instances — no disclosed owned cluster
  - Research/testing: significant compute for sensor fusion, perception, and simulation
- **Context:** JV formation 2020 with $4B initial capitalization — compute represents a portion of ongoing R&D spend
- Competitor Waymo (Google-backed) and Cruise (GM, paused) have far larger compute budgets
- **Estimated training compute:** Modest relative to Waymo — 500-2,000 GPU equivalents for active development

**Financing Structure:**
- **50/50 JV: Hyundai Motor Group + Aptiv**
- **Initial capitalization: $4B (2020)**
- Parent backing: Hyundai (market cap ~$30B) + Aptiv (market cap ~$15B)
- **Ongoing funding challenges:** Motional announced significant **layoffs in 2024** (hundreds of employees); scaled back Las Vegas operations
- Lyft commercial partnership: revenue from Lyft robotaxi deployments (Las Vegas)
- No independent public listing — fully owned by JV parents

**Insurance Implications:**
- JV structure: dual-parent liability → insurance programme must account for both Hyundai and Aptiv coverage overlap
- Commercial robotaxi operation (Las Vegas Lyft): highest insurance cost exposure — active public road AV service
- 2024 layoffs + operational scaling back: company in survival mode — coverage continuity risk
- IONIQ 5 vehicle platform: product liability chain back to Hyundai for vehicle defects vs. Motional for AV software
- Nevada DMV regulatory compliance: mandatory AV insurance requirements
- **Key risk:** If Motional scales back or fails, insurance runoff liability for incidents from deployed vehicles

---

## CROSS-CUTTING INSURANCE THEMES

### 1. Geographic Concentration of New GPU Capacity
- **Johor, Malaysia (YTL):** Single-campus concentration of Southeast Asia's largest GPU fleet — CAT exposure
- **Osaka, Japan (KDDI + others):** Japan seismic risk applies to all Japanese GPU operators
- **South Korea (Naver, Samsung SDS, Kakao):** North Korea geopolitical risk; seismic zone

### 2. Sovereign AI Mandates = Government Contract Risk
- Canada (Cohere), Japan (ABCI, Fugaku, KDDI), Korea (National AI Computing Center), Malaysia (YTL): all carry government performance obligations → contract performance bonds / surety risk

### 3. Cloud-Opex vs. Owned-Capex Models
- Cloud-opex (Wayve, LG AI Research): minimize property/equipment exposure but concentrate cyber/vendor risk
- Owned/JV capex (Naver, Samsung SDS, YTL): full property and BI exposure but more control

### 4. Cutting-Edge Hardware First-Generation Risk
- GB200 NVL72 deployments (YTL, KDDI): first-generation liquid-cooled rack-scale systems — actuarial data thin
- Insurers pricing in significant unknown failure modes for novel hardware

### 5. AV Insurance Regulatory Landscape
- Waymo (CA/AZ/TX), Motional (NV/MA): each state has distinct AV insurance requirements
- UK: Automated and Electric Vehicles Act 2018 framework governs Wayve commercial operations
- No global AV insurance standard → patchwork coverage

---

*Research Notes:*
- *GPU fleet figures for many entities are estimates or ranges; companies rarely disclose exact counts*
- *Financing structures for private entities (Cohere, Wayve, Preferred Networks) based on disclosed funding rounds*
- *Insurance implications represent analytical observations, not confirmed coverages*
- *Sources: Company press releases, NVIDIA announcements, Data Center Dynamics, TechCrunch, The Register, government announcements (Canada.ca, METI, MEXT, MIDA), SEC/KOSPI/TSE filings context*

---
*Last updated: March 2026 | wave6-geographic-gaps research sprint*

# Missing Verticals Research: Quant Finance, Biotech/Pharma, Media/Streaming
*Research date: 2026-03-29 | Status: COMPLETE*

---

## VERTICAL 1: QUANT FINANCE GPU OPERATORS

> These firms are the most secretive GPU operators on the planet. Infrastructure is a core competitive moat — almost nothing is publicly disclosed. What exists comes from job postings, conference talks, and leakage via vendor case studies.

---

### Two Sigma Investments

**Overview:** ~$60B AUM, New York. Founded by John Overdeck & David Siegel (David Siegel is a co-CEO). ~1,700 employees, 70%+ in R&D. Explicitly bills itself as a "science company first."

**GPU Fleet Estimate:** **Unknown / Not Disclosed**
- Claimed to rank "among the top supercomputing sites in the world" per a 2016 hedge fund consulting report — this phrasing is significant and suggests significant on-prem or co-lo infrastructure
- Processes 380+ petabytes of data
- Uses Ray (distributed computing), Spark, Dask, RLlib for reinforcement learning — all GPU-compatible workloads
- No public GPU count. Safe assumption: **several thousand H100/A100s** across research + live trading, primarily owned/co-located rather than pure cloud

**Financing Structure:** Presumed owned/co-located (HPC is a moat — you don't outsource competitive advantage)

**Leadership (Infrastructure-Relevant):**
- David Siegel, Co-CEO — architect of the tech-first culture
- Alfred Spector, CTO (formerly Google Research VP)

**Insurance Implications for RVG:**
- Extreme data sensitivity — NDA/security requirements would be paramount
- Infrastructure is classified as proprietary competitive intelligence; any valuation would need to be done under confidentiality
- The "supercomputing" scale claim suggests potential for GPU fleet coverage in the $100M+ range
- Key risk: total secrecy = no third-party valuations available; insurer would need to work from first principles

---

### Jane Street

**Overview:** Private partnership, est. ~$30B+ annual revenue (leaked in 2023). One of the most profitable trading firms in the world. Heavy OCaml/functional programming culture, increasingly AI-first.

**GPU Fleet Estimate:** **Cloud-primary via CoreWeave; internal fleet unknown**
- Since 2024, **Jane Street has contracted CoreWeave as its primary GPU provider** — confirmed via CoreWeave case study and GTC 2025 presentation
- Relationship is dual: Jane Street is both a **CoreWeave investor** (led the $650M Nov 2024 round) and a **customer**
- CoreWeave's full fleet = 250,000 GPUs across 32 data centers as of 2025; Jane Street has dedicated allocation but exact size not public
- Jane Street's own GPU CUDA engineering is well-documented — they write custom CUDA code for microsecond-latency trading, suggesting some internal bare-metal GPU cluster for latency-sensitive work
- Cloud (CoreWeave) for large-scale model training; on-prem/co-lo for live trading inference

**Financing Structure:** **Hybrid** — cloud (CoreWeave) + internal for latency-critical work. Also an equity investor in CoreWeave (strategic alignment).

**Leadership (Infrastructure-Relevant):**
- No public CTO/CIO identified
- Presented at NVIDIA GTC 2025: "Jane Street: How an Early AI Adopter Thinks About Infrastructure"

**Insurance Implications for RVG:**
- **High-value, high-complexity target** — the CoreWeave relationship means GPU fleet exposure is partly off-balance-sheet but not off-risk
- Cloud GPU dependency on CoreWeave creates concentration risk (single provider)
- Jane Street's equity stake in CoreWeave creates an interesting insurance dynamic — are they insuring infrastructure they partly own?
- Revenue scale ($30B+/year) means any infrastructure downtime has enormous financial consequence → high willingness-to-pay for protection products

---

### Citadel Securities

**Overview:** Ken Griffin's market-making arm, separate from Citadel hedge fund. One of the largest market makers in US equities (~25-30% of US retail order flow). Chicago/New York/London.

**GPU Fleet Estimate:** **Significant but undisclosed**
- Confirmed NVIDIA A100 usage — Citadel's HPC team published research on A100 memory optimization (tripling cache capacity using atomic processes)
- NYC-based High Performance Computing team explicitly works on "novel computing platforms" for ML applications in live trading
- Inference workloads are latency-sensitive (market-making in real-time) → likely on-prem GPU cluster, not cloud
- Estimate: **1,000–5,000 GPUs** across research + live trading (speculative, based on firm size and disclosed HPC team)

**Financing Structure:** Presumed owned — latency requirements rule out cloud for trading; research cluster may use cloud burst capacity

**Leadership (Infrastructure-Relevant):**
- Ken Griffin, Founder/CEO
- Jamil Nazarali, Global Head of Business Development
- HPC team is large (~20+ engineers based on job posting density) but unnamed publicly

**Insurance Implications for RVG:**
- Citadel Securities is SEC/FINRA regulated — any insured infrastructure would have regulatory disclosure implications
- High-frequency trading infrastructure has unique risk profile: total failure for even microseconds = measurable financial loss
- GPU-backed ML models are used in both research (lower stakes, longer timeframes) and live trading (extreme latency/reliability requirements) — two separate risk tiers

---

### D.E. Shaw & Co.

**Overview:** ~$60B AUM, NYC. David Shaw founded in 1988. Pioneer of quantitative and computational finance. Has a separate research division (D.E. Shaw Research) focused on molecular dynamics/protein folding — one of the most unusual research arms of any hedge fund.

**GPU Fleet Estimate:** **Two separate fleets — trading + life sciences**
- **D.E. Shaw Research** (DESRES): Built custom ANTON supercomputers for molecular dynamics simulation. Anton 3 (successor to Anton 2, built with NVIDIA collaboration) is among the fastest MD simulation machines in the world. This is NOT standard GPU but it's high-performance accelerated computing
- Trading infrastructure: Undisclosed. Given firm vintage (1988) and scale ($60B+), presumed large on-prem HPC cluster with GPU acceleration
- DESRES is a distinct legal/operational entity but wholly owned by the Shaw family

**Financing Structure:** Presumed owned — DESRES builds custom hardware (Anton chips), not commercial GPU clusters. Trading infrastructure likely co-located.

**Leadership (Infrastructure-Relevant):**
- David Shaw, Founder (mostly focused on DESRES research now)
- No public CTO for trading arm

**Insurance Implications for RVG:**
- **Extremely complex target** — two distinct infrastructure risks (trading HPC + DESRES custom silicon)
- DESRES's Anton machines are one-of-a-kind; replacement value is effectively uncapped and not market-priced
- Very unlikely to engage standard insurance products — would require a bespoke approach
- The scientific/academic nature of DESRES creates different risk appetite vs. the trading arm

---

### Renaissance Technologies

**Overview:** ~$130B AUM (largest quant fund). East Setauket, NY. Most secretive firm in finance. The Medallion Fund has returned ~66% annually (before fees) since 1988. No public infrastructure disclosures whatsoever.

**GPU Fleet Estimate:** **Partially disclosed — CPU cores known, GPU unknown**
- Renaissance operates **50,000+ computer cores** with **200+ Gbps global connectivity** (disclosed)
- Research database grows **40+ terabytes/day**; petabyte-scale data warehouse
- Peter Brown (CEO) quote: *"We want our scientists to be as productive as possible. And that means providing them with the best infrastructure money can buy."*
- 90 PhDs (math, physics, CS) use this infrastructure for algorithm development
- The 50,000-core figure dates from a period before GPU-dominant ML — current GPU count is completely unknown but presumed to have grown substantially
- Safe assumption given firm scale and CEO mandate: **significant on-prem HPC cluster, likely 2,000–10,000+ GPUs**, but this is pure inference

**Financing Structure:** Presumed entirely owned — the secrecy around all operations suggests zero cloud exposure (cloud = third-party audit exposure)

**Leadership (Infrastructure-Relevant):**
- Peter Brown & Robert Mercer (historical CEOs; Mercer departed 2017)
- Current leadership not public

**Insurance Implications for RVG:**
- Highest secrecy barrier in the sector — unlikely to engage without extraordinary confidentiality protocols
- If engaged, the "insurance" framing may need to be repositioned as risk advisory to get through the door
- Potential for largest single GPU fleet of any quant fund, given Medallion's AUM and research intensity

---

### Other Notable Quant Funds with GPU Infrastructure

**Point72 Asset Management (Steve Cohen)**
- ~$35B AUM; actively expanding ML/AI capabilities
- Acquired Cubist Systematic Strategies as systematic quant arm
- Confirmed NVIDIA DGX usage per industry reports

**Millennium Management (Izzy Englander)**
- ~$70B AUM; pod-based structure with 260+ pods all running their own models
- Massively distributed compute requirements
- Likely large GPU fleet to support hundreds of independent trading teams

**Two Harbors / AQR Capital**
- AQR (~$120B AUM): Cliff Asness; less GPU-intensive historically but expanding ML
- Publicly traded real estate strategies less GPU-heavy than pure quant

---

*[Quant Finance section written — writing Biotech/Pharma next]*

---

## VERTICAL 2: BIOTECH / PHARMA GPU USERS

> Biotech and pharma are increasingly GPU-intensive. Unlike quant funds, several companies have publicly disclosed GPU infrastructure — often as a marketing/recruitment signal.

---

### BioNTech (BNTX, NASDAQ)

**Overview:** ~$21B market cap (2025). Mainz, Germany. mRNA pioneer; pivoted heavily to AI/ML after COVID-19 vaccine success. Acquired InstaDeep (London-based AI firm) for ~£562M in 2023.

**GPU Fleet: "Kyber" Supercomputer — CONFIRMED SPECS**
- **224 NVIDIA H100 GPUs**
- 80,000+ CPU cores
- 1.7 petabytes of persistent storage
- ~0.5 exaFLOPs FP16 AI performance ("near-exascale")
- Hosted at Equinix data center, Saint-Denis (Paris suburb)
- Announced/unveiled October 2024
- **Ranks in world top 20 H100 GPU clusters** and top 100 supercomputers globally

**What Kyber Does:**
- Trains generative AI models for biological sequences (proteins, antibodies)
- Bayesian Flow Networks for protein/antibody sequence generation
- Models with 15B+ parameters (Meta Llama 3.1-scale efficiency)
- 15,000+ experiments/month across research teams via AIchor platform (2025)
- Core tool for immunotherapy and vaccine pipeline acceleration

**Financing Structure:** **Owned** — co-located at Equinix (not cloud). This is a dedicated, BioNTech-funded supercomputer operated through InstaDeep subsidiary.

**Leadership (Infrastructure-Relevant):**
- Ugur Sahin, CEO & Co-Founder
- Karim Beguir, CEO of InstaDeep (GPU infrastructure lead)
- Özlem Türeci, CMO & Co-Founder

**Insurance Implications for RVG:**
- **Concrete, insurable asset** — 224 H100s is a known, priced fleet (~$224M replacement value at $1M/H100, or ~$89M at market current ~$400K/H100)
- Co-located at Equinix = third-party facility risk
- Kyber failure would directly impact drug discovery pipeline and clinical timelines — consequential loss exposure is very high
- InstaDeep is a wholly-owned subsidiary — the insurance relationship would be with BioNTech at the parent level

---

### AstraZeneca (AZN, NASDAQ/LSE)

**Overview:** ~$230B market cap. Cambridge, UK. One of the most AI-forward big pharma companies. Runs Cambridge-1 (UK's largest AI supercomputer, owned by NVIDIA) as a user.

**GPU Fleet Estimate: Hybrid Cloud — AMD Instinct MI300X + NVIDIA**
- Deployed **AMD Instinct MI300X GPUs** (via TensorWave) for drug discovery and medical imaging — publicly confirmed via AMD case study (2025)
- Uses AMD ROCm software stack for model training
- **Cambridge-1 access** (NVIDIA-owned DGX SuperPOD at Kao Data, Harlow UK): 80 NVIDIA DGX A100 systems; AstraZeneca is a *founding partner-user*, not owner — NVIDIA owns it ($100M NVIDIA investment). AstraZeneca trained MegaMolBART (transformer for chemical structure generation, reaction prediction, molecular optimization) on Cambridge-1. Now part of NVIDIA DGX Cloud.
- Also uses AWS infrastructure for various workloads
- No specific GPU count disclosed, but context suggests **several hundred to low thousands of GPU-equivalents** via cloud + allocated capacity on shared systems

**Key AI Partnerships (2025):**
- IonQ + AWS + NVIDIA for quantum-accelerated drug discovery (20x improvement in Suzuki-Miyaura reaction time-to-solution)
- CSPC Pharmaceutical Group: $110M upfront + $5.22B milestone deal for AI-accelerated oral therapy discovery
- Scaling generative AI for 2030 ambitions (disclosed public target)

**Financing Structure:** **Cloud-primary** (AWS, TensorWave for AMD GPUs, access to Cambridge-1). Some internal HPC likely exists but not publicly confirmed.

**Leadership (Infrastructure-Relevant):**
- Pascal Soriot, CEO
- Puja Uppal, Chief Digital and Information Officer
- Dario Amodei connection: AZ has historically collaborated with AI research groups

**Insurance Implications for RVG:**
- Cloud-primary = lower owned-asset exposure, but third-party dependency risk
- Massive pipeline value (>$50B in clinical programs) means compute outages have enormous consequential exposure
- AMD GPU bet is interesting — less mainstream than NVIDIA, potentially harder to replace quickly
- Public company = more disclosure-friendly for insurance engagement

---

### Schrödinger, Inc. (SDGR, NASDAQ)

**Overview:** ~$2–3B market cap. New York. Sells physics-based molecular simulation software AND runs its own drug pipeline using that software. Dual revenue model (software licenses + drug collaboration royalties).

**GPU Fleet: Cloud-Primary, Massive Burst Capacity**
- No owned large GPU fleet — instead uses cloud GPU as a service model
- **Google Cloud strategic agreement** providing computing "equivalent to the world's most powerful supercomputers"
- During COVID-19: Google Cloud grant provided **16 million GPU-hours** (~1,826 years of continuous compute)
- NVIDIA DGX A100 partnership: customers can deploy on single DGX or cluster of 20+ DGX (DGX SuperPOD) — Schrödinger itself has access to DGX-scale systems
- Evaluates **billions of molecules per week** through parallel GPU computing
- Individual drug programs: hundreds of thousands of GPU-hours per candidate
- Desmond MD software: 60–80x faster on GPU vs. CPU

**What They Compute:**
- Molecular dynamics (MD) simulations
- Free energy perturbation calculations (FEP+)
- Quantum mechanics/molecular mechanics (QM/MM)
- Virtual screening at billion-molecule scale

**Financing Structure:** **Cloud-first** (Google Cloud primary; AWS secondary; NVIDIA partnership access). Software-as-a-Service model means compute costs are partly borne by customers.

**Leadership (Infrastructure-Relevant):**
- Ramy Farid, CEO
- Karen Akinsanya, Chief Biomedical Officer

**Insurance Implications for RVG:**
- Interesting profile: Schrödinger's risk is partly in its customer's GPU infrastructure (they sell software that runs on others' GPUs)
- Their own cloud GPU exposure is significant during peak research campaigns
- As a NASDAQ-listed company with ~$500M/year revenue, GPU availability is directly tied to revenue recognition
- Potential: insure Schrödinger's cloud GPU reservation contracts against provider outage

---

### Recursion Pharmaceuticals (RXRX, NASDAQ)

**Overview:** ~$1–3B market cap (volatile). Salt Lake City, Utah. Self-described "TechBio" company — treats drug discovery as a data/compute problem. One of the most transparent GPU operators in pharma.

**GPU Fleet: BioHive-2 — CONFIRMED SPECS (Most Transparent Pharma GPU Operator)**
- **504 NVIDIA H100 Tensor Core GPUs** (63 DGX H100 systems)
- NVIDIA Quantum-2 InfiniBand networking
- **2 exaFLOPs of AI performance**
- **#35 on TOP500 list** (May 2024) — largest supercomputer wholly owned by any pharmaceutical company
- ~5x faster than predecessor BioHive-1
- Physically located at Recursion's Salt Lake City facility

**BioHive-1 (predecessor):**
- ~128 A100 GPUs (estimated from public statements pre-BioHive-2)

**What BioHive-2 Does:**
- Trained Phenom-1: foundation model on 3.5+ billion cellular images
- Predicts protein targets for ~36 billion compounds in Enamine REAL Space
- Trained Boltz-2 protein structure prediction model
- Runs multiple large-scale AI projects in parallel
- Platform for Valence Discovery (subsidiary) drug programs

**Financing Structure:** **Owned** (on-prem at Recursion HQ/SLC facility). Funded through public equity raises (RXRX is listed). Total capex for BioHive-2 not disclosed but 504 H100s ≈ **$200–500M replacement value**.

**Leadership (Infrastructure-Relevant):**
- Chris Gibson, CEO & Co-Founder
- Ben Mabey, CTO
- Najat Khan, Chief R&D Officer

**Insurance Implications for RVG:**
- **Best-in-class transparency** — known GPU count, known location, known workloads
- Public company = audited financials, easier due diligence
- On-prem owned fleet = direct GPU fleet insurance product applies cleanly
- BioHive-2 is the entire company's data engine — downtime = pipeline stoppage
- Ben Mabey (CTO) is the right contact for infrastructure insurance conversations
- Revenue is still largely from collaboration deals, not product sales — any disruption to compute hits partnership milestone delivery

---

### Insilico Medicine

**Overview:** Private, ~$1.5B valuation (2023 raise). Hong Kong/New York. AI-first drug discovery company. Notable for ISM001-055 (IPF drug) entering Phase II — first fully AI-designed molecule to reach this stage.

**GPU Fleet: Cloud-Migrating, NVIDIA-Primary**
- Originally: early NVIDIA DGX adopter (~2015, pre-DGX launch); NVIDIA Tensor Core GPUs in Chemistry42 engine
- **2024 migration to AWS SageMaker** (50% complete as of July 2024, full migration ongoing)
- Migrated to centralized cloud model for scale, collaboration, and access to latest GPUs
- Result: ML model iteration time reduced from 50 days → 3 days (16x speedup)
- Model deployment cycle: every 2 weeks vs. every few months previously
- Also on Microsoft Discovery platform (Nach01 foundation model) for Azure GPU access
- No public GPU count — fully cloud-dependent model

**Financing Structure:** **Cloud** (AWS SageMaker primary; Azure for specific workloads). No disclosed owned fleet.

**Leadership (Infrastructure-Relevant):**
- Alex Zhavoronkov, CEO & Founder
- Feng Ren, Co-CEO/Chief Scientific Officer

**Insurance Implications for RVG:**
- Pure cloud model = AWS/Azure dependency risk
- Fast-moving company: cloud migration means infrastructure footprint is changing quarterly
- First AI-native drug to reach Phase II clinical trials — regulatory milestone creates interesting insurance narrative
- Lilly partnership ($100M+) means external stakeholders have exposure to Insilico's compute health
- Engagement timing: NOW while AWS migration is in progress → infrastructure risk is actively being restructured

---

### Other Notable Pharma GPU Users

**Amgen**
- Building internal AI supercomputer (disclosed at GTC 2024); ~$150B market cap
- NVIDIA BioNeMo platform adopter

**Pfizer**
- BioNeMo adopter; scale not disclosed; AWS-primary cloud strategy

**Eli Lilly**
- $100M+ Insilico partnership + OpenAI partnership; own ML infrastructure at scale

**Genentech/Roche**
- NVIDIA partnership for protein structure prediction
- Large internal HPC for protein biology research

---

*[Biotech/Pharma section written — writing Media/Streaming next]*

---

## VERTICAL 3: MEDIA / STREAMING GPU USERS

> Media companies use GPUs primarily for: (1) ML-based content recommendation, (2) generative AI for content creation, (3) video encoding/transcoding acceleration, (4) advertising targeting models. Scale is significant but often cloud-based and elastic.

---

### Netflix

**Overview:** ~$300B market cap. Los Gatos, CA. ~300M subscribers. Spends ~$17B/year on content. ML is central to every part of the business: recommendations, search, artwork personalization, pricing, scheduling.

**GPU Fleet: AWS-Exclusive, Cloud-Native**
- Netflix runs **100% on AWS** — no owned data centers
- GPU compute via AWS EC2: G4 instances (T4 GPUs), G5 instances (A10G GPUs), P4d instances (A100 GPUs)
- Uses heterogeneous GPU/CPU clusters via Titus (Netflix's container orchestration platform)
- Metaflow (Netflix's ML platform): supports thousands of projects, hundreds of millions of compute jobs, petabytes of data
- Recommendation serving: **millions of prediction requests per second** globally
- Uses Ray for distributed heterogeneous training clusters; uses Faiss for ANN at scale
- No public GPU count; estimates range from several thousand to tens of thousands of GPU-equivalents at peak

**Key ML Use Cases:**
- Personalized recommendation (covers ~80% of what users watch)
- Artwork/thumbnail personalization (A/B tested at massive scale)
- Content demand forecasting
- Video quality optimization (video codecs, encoding)
- Ad targeting (post-ads launch, 2022+)

**Financing Structure:** **100% cloud (AWS)**. No owned GPU infrastructure. Netflix's GPU exposure is entirely in AWS EC2 contracts.

**Leadership (Infrastructure-Relevant):**
- Greg Peters, Co-CEO
- Elizabeth Stone, CTO (joined 2023 from Netflix data science)
- Spence Kimball (previously built Titus, Netflix's internal platform)

**Insurance Implications for RVG:**
- No owned GPUs = no direct fleet insurance angle
- However: Netflix's entire ML platform runs on AWS → **AWS outage = Netflix ML outage** → measurable revenue impact
- Parametric cloud outage coverage (tied to AWS status page events) could be compelling
- ML downtime affects recommendation quality → subscriber churn risk (not immediate but measurable over days)
- High-value target but needs a cloud-dependency product rather than GPU fleet product

---

### Spotify

**Overview:** ~$100B market cap. Stockholm. ~640M users, ~260M subscribers. Runs 220+ active ML projects. AI DJ, Discover Weekly, Podcast recommendations, and new LLM-based annotation systems.

**GPU Fleet: Google Cloud-Primary**
- Spotify is **exclusively on Google Cloud Platform (GCP)** since 2016
- GPU compute via GCP: Uses NVIDIA T4 GPUs (confirmed for podcast preview ML) and other GCP GPU instances
- ML workloads via Kubeflow + GCP; centralized Spotify-Ray platform for scale-out
- 500B events/day → 70TB compressed data → massive inference workload
- 220+ active ML projects via ML Home gateway
- No public GPU count; fully elastic cloud model

**Key ML Use Cases:**
- Audio recommendation (Discover Weekly, Daily Mix, Blend)
- AI DJ (launched Feb 2023; 25% of listening time for engaged users)
- Podcast content understanding and preview generation
- LLM-based content annotation (2024: millions of songs/videos/podcasts)
- Fine-tuned Llama models for recommendation narratives

**Financing Structure:** **100% cloud (GCP)**. No owned GPU infrastructure. Expanded GCP partnership announced in 2024.

**Leadership (Infrastructure-Relevant):**
- Daniel Ek, CEO & Founder
- Gustav Söderström, Co-President & CPO (owns product/tech vision)
- Engineering blog active at engineering.atspotify.com

**Insurance Implications for RVG:**
- No owned GPUs = same dynamic as Netflix
- GCP single-provider dependency = cloud outage risk
- 220+ active ML projects means any GCP outage has widespread internal impact
- Recommendation quality directly tied to user engagement/retention → subscriber revenue risk
- Spotify's AI DJ and personalization are now product differentiators → compute reliability = competitive moat reliability

---

### Adobe Systems (ADBE, NASDAQ)

**Overview:** ~$180B market cap. San Jose, CA. Creative Cloud (100M+ users), Document Cloud, Experience Cloud. Firefly is Adobe's generative AI brand — trained on licensed content.

**GPU Fleet: AWS-Primary + NVIDIA Partnership**
- Trains Firefly on **AWS EC2 P5 instances (H100 GPUs)** and **P4d instances (A100 GPUs)**
- Uses Amazon EKS, Amazon EBS, Amazon EFA (high-bandwidth networking)
- **Scaled Firefly training 20x in 6 months** using EC2 Reserved Instances
- Launched Firefly family of generative AI models in 9 months (March 2023)
- **March 2025: Strategic partnership with NVIDIA** for next-generation Firefly models (underpinned by NVIDIA infrastructure)
- Training uses pipeline parallelism and distributed training across tensor cores
- No public GPU count; AWS-elastic model

**What Firefly Trains For:**
- Text-to-image generation (commercially safe, trained on licensed content)
- Text-to-video models
- Generative Fill, Generative Expand, AI image editing
- Vector/graphic generation for illustrators
- Audio generation (launched at Adobe MAX 2025)

**Financing Structure:** **Cloud-primary (AWS)** with NVIDIA infrastructure partnership for next-gen models (may involve some dedicated/reserved capacity or on-prem NVIDIA DGX systems).

**Leadership (Infrastructure-Relevant):**
- Shantanu Narayen, CEO
- Abhay Parasnis, EVP & CPO (AI strategy)
- NVIDIA partnership managed at C-suite level

**Insurance Implications for RVG:**
- AWS-primary model = cloud dependency, not owned fleet
- However, NVIDIA partnership (March 2025) may introduce dedicated GPU infrastructure → watch for owned/co-lo component
- Firefly is central to Adobe's growth narrative (Creative Cloud subscription retention/upsell)
- Firefly downtime = creative workflow disruption for 100M+ Creative Cloud users → large consequential loss
- Adobe's content licensing model (licensed training data) is a unique regulatory risk layer on top of compute risk
- **Best engagement timing: POST-NVIDIA partnership** — as they build out dedicated Firefly infrastructure, owned GPU exposure increases

---

### Stability AI

**Overview:** Private. London/San Francisco. Creator of Stable Diffusion open-source image model. Currently under new leadership after near-collapse in 2023–2024.

**GPU Fleet: Cloud-Only (After Financial Crisis)**

**The Crisis (2023–2024):**
- GPU infrastructure costs: ~**$99M/year** in cloud GPU bills (AWS, GCP, CoreWeave)
- Total expenses: ~$153M/year vs. <$5M quarterly revenue
- By October 2023: only **$4 million cash remaining**
- Unpaid AWS bill: $1M underpayment July 2023; $7M August 2023 invoice with no payment intent
- CoreWeave and Google Cloud also underpaid: ~$1.6M in outstanding debt
- Plan to **resell GPU capacity** at CoreWeave to Andreessen Horowitz (potential $139M from GPU sub-leasing)
- Near-total collapse; founder Emad Mostaque resigned March 2024

**Recovery (Late 2024–2025):**
- New CEO: Prem Akkaraju (former Snap executive)
- "Recapitalization" involving forgiveness of **>$100M in debt + $300M future spending obligations** by suppliers
- New funding secured in 2024; company claims triple-digit growth by December 2024
- Debt eliminated; expanding into film, TV, enterprise integrations

**Current Infrastructure Status:**
- Fully cloud-dependent (AWS + CoreWeave primary)
- No owned GPU fleet — never had one
- Current contracted GPU capacity unknown post-restructuring

**Financing Structure:** **100% cloud (AWS + CoreWeave + GCP)**. History of not paying bills. New management claims financial stabilization.

**Leadership (Infrastructure-Relevant):**
- Prem Akkaraju, CEO (since April 2024)
- Previous: Emad Mostaque (founder, departed March 2024)

**Insurance Implications for RVG:**
- **Do not engage currently** — credit risk too high despite claimed turnaround
- The Stability AI story is the canonical cautionary tale for GPU cloud dependency
- Historical $99M/year GPU bill demonstrates the scale of cloud GPU spend for a mid-tier AI company
- Interesting as a benchmarking data point: what does $99M/year in cloud GPU buy? Approximately equivalent to ~1,000 H100 GPUs in dedicated cloud at current pricing
- If Stability achieves financial stability (12+ months of clean financials), could be revisited as a cloud dependency coverage target

---

*[Media/Streaming section written — file complete]*

---

## CROSS-VERTICAL SYNTHESIS: KEY INSURANCE THEMES

### 1. Owned vs. Cloud Split

| Vertical | Primarily Owned | Primarily Cloud | Hybrid |
|----------|----------------|-----------------|--------|
| Quant Finance | Renaissance, D.E. Shaw | — | Two Sigma, Citadel, Jane Street |
| Biotech/Pharma | Recursion, BioNTech | Insilico, Schrödinger | AstraZeneca |
| Media/Streaming | — | Netflix, Spotify, Adobe | Stability AI (cloud; financial risk) |

**Takeaway:** Quant finance = highest proportion of owned/co-lo GPU infrastructure (secrecy + latency requirements). Biotech = mixed. Media = almost entirely cloud.

### 2. Highest-Priority Owned-Fleet Targets

1. **Recursion Pharmaceuticals (RXRX)** — 504 H100s, publicly disclosed, public company, willing to talk
2. **BioNTech/InstaDeep** — 224 H100s, known location (Equinix Paris), willing to market their infrastructure
3. **Citadel Securities** — Undisclosed but significant; HPC team is public-facing
4. **Jane Street** — Hybrid owned+cloud; CoreWeave relationship provides partial visibility

### 3. Cloud Dependency Insurance Opportunities

For cloud-primary operators, the RVG product angle shifts from "GPU fleet insurance" to:
- **Parametric cloud outage coverage** (AWS, GCP, CoreWeave uptime triggers)
- **Revenue protection** tied to ML platform availability
- **Consequential loss** for recommendation/model downtime

Best candidates: Netflix (AWS), Spotify (GCP), Adobe (AWS)

### 4. Key Contacts / Entry Points

| Company | Best Entry Point |
|---------|-----------------|
| Recursion | Ben Mabey (CTO) |
| BioNTech/InstaDeep | Karim Beguir (InstaDeep CEO) |
| AstraZeneca | Puja Uppal (CDIO) |
| Jane Street | Via CoreWeave relationship? |
| Citadel | HPC team lead (unknown, but NYC-based) |
| Adobe | Post-NVIDIA partnership infrastructure team |

### 5. Data Gaps

- Renaissance Technologies: complete blackout; entry via ex-employees or industry events only
- Two Sigma: no specific GPU counts; "supercomputing" claim is unverified beyond 2016 report
- D.E. Shaw trading arm: entirely separate from DESRES; no infrastructure data
- Spotify/Netflix GPU counts: elastic cloud makes static counting meaningless

---

*Research complete: 2026-03-29. Written by Brock (subagent wave6-missing-verticals).*

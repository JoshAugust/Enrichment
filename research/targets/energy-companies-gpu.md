# Energy Companies Using GPUs for AI/ML
*Research compiled: March 2026*

---

## OIL MAJORS — Seismic Analysis & AI on GPU

---

### 1. ExxonMobil
- **HQ:** Spring, Texas, USA
- **AI/GPU Use Cases:**
  - 4D seismic imaging: "Discovery 6" supercomputer deployed in H1 2025
  - Elastic Full Wavefield Inversion (eFWI) for near-real-time reservoir visualization
  - ML algorithms for geological/seismic data analysis; cut drilling design planning from 12–18 months to 7 months
  - Target: $15B in operating cost savings by 2027 via AI/process automation
- **GPU Infrastructure:**
  - **Discovery 6**: HPE Cray EX4000 with **4,032 NVIDIA Grace Hopper Superchips** (~222 PFlops peak)
  - 4× faster than its predecessor Discovery 5
  - Built by Hewlett Packard Enterprise with HPE Slingshot interconnect
- **Key AI/Digital Executives:**
  - **M.P. Zamora** — President, ExxonMobil Technology and Engineering Company
  - **Andrew Curry** — Manager, Central Data Office
  - **Neil Hansen** — President, Global Business Solutions (through early 2026)
- **Notable:** Discovery 6 specifically targeting >$1B value capture at Stabroek Block (Guyana) FPSOs via faster seismic

---

### 2. Saudi Aramco
- **HQ:** Dhahran, Saudi Arabia
- **AI/GPU Use Cases:**
  - Seismic imaging acceleration: algorithms run 40× faster on GPU vs. conventional hardware
  - AI assistant for seismic data processing (NVIDIA TensorRT-LLM + Triton Inference Server + NeMo Guardrails)
  - Quantum computing emulator with NVIDIA for 3D seismic fault detection
  - 442 identified AI use cases; 200+ deployed; $1.8B AI-driven Technology Realized Value in 2024
- **GPU Infrastructure:**
  - **Dammam-7 supercomputer**: 55.4 petaflops peak, **1,000+ GPU nodes**, developed with Cray/HPE and Solutions by STC
  - Ranked #71 on Top500 list
  - 2025: SAR 1.4B ($371M) contract with STC Solutions for two new HPC systems (Upstream Supercomputers Project)
- **Key AI/Digital Executives:**
  - Not publicly named in CDO/CTO role; digital transformation driven through Aramco's upstream tech org
- **Notable:** One of the most advanced GPU deployments in the energy sector; quantum emulator work with NVIDIA is industry-first

---

### 3. TotalEnergies
- **HQ:** Courbevoie (Paris area), France
- **AI/GPU Use Cases:**
  - Seismic imaging, seismic acquisition, reservoir simulation, geological basin modeling
  - Carbon capture & geological storage (CCS) simulation
  - Gen AI via Microsoft 365 Copilot + Copilot Studio; partnership with Mistral AI (2025)
- **GPU Infrastructure:**
  - **Pangea 4** (launched July 2024): 1.6 petaflops, hybrid on-prem + cloud (Pangea@Cloud)
  - 87% more power-efficient than prior gen; 5.5 Gflops/W; reduced to 7 racks on-site
  - Previous gen (Pangea III, 2020): 31.7 petaflops — was #1 in industry at launch
  - Lifespan: 2024–2028, located at Jean Féger R&D Center, Pau, France
- **Key AI/Digital Executives:**
  - **Frédéric Gimenez** — Chief Digital Officer & Digital Factory Managing Director (AI150 executive 2024–25)
  - **Namita Shah** — President, OneTech
  - **Gilles Cochevelou** — former CDO (appointed 2021)
- **Notable:** Pangea 4 is intentionally smaller/more efficient vs. prior brute-force approach; TotalEnergies is pairing this with cloud burst capacity

---

### 4. BP
- **HQ:** London, UK
- **AI/GPU Use Cases:**
  - Seismic data interpretation: AI reduces analysis from months to days (90% time reduction via Belmont Technologies "Sandy" platform)
  - Bluware deep learning for seismic interpretation
  - HPC center in Houston driving global technical innovation
  - Company-wide Gen AI rollout via Palantir Foundry + Microsoft Copilot
  - Unified data platform: Databricks + Palantir
- **GPU Infrastructure:**
  - Houston-based HPC center (capacity not publicly disclosed)
  - Sept 2025: hosted 2-day workshop on HPC advances in seismic processing and basin innovation
- **Key AI/Digital Executives:**
  - **Ahmed Hashmi** — Chief Digital and Technology Officer, BP Upstream
- **Notable:** BP's approach emphasizes workflow AI (geophysicist augmentation) over raw compute scale; strong Palantir partnership

---

### 5. Shell
- **HQ:** The Hague, Netherlands
- **AI/GPU Use Cases:**
  - Seismic interpretation: SparkCognition Gen AI cut analysis timeline from 9 months to <9 days
  - Deep learning QC of seismic data during processing
  - Agentic AI for upstream ops (SLB co-development agreement, Dec 2025)
  - Material science, fluid dynamics simulation
- **GPU Infrastructure:**
  - Houston data center: **864 dual-socket systems** with AMD EPYC 9654 (96-core) = 165,888 CPU cores total
  - Powered by 100% renewable energy; Penguin Computing Altus servers with immersion cooling
  - No recent disclosed GPU-specific supercomputer (CPU-heavy recent upgrade)
- **Key AI/Digital Executives:**
  - **Maria Papastathi** — Chief Data Officer – Technology
  - **Dan Jeavons** — VP Computational Science and Digital Innovation
- **Notable:** Shell's 2025 upgrade was CPU-centric (AMD EPYC); GPU-specific cluster details not publicly disclosed

---

### 6. Equinor
- **HQ:** Stavanger, Norway
- **AI/GPU Use Cases:**
  - Seismic interpretation: AI interpreted **2 million km²** of Norwegian Continental Shelf in 2025 (10× capacity increase)
  - $130M saved via AI in 2025 ($330M since 2020)
  - Databricks platform for seismic calculations: up to **96% cost reduction**
  - AI-first exploration and subsurface analytics
- **GPU Infrastructure:**
  - Specifics not publicly disclosed; uses Databricks cloud + on-prem HPC
  - GPU workloads likely cloud-burst (Azure/AWS)
- **Key AI/Digital Executives:**
  - **Hege Skryseth** — EVP Technology, Digital & Innovation (since 2022)
  - **Torbjørn Folgerø** — SVP & Chief Digital Officer
- **Notable:** Most measurable AI ROI in the sector ($330M cumulative); Databricks partnership is central to cost-effective seismic compute

---

### 7. Chevron
- **HQ:** San Ramon, California, USA
- **AI/GPU Use Cases:**
  - Seismic imaging and 3D subsurface mapping with NVIDIA GPUs
  - AI algorithm collaboration with Eliis for seismic interpretation (April 2024)
  - Predictive maintenance: sensors on thousands of high-value equipment (Microsoft Azure)
  - ML/DL systems for scalable production environments
  - Also positioning as AI data center power supplier (West Texas project, up to 4 GW by 2027)
- **GPU Infrastructure:**
  - NVIDIA GPU clusters for seismic workloads (scale not publicly disclosed)
  - Cloud + on-prem hybrid
- **Key AI/Digital Executives:**
  - **T. Ryder Booth** — Chief Technology and Engineering Officer (from June 2025)
  - **Les Copeland** — Chief Information Officer
  - **Eimear Bonner** — former CTO, now CFO (transitioned March 2024)
- **Notable:** Unique dual role: Chevron is both a GPU/AI user AND building infrastructure to power AI data centers

---

## MINING COMPANIES

---

### 8. BHP
- **HQ:** Melbourne, Australia (operational HQ in Brisbane)
- **AI/GPU Use Cases:**
  - Geological exploration: proprietary ML models discovered new deposit (~1.3B tonnes copper/gold near Olympic Dam)
  - AI-powered plant control at Escondida copper mine: saved 3B litres water + 118 GWh energy since FY22
  - Autonomous equipment and safety monitoring
  - AI Hub (Singapore, May 2025): enterprise-wide AI challenge-solving
- **GPU Infrastructure:**
  - No specific GPU cluster disclosed; likely cloud-based (AWS/Azure) for ML workloads
  - Industry AI Hub in Singapore is collaborative/R&D focused
- **Key AI/Digital Executives:**
  - **Johan van Jaarsveld** — Chief Technical Officer (leads AI Hub initiative)
  - **Brandon Craig** — BHP Americas President (AI spokesperson)
- **Notable:** ML-discovered deposit is one of the most concrete ROI examples in mining; BHP AI maturity described as "earlier phase" vs. Rio Tinto

---

### 9. Rio Tinto
- **HQ:** London, UK (dual-listed; operational centers in Perth, Australia & Montreal, Canada)
- **AI/GPU Use Cases:**
  - Predictive maintenance (ML team established 7+ years ago)
  - Mine planning optimization for Pilbara iron ore operations
  - Autonomous haul trucks and drills (fleet-wide, Pilbara)
  - Digital twins with Palantir for operational efficiency
  - Computer vision for safety/PPE compliance and species tracking
- **GPU Infrastructure:**
  - AWS SageMaker Studio + Canvas for model build/deploy
  - No proprietary GPU supercomputer disclosed; primarily cloud-native ML
- **Key AI/Digital Executives:**
  - **Mark Davies** — Chief Technical Officer
  - **Dan Evans** — Chief Information Officer
  - **Jakob Stausholm** — CEO (AI-forward messaging)
- **Notable:** Longest-running ML program among major miners; autonomous Pilbara fleet is among the world's largest autonomous industrial deployments

---

## UTILITY COMPANIES

---

### 10. Enel Group
- **HQ:** Rome, Italy
- **AI/GPU Use Cases:**
  - Grid Digital Twin (announced Sept 2025): virtual replica of entire grid network; automated 80% of customer quotes
  - 250+ AI applications deployed by July 2024; 5% energy efficiency boost
  - 40% reduction in power disruptions since 2025
  - Virtual Power Plant (VPP) with Leap (Dec 2025)
  - €26B grid modernization investment 2025–2027
- **GPU Infrastructure:**
  - Primarily cloud-based; specific GPU cluster details not disclosed
  - Heavy investment in AI/ML platforms for grid ops
- **Key AI/Digital Executives:**
  - Not publicly named in search results; digital transformation led through group IT/innovation org
- **Notable:** Grid Digital Twin is one of the most ambitious utility AI deployments globally

---

### 11. Iberdrola
- **HQ:** Bilbao, Spain
- **AI/GPU Use Cases:**
  - 150+ AI use cases presented at Digital Summit 2025
  - Smart grid management, demand forecasting, predictive maintenance
  - First company to certify AI Management System under ISO/IEC 42001 (Feb 2025)
  - "niba" AI-native energy startup; "East-West Digital" AI solutions company launched
  - €2B JV (Echelon Iberdrola Digital Infra) to build hyperscale data centers in Spain
  - 150 MW PPA with Microsoft
- **GPU Infrastructure:**
  - Shifting from internal GPU/AI use to building AI infrastructure (data centers) for others
  - €400M/year R&D investment in 2025
- **Key AI/Digital Executives:**
  - AI Centre of Excellence established (specific CDO name not found in search)
- **Notable:** Most aggressive pivot of any utility — from AI user to AI infrastructure provider; ISO AI certification is industry-first

---

## SUMMARY TABLE

| Company | Sector | HQ | GPU/HPC Scale | Top AI Use Case | Key Executive |
|---|---|---|---|---|---|
| ExxonMobil | Oil Major | Houston, TX | 4,032 NVIDIA Grace Hopper chips (222 PFlops) | 4D seismic imaging | M.P. Zamora (Tech & Eng President) |
| Saudi Aramco | Oil Major | Dhahran, Saudi Arabia | 1,000+ GPU nodes, 55.4 PFlops + $371M new HPC | Seismic + quantum emulation | (Tech org, not named) |
| TotalEnergies | Oil Major | Courbevoie, France | Pangea 4 (1.6 PFlops hybrid); prior Pangea III was 31.7 PFlops | Seismic, reservoir sim, CCS | Frédéric Gimenez (CDO) |
| BP | Oil Major | London, UK | Houston HPC center (scale undisclosed) | AI seismic interpretation | Ahmed Hashmi (CDTO Upstream) |
| Shell | Oil Major | The Hague, Netherlands | 165,888 CPU cores (AMD EPYC); GPU scale undisclosed | Seismic interpretation, agentic AI | Maria Papastathi (CDO); Dan Jeavons (VP Comp. Sci) |
| Equinor | Oil Major | Stavanger, Norway | Cloud HPC (scale undisclosed); 96% cost reduction via Databricks | 2M km² seismic AI interpretation | Hege Skryseth (EVP Tech, Digital & Innovation) |
| Chevron | Oil Major | San Ramon, CA | NVIDIA GPUs (scale undisclosed); cloud hybrid | Seismic imaging, predictive maintenance | T. Ryder Booth (CTEO); Les Copeland (CIO) |
| BHP | Mining | Melbourne, Australia | Cloud-based ML (scale undisclosed) | ML-driven mineral discovery | Johan van Jaarsveld (CTO) |
| Rio Tinto | Mining | London, UK | Cloud-native AWS SageMaker (scale undisclosed) | Autonomous mining, predictive maintenance | Mark Davies (CTO); Dan Evans (CIO) |
| Enel | Utility | Rome, Italy | Cloud-based (scale undisclosed) | Grid Digital Twin, VPP | (Not publicly named) |
| Iberdrola | Utility | Bilbao, Spain | Pivoting to build GPU infra for others; €2B data center JV | Smart grid, 150+ AI use cases | AI CoE (CDO not named) |

---

## RESEARCH NOTES

- **Strongest GPU plays (most specific/confirmed):** ExxonMobil (Discovery 6), Saudi Aramco (Dammam-7), TotalEnergies (Pangea series)
- **Most measurable AI ROI:** Equinor ($330M cumulative savings), Saudi Aramco ($1.8B value in 2024)
- **Most aggressive AI pivots:** Iberdrola (building AI infra), BHP (Singapore AI Hub launch 2025)
- **Data gaps:** Shell GPU cluster specifics, Chevron HPC scale, Equinor on-prem GPU details, utility company CDO names for Enel/Iberdrola
- **Key vendor relationships:** NVIDIA (Aramco, ExxonMobil, Chevron), HPE/Cray (ExxonMobil, Aramco), Palantir (BP, Rio Tinto), Databricks (Equinor, BP), Microsoft Azure (Chevron, BP, Iberdrola), AWS (Rio Tinto, BHP)

*Sources: HPCwire, HPE Newsroom, Aramco press releases, company annual reports, Equinor.com, EnkiAI, SPE Journal of Petroleum Technology, NVIDIA blog*

# US Government GPU Procurement Research

**Research Date:** 2026-03-29  
**Coverage:** CHIPS Act manufacturing subsidies, NAIRR, NSF ACCESS, DoD CDAO/JAIC, DOE National Labs, USAspending/federal contracts  

---

## 1. NAIRR — National AI Research Resource Pilot

**Program Overview**  
Launched January 2024 by NSF + OSTP as a 2-year pilot. Managed by NSF's Office of Advanced Cyberinfrastructure (OAC). 14 federal agencies + 28 private sector partners. Supported 600+ research projects, 6,000+ students across all 50 states. Total compute capacity ~3.77 exaFLOPS (≈5,000 H100 equivalents).

**Key Leadership**  
- **Katie Antypas** — Director, NSF Office of Advanced Cyberinfrastructure (OAC); leads NAIRR Pilot  
- **Contact:** NAIRR_Pilot@nsf.gov  

**Compute Resources / GPU Fleet**

| Resource | Host Institution | GPUs / Accelerators | Notes |
|---|---|---|---|
| Expanse | SDSC (San Diego) | 136 NVIDIA H100 (34 nodes × 4 H100) | Dell XE9640 servers |
| Anvil | Purdue University | 84 NVIDIA H100 SXM | — |
| Bridges-2 | Pittsburgh Supercomputing Center | 80 NVIDIA H100 SXM5 80GB (10 nodes × 8) | — |
| Delta / DeltaAI | NCSA, UIUC | 208 NVIDIA GH200 Grace Hopper (52 nodes × 4) + 64 H200 (8 nodes × 8) | 2.6M A100-eq GPU hrs/yr for NAIRR |
| NVIDIA DGX (via NVIDIA contribution) | NVIDIA (donated access) | ~$24M DGX compute access | Part of $30M total NVIDIA contribution |
| Azure credits | Microsoft | $20M in Azure credits; up to $3.5M via Deep Partnerships track | — |
| AWS credits | Amazon Web Services | Compute/storage/AI services for 20+ projects | Amount undisclosed |

**Funding Source:** NSF + 14 federal agencies + private contributions  
**Total Compute Allocation:** ~3.3 million GPU or node hours; ~3.2 yottaFLOPs  
**Program Status (2025):** NSF announced funding to establish a permanent NAIRR Operations Center (NAIRR-OC), up to $35M

---

## 2. NSF ACCESS Program (Replaced XSEDE, 2022–present)

**Program Overview**  
Advanced Cyberinfrastructure Coordination Ecosystem: Services & Support. Federal HPC resource allocation program for US researchers.

**Key Contacts**  
- **Robert B. Chadduck** — Program Director, CISE/OAC — rchadduc@nsf.gov / (703) 292-2247  
- **Alejandro Suarez** — Assoc. Program Director, CISE/OAC — alsuarez@nsf.gov / (703) 292-7092  

**Major GPU Resources**

| System | Host | GPU Fleet | Contact |
|---|---|---|---|
| Expanse | SDSC, UC San Diego | NVIDIA A100 GPU nodes; recently added H100s via NAIRR | consult@sdsc.edu / +1-858-534-5090 |
| Bridges-2 | Pittsburgh Supercomputing Center (PSC) | NVIDIA V100 + H100 SXM5 nodes (H100s added for NAIRR) | help@psc.edu |
| Delta / DeltaAI | NCSA, Univ. of Illinois | NVIDIA A100 + H100 + GH200 + H200 (see NAIRR above) | help@ncsa.illinois.edu |
| Anvil | Purdue University | NVIDIA A100 (standard); H100 SXM added for NAIRR | — |
| Stampede3 | TACC, UT Austin | NVIDIA H100 SXM5 (560 nodes), Intel Xeon Max | — |

**Funding Source:** NSF (Office of Advanced Cyberinfrastructure)  
**Notes:** ACCESS manages allocation of GPU compute hours to researchers. Not a direct hardware procurement — NSF funds the facilities which buy the hardware.

---

## 3. DoD — CDAO / JAIC AI Infrastructure

**Organizational Note**  
JAIC (Joint Artificial Intelligence Center) was absorbed into the **Chief Digital and Artificial Intelligence Office (CDAO)** in February 2022 (full operating capability June 2022). CDAO is the primary DoD AI acquisition and policy body.

**Website:** ai.mil

**Major Contracts / GPU-Relevant Programs**

| Program / Contract | Value | Contractor / GPU Detail | Year |
|---|---|---|---|
| MITRE AI "Sandbox" (DGX SuperPOD) | $20M | NVIDIA — DGX SuperPOD, 256 GPUs (32 nodes × 8) for federal agency AI research | May 2024 |
| Frontier AI Contracts (Anthropic, Google, OpenAI, xAI) | Up to $200M each (~$800M total) | Includes AI compute/model access; Google awarded $200M for CDAO cloud + AI | July 2025 |
| AI Talent 2.0 BOA | Up to $249M | Multiple awardees (AvaWatz, others); AI services/talent | 2024 |
| Navy NAVAIR H100 Solicitation | Value undisclosed | NVIDIA H100 NVL 94GB GPUs (firm fixed price) | June 2024 |
| Army ruggedized GPU system | $1.3M | One Stop Systems — NVIDIA Jetson AGX Orin + A100 GPUs for vehicle visualization | Feb 2023 |

**Key DoD AI Contacts**  
- **CDAO:** ai.mil — public contact portal  
- **Carahsoft Technology Corp** is the primary Nvidia federal IT distribution partner (contract vehicles: 4400012235, 43210000-23-OMNIA-ACS, 30-00000-23-00067)  
- **DARPA** (historical GPU R&D): $25M UHPC program, $23M Software Defined Hardware program, $20M PERFECT program — Nvidia as prime  

**Estimated DoD GPU Fleet:** Fragmented across agencies; majority of large-scale GPU contracts are classified or restricted. Open-source data shows hundreds to low thousands of disclosed AI GPUs; actual fleet likely much larger.

---

## 4. DOE National Labs — GPU Clusters

### 4a. Oak Ridge National Laboratory (ORNL)

| System | GPUs | Accelerator | Nodes | Peak Perf | Cost | Status |
|---|---|---|---|---|---|---|
| **Frontier** | 37,888 | AMD Instinct MI250X (each = 2 GCDs) | 9,472 | 1.206 ExaFLOPS (HPL) | ~$600M | Live (#1 TOP500 2022–2023) |

- **Funding Source:** DOE Office of Science, ASCR  
- **Contract vehicle:** HPE Cray (EX system); AMD  
- **Key contact:** OLCF User Assistance — help@olcf.ornl.gov  
- **Notes:** Frontier is the world's first exascale system. AMD MI250X contains 4 HBM2E-equipped GCDs per package.

---

### 4b. Argonne National Laboratory (ANL)

| System | GPUs | Accelerator | Nodes | Peak Perf | Status |
|---|---|---|---|---|---|
| **Aurora** | 63,744 | Intel Data Center GPU Max (Ponte Vecchio, 128GB HBM) | 10,624 blades | ~2 ExaFLOPS | Delivered 2024 |
| **Equinox** *(planned)* | 10,000 | NVIDIA Blackwell | — | — | Expected 2026 |
| **Solstice** *(planned)* | 100,000 | NVIDIA Blackwell | — | — | Future (post-2026) |

- **Funding Source:** DOE / ASCR (Aurora); DOE public-private partnership with NVIDIA + Oracle (Equinox & Solstice)  
- **Partnership Announced:** October 28, 2025 at NVIDIA GTC D.C. — DOE + Argonne + NVIDIA + Oracle  
- **Oracle provides:** Immediate cloud access to NVIDIA Hopper+Blackwell for Argonne scientists  
- **Key contact:** ALCF User Support — support@alcf.anl.gov  

---

### 4c. Lawrence Livermore National Laboratory (LLNL)

| System | GPUs | Accelerator | Nodes | Peak Perf | Status |
|---|---|---|---|---|---|
| **El Capitan** | 43,808 | AMD Instinct MI300A APU (128GB HBM3 unified, 228 CUs, 61.3 TFLOPS FP64/device) | ~11,000 | ~2 ExaFLOPS | Delivered Nov 2024 |
| **Sierra** *(decommissioned)* | 17,280 | NVIDIA Tesla V100 (16GB, NVLink) | 4,284 compute | 125 PetaFLOPS | Decommissioned ~2024 |
| **Lassen** | ~3,072 | NVIDIA Tesla V100 (unclassified companion to Sierra) | ~800 | ~18 PF | Operational |

- **Funding Source:** NNSA (National Nuclear Security Administration), ASC (Advanced Simulation & Computing) program  
- **Primary mission:** Nuclear stockpile stewardship, classified national security  
- **Contract vehicle:** El Capitan — HPE Cray EX; AMD  
- **Key contact:** LLNL HPC Support — lc-hotline@llnl.gov  

---

### 4d. Sandia National Laboratories

| System | GPUs / Accelerator | Nodes / Cores | Peak Perf | Year | Status |
|---|---|---|---|---|---|
| **Hops (CTS-2)** | NVIDIA H100 SXM5 80GB | 40,960 cores total | 10.03 PetaFLOPS | 2024 | Operational |
| **El Dorado** | AMD Instinct MI300A | 383,040 cores | 68.02 PetaFLOPS | 2024 | Operational |
| **Stout** | CPU-only (Intel Xeon Platinum 8480+) | 170,128 cores | 8.9 PetaFLOPS | 2023 | TOP500 #87 (Nov 2023) |
| **Kingfisher** | Cerebras AI accelerators | — | — | 2024 | AI-specific research |

- **Funding Source:** NNSA / ASC program  
- **NVIDIA Partnership (Nov 2023):** Sandia + NNSA labs partnered with NVIDIA on Advanced Memory Technology (AMT) program — targeting 40× performance improvement over exascale  
- **Key contact:** hpc@sandia.gov  

---

### 4e. Los Alamos National Laboratory (LANL)

| System | GPUs | Accelerator | Notes |
|---|---|---|---|
| **Venado** | ~36,000 | NVIDIA GH200 Grace Hopper (180 GB HBM3) | HPE Cray EX system; delivered 2024 |
| **Crossroads (ATS-3)** | CPU-focused | Intel Xeon Max | CPU-primary, some GPU nodes |

- **Funding Source:** NNSA / ASC  
- **Notes:** Venado is LANL's primary AI+HPC system; GH200 chips are same architecture as in NAIRR's DeltaAI.  

---

## 5. CHIPS and Science Act — Semiconductor Manufacturing Context

**Note:** The CHIPS Act funds semiconductor *manufacturing* capacity, not direct GPU procurement. However, these investments directly determine future US GPU supply availability (primarily through TSMC Arizona fabs producing Nvidia/AMD dies).

| Recipient | Award | Fab/Use | Location |
|---|---|---|---|
| **TSMC** | $6.6B direct + $5B loans | 3 leading-edge fabs (incl. AI chip production) | Phoenix, AZ |
| **Intel** | $7.86B direct + $3B advanced chip government contract | Fabs in AZ, NM, OR, OH | Multi-state |
| **Samsung** | $4.75B | 2nm logic fabs + R&D | Taylor, TX + Austin, TX |
| **Micron** | $6.165B | Advanced DRAM memory (HBM supply chain adjacent) | Multiple US sites |
| **SK Hynix** | $458M | HBM chip assembly/packaging (critical for AI GPUs) | West Lafayette, IN |

- **AI Relevance:** TSMC Arizona Fab 21 will produce Apple A-series, Nvidia, AMD chips. SK Hynix HBM award directly impacts HBM supply for H100/H200/B100-class GPUs.  
- **Funding Source:** CHIPS and Science Act (2022), Department of Commerce  
- **Key contact:** CHIPS Program Office — commerce.gov/chips  

---

## 6. Federal Contract Database — Nvidia GPU Purchases (USAspending.gov)

**What's findable publicly:**

| Contract / Solicitation | Agency | Item | Value | Year |
|---|---|---|---|---|
| MITRE DGX SuperPOD | MITRE Corp (FFRDC) | 256 NVIDIA GPUs (DGX SuperPOD) | $20M | 2024 |
| N0042124Q0316 (NAVAIR) | Dept. of Navy, Naval Air Systems Command | NVIDIA H100 NVL 94GB GPUs | Undisclosed | June 2024 |
| Army OSS Order | U.S. Army | NVIDIA Jetson AGX Orin + A100 ruggedized | $1.3M | Feb 2023 |
| CONT_AWD_75N92018K00088 | NIH/HHS | NVIDIA (contract on USAspending) | Varies | 2018+ |

**Carahsoft contract vehicles for Nvidia (active):**  
- `4400012235` (Nov 2023 – Apr 2026)  
- `43210000-23-OMNIA-ACS` (Feb 2024 – Apr 2026)  
- `30-00000-23-00067` (Apr 2023 – Apr 2027)  

**USAspending search tips:**  
- Search vendor: "NVIDIA CORP" or "CARAHSOFT TECHNOLOGY CORP"  
- NAICS: 334413 (Semiconductor Manufacturing), 334111 (Electronic Computer Manufacturing)  
- PSC: 7021 (ADP Central Processing Units), 7010/7025 (IT equipment)  

**Notes:** Majority of DoD GPU procurements are via classified contracts or aggregated IT procurement vehicles. True fleet size across DoD likely 10,000–50,000+ data center GPUs based on disclosed spending patterns, but hard to confirm publicly.

---

## 7. Additional Notable Entities

### MITRE Corporation (FFRDC)
- **Program:** MITRE AI Lab / AI Sandbox  
- **GPU Fleet:** 256 NVIDIA GPUs (DGX SuperPOD, 32 nodes × 8 GPUs)  
- **Funding:** ~$20M, supports federal agency AI R&D  
- **Contact:** mitre.org/capabilities/ai  

### Intelligence Community / NSA / CIA
- **Status:** Classified. Known to operate large AI compute clusters; specific GPU counts not public.  
- **Context:** CIA's venture arm (In-Q-Tel) funded early AI GPU research; AWS GovCloud and Azure Government are primary cloud providers for IC GPU workloads.  

### Stargate Project (Semi-governmental context)
- **Not a direct government procurement.** Private JV (OpenAI, SoftBank, Oracle, MGX).  
- **Scale:** Up to $500B AI infrastructure investment; ~64,000 NVIDIA GPUs reported for Phase 1.  
- **Government nexus:** Announced at White House (Jan 2025), treated as US strategic AI infrastructure.  

---

## Summary Table — Estimated GPU Fleets by Entity

| Organization | Program | Est. GPU Fleet | Key Accelerators | Funding Source |
|---|---|---|---|---|
| ANL (Argonne) | Aurora | 63,744 | Intel GPU Max (Ponte Vecchio) | DOE/ASCR |
| ANL (planned) | Equinox + Solstice | 10,000 + 100,000 | NVIDIA Blackwell | DOE + NVIDIA/Oracle PPP |
| ORNL | Frontier | 37,888 | AMD MI250X | DOE/ASCR |
| LLNL | El Capitan | 43,808 | AMD MI300A | NNSA/ASC |
| LLNL | Lassen | ~3,072 | NVIDIA V100 | NNSA/ASC |
| LANL | Venado | ~36,000 | NVIDIA GH200 | NNSA/ASC |
| Sandia | El Dorado | ~13,440 (est.) | AMD MI300A | NNSA/ASC |
| Sandia | Hops | ~1,280 (est.) | NVIDIA H100 SXM5 | NNSA/ASC |
| NSF ACCESS / NAIRR | Delta/DeltaAI | 208 GH200 + 64 H200 | NVIDIA GH200, H200 | NSF |
| NSF ACCESS / NAIRR | Bridges-2 | ~80 H100 | NVIDIA H100 SXM5 | NSF |
| NSF ACCESS / NAIRR | Expanse | ~136 H100 | NVIDIA H100 | NSF |
| NSF ACCESS / NAIRR | Anvil | 84 H100 | NVIDIA H100 SXM | NSF |
| NAIRR (NVIDIA contrib.) | DGX access | ~$24M compute | NVIDIA DGX platform | Private (NVIDIA) |
| DoD / MITRE | AI Sandbox | 256 | NVIDIA DGX SuperPOD | MITRE/DoD ~$20M |
| DoD / CDAO | Various classified + cloud | Unknown (likely 10K–50K+) | Nvidia H100 + cloud | DoD budget |

---

## Sources & Links

- nairrpilot.org — NAIRR Pilot allocations, awarded projects  
- access-ci.org — NSF ACCESS program  
- ai.mil — DoD CDAO  
- hpc.llnl.gov — LLNL El Capitan, Sierra  
- olcf.ornl.gov — ORNL Frontier  
- alcf.anl.gov — ANL Aurora, Equinox/Solstice  
- hpc.sandia.gov — Sandia HPC clusters  
- energy.gov/articles/energy-department-announces-new-partnership-nvidia-and-oracle — DOE/NVIDIA/Oracle announcement  
- usaspending.gov — Federal contract search  
- carahsoft.com/nvidia/contracts — Federal Nvidia procurement vehicles  
- semiconductors.org/chip-supply-chain-investments — CHIPS Act tracker  
- CSET Georgetown — NAIRR compute estimates: cset.georgetown.edu/article/the-nairr-pilot-estimating-compute/  

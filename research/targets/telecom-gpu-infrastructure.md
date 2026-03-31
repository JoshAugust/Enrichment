# Telecom Companies with Significant GPU / AI Infrastructure
*Research compiled: 2026-03-29 | Sources: NVIDIA newsroom, company press releases, industry press*

---

## Overview

Telcos are rapidly transforming into AI cloud providers, leveraging their existing network assets (low-latency, national coverage, data sovereignty positioning) to offer GPU-as-a-Service (GPUaaS), sovereign AI factories, and edge inference. NVIDIA is the dominant GPU supplier across virtually all major deals. The scale ranges from hundreds of GPUs (edge deployments) to 50,000+ GPUs (national AI factories).

---

## 1. AT&T (USA)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | Internal AI platform "Ask AT&T" generates ~5 billion tokens/day. Adopted NVIDIA RAPIDS Accelerator for Apache Spark across 590+ petabyte/day data pipelines. Edge AI platform (Cisco AI Grid + NVIDIA GPUs) demonstrated at AT&T Discovery District, Dallas. |
| **Partnerships** | **NVIDIA** (2023–present): NVIDIA AI Enterprise, cuOpt, RAPIDS, Omniverse Avatar Cloud Engine. **Cisco** (2026): Cisco AI Grid with NVIDIA for distributed edge inference. NVIDIA AI Enterprise + NIM microservices. |
| **Estimated GPU Scale** | Not publicly disclosed; internal AI workloads at scale (5B tokens/day implies significant cluster). Edge platform uses NVIDIA GPUs via Cisco's pilot platform. |
| **Key AI Executives** | **Andy Markus** — Chief Data & AI Officer / SVP Data and AI |
| **Notes** | First telco to adopt full NVIDIA AI suite (2023). "AskData" component ranked #1 globally on GenAI BIRD leaderboard (end of 2024). Also collaborating on AI-RAN (AI Radio Access Networks) with NVIDIA. |

---

## 2. Verizon (USA)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | "AI Connect" strategy launched January 2025. NVIDIA GPU chipsets integrated into 5G Private Network + Mobile Edge Compute (MEC). Stack handles LLMs, Vision Language Models, video, CV, AR/VR/XR, AMR/AGV, IoT. Also partnered with Vultr for AI-centric GPU cloud offerings. |
| **Partnerships** | **NVIDIA** (Dec 2024): NVIDIA AI Enterprise + NIM microservices on 5G private networks. **Vultr** (2025): GPU cloud services. **Lambda** (cloud GPU). |
| **Estimated GPU Scale** | Not publicly disclosed; enterprise 5G edge deployments. Planning significant data center + network GPU investments through 2025–2026. |
| **Key AI Executives** | **Mano Mannoochahr** — Chief Data, Analytics & AI Officer (CDAIO); **Alfonso Villanueva** — EVP, Chief Transformation Officer (reports into transformation org post-Nov 2025 restructuring under CEO Dan Schulman) |
| **Notes** | CEO Dan Schulman (took over 2025) named "AI, automation, and digital acceleration" as core pillars. Verizon is one of larger US telcos behind on GPU build vs. AT&T and international peers. |

---

## 3. Deutsche Telekom / T-Systems (Germany)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **Industrial AI Cloud** — Europe's largest industrial AI infrastructure. Munich data center equipped with **1,000+ NVIDIA DGX B200 systems** and NVIDIA RTX PRO Servers = **~10,000 NVIDIA Blackwell GPUs**. Claims to increase AI computing power in Germany by ~50%. Going live Q1 2026. |
| **Partnerships** | **NVIDIA** — $1.2B joint investment (€1B). **SAP** — Business Technology Platform as app layer. **Siemens, Perplexity, Agile Robots, Quantum Systems** — initial 10 ecosystem partners. Perplexity will use it for German sovereign AI inferencing. |
| **Estimated GPU Scale** | **~10,000 NVIDIA Blackwell GPUs** (DGX B200 systems) — confirmed, one of Europe's largest single telco GPU deployments. |
| **Key AI Executives** | **Tim Höttges** — CEO (drives overall AI strategy); **Jon Abrahamson** — Chief Product & Digital Officer (Magenta AI); **Ahmed Hafez** — VP Group Technology Strategy (Data & AI in Networks) |
| **Notes** | Strongest GPU commitment among European telcos. Sovereign AI focus with German/EU data residency. T-Systems is the enterprise/B2B arm delivering the infrastructure commercially. |

---

## 4. NTT (Japan / Global)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **NTT DATA Enterprise AI Factories** (March 2026): NVIDIA-powered adaptive AI ecosystems for enterprise clients globally. Integrates NVIDIA HGX platforms, NeMo, NIM microservices. NTT Communications' **Osaka 7 Data Center** certified under NVIDIA DGX-Ready Data Center program (Sep 2024); Yokohama 1 Data Center coming March 2025. Also running remote GPU compute provision experiments (Feb 2025). |
| **Partnerships** | **NVIDIA** — DGX-Ready certification, NeMo, NIM, HGX platforms. **Dell** — joint healthcare AI (cancer-research hospital radiology). |
| **Estimated GPU Scale** | Multiple DGX-Ready data centers across Japan (Osaka, Yokohama). GPU-as-a-Service across sovereign environments globally. Scale not precisely disclosed — likely thousands of GPUs across the network. |
| **Key AI Executives** | **Akira Shimada** — President & CEO, NTT Corp; **Bill Chang** — referenced in Singtel context; NTT DATA's AI delivery led through Chief Digital Officer org |
| **Notes** | NTT Group is vast (data centers, submarine cables, enterprise IT). NTT DATA is the primary commercialization vehicle. Sovereign cloud + AI delivery across cloud, DC, and on-prem. |

---

## 5. SoftBank Corp (Japan)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **Japan's most powerful AI supercomputer** built on NVIDIA Blackwell platform. Started 2023 with Ampere, expanded to Hopper (H100), then Blackwell. As of July 2025: **>10,000 NVIDIA GPUs total** (DGX SuperPOD with DGX B200 systems, 4,000+ Blackwell GPUs deployed July 2025). Also built and deployed **world's first combined AI + 5G telecom network** using NVIDIA AI Aerial platform. Subsidiary **SB Intuitions** developing Japanese-language LLMs. |
| **Partnerships** | **NVIDIA** — deep strategic partner; DGX SuperPOD, AI Aerial 5G. **OpenAI** — Stargate project ($40B+ commitment, $25B direct SoftBank). **Lambda** — GPUaaS for SK Telecom (separate entity but SoftBank ecosystem). |
| **Estimated GPU Scale** | **>10,000 GPUs** (confirmed July 2025). ¥150B (~$960M) invested in AI computing facilities by 2025. Target: ~25.7 exaflops of compute. |
| **Key AI Executives** | **Junichi Miyakawa** — President & CEO, SoftBank Corp. (primary AI strategy driver; former CTO). **Masayoshi Son** — Group CEO SoftBank Group (visionary; cited Miyakawa for succession). |
| **Notes** | Most aggressive telco GPU investor in Asia. World-first AI-RAN (AI + 5G combined) achieved. By end-2025, employees created 2.5M AI agents company-wide via "Crystal Intelligence" initiative. |

---

## 6. SK Telecom (South Korea)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **"AI Infrastructure Superhighway"** strategy (3 pillars: AIDC, GPUaaS, Edge AI). GPUaaS launched Dec 2024 with NVIDIA H100 (via Lambda partnership, Lambda's first APAC region at Gasan AIDC). H200 deployed in Korea Q1 2025 (first in country). **"Haein" cluster** — one of Korea's largest: **>1,000 NVIDIA Blackwell GPUs** in a single cluster (launched 2025). **SK Group AI factory** (with SK hynix, SKT): **>50,000 NVIDIA GPUs**, first phase by late 2027. Industrial AI Cloud with NVIDIA RTX PRO 6000 Blackwell: **>2,000 GPUs** for Omniverse/physical AI. Hyperscale AIDCs planned at 100MW+, scaling to gigawatt-scale. |
| **Partnerships** | **NVIDIA** — comprehensive: H100, H200, Blackwell, RTX PRO 6000, AI Enterprise. **Lambda** — co-developed GPUaaS. **SK hynix** — HBM memory for NVIDIA GPUs. Korean govt (MSIT) sovereign AI program selected SKT. |
| **Estimated GPU Scale** | Current: **~1,000+ Blackwell GPUs** (Haein cluster) + H100/H200 fleet. Near-term: **50,000+ GPUs** (SK Group AI factory, by 2027). |
| **Key AI Executives** | **Ryu Young-sang** — CEO, SK Telecom (primary AI strategy architect; unveiled AI Pyramid Strategy 2.0) |
| **Notes** | Most aggressive Asian telco on GPU buildout after SoftBank. Positioned as "AI hub of Asia Pacific." GPUaaS commercially launched with Lambda. Haein cluster is a sovereign AI national asset. |

---

## 7. KT Corp (South Korea)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **KT Cloud HAC** (GPU-as-a-Service in virtual environments). Originally deployed **AMD Instinct MI250** accelerators for AI cloud. Now incorporating **NVIDIA Blackwell GPUs** across GPUaaS platform (2025). Part of Korean national AI infrastructure: NVIDIA collaborating with Samsung, SKT, ETRI, **KT**, LGU+ on AI-RAN + 6G. |
| **Partnerships** | **NVIDIA** — AI-RAN development, Blackwell GPUaaS. **AMD** — existing MI250 deployments (KT Cloud). Korean government (MSIT) national 250,000+ GPU sovereign AI program. |
| **Estimated GPU Scale** | Not precisely disclosed. KT Cloud HAC operates across enterprise. Part of 250,000+ GPU national Korean AI infrastructure (shared with NHN Cloud, Kakao, NAVER Cloud). |
| **Key AI Executives** | **Kim Yeong-seop** — CEO, KT Corp (as of 2024–2025). KT Cloud operates as separate subsidiary. |
| **Notes** | KT takes a dual-vendor GPU approach (AMD + NVIDIA) unlike SK Telecom's NVIDIA-first stance. KT Cloud is the primary commercial vehicle. Strong role in 6G AI-RAN R&D with ETRI. |

---

## 8. Telefónica (Spain / LATAM)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | Piloting **distributed edge AI fabric across Spain** with **hundreds of NVIDIA GPUs**. Delivers low-latency, privacy-focused AI services for government and financial services. Uses NVIDIA AI Enterprise software + NIM microservices. Part of NVIDIA GTC Paris (VivaTech 2025) European telco AI sovereign infrastructure announcement. |
| **Partnerships** | **NVIDIA** — sovereign AI factories and edge infrastructure (announced GTC Paris 2025). Part of broader European telco group with Orange, Fastweb, Swisscom, Telenor. |
| **Estimated GPU Scale** | **Hundreds of NVIDIA GPUs** across distributed edge nodes in Spain (pilot phase as of 2025). Scale expected to grow as enterprise demand matures. |
| **Key AI Executives** | **José María Álvarez-Pallete** — Executive Chairman & CEO, Telefónica. **Chema Alonso** — Chief Digital Officer (key AI strategy driver). |
| **Notes** | Focus is sovereign edge AI (keeping data in-country for Spain/EU). Telefónica Tech is the B2B arm commercializing AI. LATAM expansion of AI services is a longer-term play. |

---

## 9. Orange (France / Europe / Africa)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **Orange Business Cloud Avenue** — NVIDIA-powered sovereign AI cloud. Joined **NVIDIA Cloud Partner Network** (NPN) to deliver sovereign AI across Europe to 30,000 B2B customers. Deploying AI for internal use: **73,000 employees** regularly using AI solutions, **30,000+ requests/day**. Part of European deployment: **3,000+ exaflops** of NVIDIA Blackwell compute across France, Italy, Spain, UK sovereign AI deployments. Developing agentic AI, LLMs, personal AI assistants on Cloud Avenue. |
| **Partnerships** | **NVIDIA** — NVIDIA Cloud Partner, NPN; Cloud Avenue built on NVIDIA infrastructure. Part of NVIDIA GTC Paris 2025 European announcement alongside Telefónica, Fastweb, Swisscom, Telenor. |
| **Estimated GPU Scale** | Part of the 3,000+ exaflops European Blackwell deployment. Exact GPU count not disclosed; Cloud Avenue spans France + European DCs. |
| **Key AI Executives** | **Christel Heydemann** — CEO, Orange Group. **Aliette Mousnier-Lompré** — CEO, Orange Business (enterprise/B2B AI commercialization lead). |
| **Notes** | "Live Intelligence" is Orange's AI platform for B2B customers. Orange has one of the strongest internal AI adoption profiles among European telcos (73K employees). Africa expansion is a key differentiator vs. European peers. |

---

## 10. Vodafone (UK / Europe / Africa)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **No direct GPU hardware purchases** (deliberate strategy). CTO Scott Petty explicitly stated rapid GPU evolution makes direct ownership impractical ("N-2 by time deployed"). Instead: leveraging hyperscaler GPUs via Microsoft Azure (OpenAI), Google Cloud (Vertex AI). **$1.5B / 10-year Microsoft partnership** (Jan 2024) for GenAI + cloud. **$1B+ / 10-year Google partnership** (Oct 2024) for Gemini, Vertex AI, devices. 55,000 Microsoft Copilot + 68,000 Microsoft AI tool seats deployed. |
| **Partnerships** | **Microsoft Azure / OpenAI** — $1.5B, 10-year. LLMs run on Azure OpenAI. **Google Cloud / Gemini** — $1B+, 10-year. Vertex AI Search, Gemini 1.5 Pro, traditional ML. No current direct Nvidia partnership for hardware. |
| **Estimated GPU Scale** | Zero owned GPU hardware. Consumes GPU capacity via Azure + GCP hyperscalers. One of the largest hyperscaler cloud tenants among telcos. |
| **Key AI Executives** | **Margherita Della Valle** — CEO, Vodafone Group (since Jan 2023; drives AI-as-competitive-differentiator strategy). **Scott Petty** — CTO (skeptic of GPU ownership model, architect of hyperscaler strategy). |
| **Notes** | Outlier in this research — deliberately avoids Nvidia GPU ownership. Also skeptical of AI-RAN needing GPUs. Strategy is hyperscaler-dependent but capex-light. Being largest European telco by revenue, this is a notable data point. |

---

## 11. BT Group (UK)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | Primarily cloud-based AI, not GPU hardware ownership. **"GenAI Gateway"** platform (Sept 2024) built on **AWS Bedrock + Amazon SageMaker** — gives BT access to Anthropic Claude, Meta LLaMA, Cohere, etc. 25% cost savings from AI automation. **Google Cloud** expanded partnership (Mar 2025) — UK data residency for compliance. **ServiceNow AI** (June 2024, multi-year) — 55% reduction in case summary time, 1/3 improvement in MTTR, £25M savings projected over 5 years. |
| **Partnerships** | **AWS** — GenAI Gateway, Amazon Bedrock, SageMaker. **Google Cloud** — UK data center, AI-native networking. **ServiceNow** — Now Assist for operational AI. No confirmed direct Nvidia GPU infrastructure deployment. |
| **Estimated GPU Scale** | No owned GPU cluster. AI workloads run on AWS/GCP infrastructure. BT is a consumer of cloud GPU capacity, not an operator. |
| **Key AI Executives** | **Allison Kirkby** — CEO, BT Group (since Feb 2024). **Rob Shuter** — Chief Network and IT Officer. |
| **Notes** | BT's strategy is operationally-focused AI (cost efficiency, MTTR, customer service) rather than infrastructure buildout. No sovereign AI or GPUaaS play visible as of early 2026. Similar positioning to Vodafone but via AWS rather than Azure/GCP primarily. |

---

## 12. Singtel (Singapore / Asia Pacific)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | **GPUaaS launched March 2024** via Nxera data centers (Singapore), powered by NVIDIA H100 clusters. **First telco to deploy GB200 Grace Blackwell Superchips** (among world's first). Nxera DCs running **GB200 Blackwell at ~200kW per rack**. GPUaaS expanding to Thailand, Indonesia, Malaysia (mid-2025 onwards). **Center of Excellence** with NVIDIA (announced Feb 2026, launch June 2026) — targeting banks, hospitals, government for sovereign AI. **"Micro AI Grid"** with NVIDIA to bridge pilot-to-production gap. RE:AI — AI Cloud Service for democratizing enterprise AI access. |
| **Partnerships** | **NVIDIA** — strategic partner; DGX-Ready, GB200, NIM microservices, Center of Excellence. **Nscale** — unlocked GPU capacity globally (AMD + NVIDIA in Europe). **Hitachi** (Aug 2024 MOU) — GPU Cloud in Japan + APAC. **Vultr** — GPU workload hosting. **Bridge Alliance** — GPUaaS across Southeast Asia. **GMI Cloud** — GPUaaS expansion. **H2O.ai** — GenAI-as-a-Service. |
| **Estimated GPU Scale** | H100 clusters (Nxera Singapore) + GB200 Blackwell systems at 200kW/rack density. Exact GPU count not disclosed; likely hundreds to low thousands. EBITDA from DC expected to double in 18 months (Nov 2024 guidance). |
| **Key AI Executives** | **Yuen Kuan Moon** — Group CEO, Singtel. **Bill Chang** — CEO, Nxera and Singtel Digital InfraCo (primary GPU/AI infrastructure leader). |
| **Notes** | Singtel's Nxera (Digital InfraCo) is the dedicated vehicle for GPU/AI infrastructure. Strongest GPUaaS execution among APAC telcos alongside SK Telecom. Paragon orchestration platform differentiates their offering. Critical sovereign AI partner for Singapore financial and government sector. |

---

## 13. Telstra (Australia)

| Field | Details |
|-------|---------|
| **GPU/AI Infrastructure** | No confirmed direct GPU hardware ownership as of early 2026. Strategy is AI-enabled connectivity infrastructure + partnership model. **"Connected Future 30"** five-year strategy (announced May 2025) — AI centrality for network transformation, 6G prep, fibre. **Microsoft partnership** (Aug 2024) — 21,000 Copilot licenses; Microsoft using Telstra's Intercity Fibre Network for AI infrastructure in Australia. **Telstra/Accenture JV** (Jan 2025, 60/40 Accenture/Telstra) — AI Silicon Valley hub in Mountain View; partners include AWS, Databricks, Microsoft. InfraCo exploring AI-ready infrastructure and new growth. CEO Vicki Brady: "Australia doesn't need its own LLMs" — pragmatic cloud-first stance. |
| **Partnerships** | **Microsoft** — Copilot licenses, fibre deal for Azure AI infra in Australia. **Accenture** — global AI JV (agentic AI, data/AI roadmap acceleration). **AWS, Databricks** — JV ecosystem partners. No confirmed Nvidia GPU infrastructure partnership. |
| **Estimated GPU Scale** | No GPU hardware owned. Relies on cloud GPU via hyperscalers. InfraCo positioning around connectivity for AI data centers (hosting Microsoft's AI infra on Telstra's fibre). |
| **Key AI Executives** | **Vicki Brady** — CEO, Telstra. **Michael Ackland** — Group Executive, Consumer & Small Business. **InfraCo leadership** (unnamed in press) driving AI-ready infrastructure. |
| **Notes** | Telstra is a connectivity/infrastructure enabler for AI rather than a GPU operator. The Accenture JV is the primary mechanism for internal AI transformation. The Microsoft fibre deal positions Telstra as critical underlay infrastructure for AI in Australia. Similar pragmatism to Vodafone and BT. |

---

## Summary Comparison Table

| Company | GPU Approach | Estimated GPU Scale | Key GPU Partner | AI Product/Service |
|---------|-------------|--------------------|-----------------|--------------------|
| **Deutsche Telekom** | Own & operate | ~10,000 Blackwell GPUs | NVIDIA (€1B deal) | Industrial AI Cloud |
| **SK Telecom** | Own & operate + GPUaaS | 1,000+ now; 50,000+ by 2027 | NVIDIA | Haein cluster, GPUaaS |
| **SoftBank** | Own & operate | >10,000 GPUs | NVIDIA | AI supercomputer, AI-RAN |
| **Singtel** | Own & operate + GPUaaS | Hundreds–thousands (H100, GB200) | NVIDIA | Nxera GPUaaS, RE:AI |
| **NTT** | Own & operate + service | Multi-DC, DGX-Ready | NVIDIA | Enterprise AI Factories |
| **Orange** | Operate (NPN cloud) | Undisclosed (3,000+ exaflops EU-wide) | NVIDIA | Cloud Avenue, Live Intelligence |
| **Telefónica** | Edge pilot | Hundreds (pilot) | NVIDIA | Edge AI fabric Spain |
| **AT&T** | Internal + edge | Undisclosed (large) | NVIDIA + Cisco | Ask AT&T, Cisco AI Grid |
| **Verizon** | 5G edge + cloud | Undisclosed | NVIDIA + Vultr | AI Connect, 5G MEC |
| **KT Corp** | Own + GPUaaS | Undisclosed (AMD + NVIDIA) | NVIDIA + AMD | HAC GPUaaS |
| **Vodafone** | No hardware | Zero owned | Microsoft / Google | Azure AI, Vertex AI |
| **BT Group** | No hardware | Zero owned | AWS / Google | GenAI Gateway |
| **Telstra** | No hardware | Zero owned | Microsoft / Accenture | Connected Future 30 |

---

## Key Observations

1. **NVIDIA dominates**: Every telco with GPU hardware uses NVIDIA. No pure AMD or Intel GPU play at telco scale (KT Cloud is the only AMD dual-vendor exception).

2. **Three tiers of engagement**:
   - **Tier 1 (GPU Operators)**: Deutsche Telekom, SK Telecom, SoftBank — building 10,000–50,000+ GPU deployments, becoming AI cloud providers.
   - **Tier 2 (GPU Services)**: Singtel, NTT, Orange, AT&T, Verizon, Telefónica — GPUaaS offerings, internal AI, or edge pilots with hundreds to thousands of GPUs.
   - **Tier 3 (Hyperscaler-Dependent)**: Vodafone, BT, Telstra — deliberately avoid hardware; use Azure/GCP/AWS for all GPU workloads.

3. **Sovereign AI is the narrative**: Nearly every hardware-owning telco frames GPU investments around "data sovereignty" — keeping AI workloads within national borders. This is especially pronounced in Germany, Japan, South Korea, Singapore.

4. **GPUaaS is the commercial model**: SK Telecom, Singtel, KT Corp, NTT DATA all have commercial GPUaaS products. Deutsche Telekom and SoftBank are close to launching theirs.

5. **AI-RAN is the next frontier**: AT&T, SoftBank, SK Telecom, and KT Corp are all investing in AI-RAN — using AI/GPU at the base station level for 5G/6G network optimization. SoftBank claims the world's first production AI-RAN.

---

*Sources: NVIDIA Newsroom, company investor presentations, TelecomTV, Light Reading, Data Center Dynamics, RCR Wireless, Korea Herald, Fortune, Bloomberg, Computer Weekly, Mobile World Live.*

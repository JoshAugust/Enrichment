# GPU Infrastructure Conference Speakers 2024-2025

*Research compiled from NVIDIA GTC 2024/2025, SC24 (Supercomputing 2024), MLSys 2024, Hot Chips 2024*
*Last updated: 2026-03-29*

---

## Summary

**48 unique companies/organizations** identified presenting on GPU clusters, large-scale training infrastructure, HPC deployment, and AI data center operations at major AI/HPC conferences in 2024-2025.

---

## Companies & Speakers

---

## HOT CHIPS 2024 (August 25–27, 2024 — Stanford, CA)

---

### 1. OpenAI
- **Speaker:** Trevor Cai (Infrastructure)
- **Conference:** Hot Chips 2024 — **Keynote #1**
- **Talk:** "Predictable Scaling and Infrastructure"
- **GPU Operations Signal:** OpenAI dedicated their keynote slot to compute infrastructure strategy. "Predictable scaling" reveals they're solving reliability and consistency at extreme GPU cluster scales — critical for GPT-4 and future training runs. Cai's presence signals OpenAI has a substantial dedicated infrastructure engineering team managing petaflop-class GPU training.

---

### 2. NVIDIA
- **Speaker:** Ajay Tirumala & Raymond Wong
- **Conference:** Hot Chips 2024
- **Talk:** "NVIDIA Blackwell Platform: Advancing Generative AI and Accelerated Computing"
- **GPU Operations Signal:** GB200 NVL72 system — 72 Blackwell GPUs + 36 Grace CPUs — is the reference design for next-generation GPU cluster racks. 30x faster inference for LLMs vs. Hopper, FP4 precision support. This talk defines the hardware standard that all hyperscalers and cloud providers will deploy in 2025–2026.

---

### 3. AMD
- **Speaker:** Alan Smith & Vamsi Krishna Alla
- **Conference:** Hot Chips 2024
- **Talk:** "AMD Instinct MI300X Generative AI Accelerator and Platform Architecture"
- **Additional Speaker:** Victor Peng (AMD President) — Keynote #2: "The Journey to Life with AI Pervasiveness"
- **GPU Operations Signal:** MI300X is AMD's flagship datacenter GPU competing with NVIDIA H100/H200. Victor Peng's keynote signals AMD's C-suite is personally pitching AI data center infrastructure. AMD is actively winning GPU cluster deployments at Microsoft Azure and elsewhere.

---

### 4. Intel
- **Speaker:** Roman Kaplan
- **Conference:** Hot Chips 2024
- **Talk:** "Intel Gaudi 3 AI Accelerator: Architected for Gen AI Training and Inference"
- **GPU Operations Signal:** Gaudi 3 targets both training and inference workloads as a cost-competitive H100 alternative. Intel is pitching to cloud operators for GPU cluster deployments and disclosed performance benchmarks against NVIDIA at Hot Chips.

---

### 5. Microsoft
- **Speaker:** Sherry Xu & Chandru Ramakrishnan
- **Conference:** Hot Chips 2024
- **Talk:** "Inside MAIA 100"
- **GPU Operations Signal:** MAIA 100 is Microsoft's custom AI accelerator for Azure. Reveals Microsoft is vertically integrating custom silicon alongside NVIDIA GPUs — reducing per-query GPU cost for inference at Azure scale.

---

### 6. Meta / Facebook AI Research
- **Speaker:** Mahesh Maddury & Pankaj Kansal
- **Conference:** Hot Chips 2024
- **Talk:** "Next Gen MTIA — Meta's Recommendation Inference Accelerator"
- **GPU Operations Signal:** MTIA is Meta's in-house inference chip for recommendation systems. Reveals Meta is building custom silicon alongside GPU clusters to offload billions of daily inference calls, reducing GPU spend.

---

### 7. Tesla
- **Speaker:** Eric Quinnell
- **Conference:** Hot Chips 2024
- **Talk:** "DOJO: An Exa-Scale Lossy AI Network using the Tesla Transport Protocol over Ethernet (TTPoE)"
- **GPU Operations Signal:** Tesla's Dojo supercomputer uses a custom networking protocol (TTPoE) for exascale ML training. Reveals Tesla has built proprietary training infrastructure for Autopilot — with GPU-equivalent compute at massive scale, entirely outside the NVIDIA ecosystem.

---

### 8. Cerebras Systems
- **Speaker:** Sean Lie (Co-founder & CTO)
- **Conference:** Hot Chips 2024
- **Talk:** "Wafer-Scale AI: Enabling Unprecedented AI Compute Performance" (subtitled "GPU Impossible Performance")
- **GPU Operations Signal:** Cerebras operates wafer-scale compute clusters competing with GPU deployments for LLM training. Their direct GPU-comparison framing signals active enterprise customer conversations displacing GPU orders.

---

### 9. SambaNova Systems
- **Speaker:** Raghu Prabhakar
- **Conference:** Hot Chips 2024
- **Talk:** "SambaNova SN40L RDU: Breaking the Barrier of Trillion+ Parameter Scale Gen AI Computing"
- **GPU Operations Signal:** SambaNova's RDU (Reconfigurable Dataflow Unit) targets trillion-parameter models. Presence at Hot Chips signals active competition for large-scale AI training contracts against NVIDIA GPU-based solutions.

---

### 10. Broadcom
- **Speaker:** Manish Mehta
- **Conference:** Hot Chips 2024
- **Talk:** "An AI Compute ASIC with Optical Attach to Enable Next Generation Scale-up Architectures"
- **GPU Operations Signal:** Broadcom is building custom AI compute ASICs (confirmed supplier for Google TPUs, and others) with optical interconnects for GPU-scale networking. Directly enables hyperscaler custom silicon programs at Google, Meta, and others.

---

### 11. Enfabrica
- **Speaker:** Shrijeet Mukherjee & Thomas Norrie
- **Conference:** Hot Chips 2024
- **Talk:** "ACF-S: An 8-Tbit/s SuperNIC for High-Performance Data Movement in AI & Accelerated Compute Networks"
- **GPU Operations Signal:** Enfabrica builds networking silicon for GPU clusters. Their 8 Tbit/s SuperNIC directly powers GPU-to-GPU data movement in large AI training clusters — their hyperscaler customers are building at 10K+ GPU scale.

---

### 12. FuriosaAI
- **Speaker:** June Paik
- **Conference:** Hot Chips 2024
- **Talk:** "FuriosaAI RNGD: A Tensor Contraction Processor for Sustainable AI Computing"
- **GPU Operations Signal:** Korean AI chip startup with a server-class AI accelerator targeting inference workloads in GPU data centers. Presence at Hot Chips signals they have deployments or active procurement conversations with Korean hyperscalers/enterprises.

---

### 13. Tenstorrent
- **Speaker:** Jasmina Vasiljevic & Davor Capalija
- **Conference:** Hot Chips 2024
- **Talk:** "Blackhole & TT-Metalium: The Standalone AI Computer and its Programming Model"
- **GPU Operations Signal:** Jim Keller's startup building AI compute systems competitive with GPU clusters. Their "standalone AI computer" framing directly challenges NVIDIA's GPU rack paradigm — targeting enterprises evaluating GPU cluster replacements.

---

### 14. Ampere Computing
- **Speaker:** Matthew Erler
- **Conference:** Hot Chips 2024
- **Talk:** "AmpereOne: Sustainable Computing for AI & Cloud Native Workloads"
- **GPU Operations Signal:** Ampere's cloud-native ARM CPUs are deployed in GPU cluster CPU hosts at OCI (Oracle Cloud) and others. This is the CPU pairing that powers GPU racks — their presence signals optimization of the CPU-GPU host boundary in large clusters.

---

### 15. Preferred Networks
- **Speaker:** Jun Makino
- **Conference:** Hot Chips 2024
- **Talk:** "MN-Core 2: Second-generation processor of MN-Core architecture for AI and general-purpose HPC applications"
- **GPU Operations Signal:** Japanese AI/ML company (Toyota partner) building custom HPC/AI silicon. MN-Core targets both AI training and HPC — reveals Japan-based sovereign AI compute investment outside NVIDIA's ecosystem.

---

### 16. IBM
- **Speaker:** Chris Berry
- **Conference:** Hot Chips 2024
- **Talk:** "IBM Next Generation Processor and AI Accelerator" (Telum II + Spyre Accelerator)
- **GPU Operations Signal:** IBM is integrating AI acceleration directly into server CPUs (Spyre accelerator) — relevant to enterprise HPC data centers managing GPU workloads. IBM's enterprise install base of systems will increasingly co-deploy GPU clusters.

---

### 17. SK Hynix
- **Speaker:** Guhyun Kim
- **Conference:** Hot Chips 2024
- **Talk:** "SK Hynix AI-Specific Computing Memory Solution: AiM device to Heterogeneous AiMX-xPU System for Comprehensive LLM Inference"
- **GPU Operations Signal:** SK Hynix (NVIDIA's primary HBM3 supplier for H100/H200/B200) revealed their in-memory compute ("AiM") architecture. This signals SK Hynix is building up the stack from memory component supplier to full system-level AI compute — while their HBM output continues to constrain GPU supply globally.

---

### 18. Supermicro
- **Speaker:** Tom Garvens
- **Conference:** Hot Chips 2024 (Tutorial: "The Cooling of Hot Chips")
- **Talk:** "Thermal techniques for higher data center compute density"
- **GPU Operations Signal:** Supermicro is the largest GPU server OEM (builds H100/H200/B200 servers sold to hyperscalers and GPU cloud providers). Their cooling presentation reveals the thermal management challenges of deploying GPU racks at 40–100kW/rack densities.

---

### 19. Qualcomm
- **Speaker:** Gerard Williams (CPU arch), Nader Nikfar (thermal, edge)
- **Conference:** Hot Chips 2024
- **Talk:** Snapdragon X Elite CPU + Edge device thermal management
- **GPU Operations Signal:** Qualcomm's Cloud AI 100 inference cards are deployed in enterprise AI data centers. While their Hot Chips presentations were edge-focused, Qualcomm is actively competing for GPU cluster inference slots at telcos and enterprises.

---

### 20. Synopsys
- **Speaker:** Stelios Diamantidis
- **Conference:** Hot Chips 2024 (Tutorial)
- **Talk:** "AI Driven Optimization" for chip design
- **GPU Operations Signal:** Synopsys EDA tools power the design workflow for GPU chips (NVIDIA, AMD, Intel custom silicon). Their AI-for-chip-design work accelerates the development of next-generation GPU architectures — directly relevant to the GPU supply pipeline.

---

### 21. PrimisAI
- **Speaker:** Hans Bouwmeester
- **Conference:** Hot Chips 2024 (Tutorial)
- **Talk:** "LLM and Chip Design"
- **GPU Operations Signal:** Startup using LLMs to accelerate hardware design — emerging player in the AI-for-GPU-design ecosystem. Customers include chip teams designing next-gen GPU clusters.

---

### 22. Frore Systems
- **Speaker:** Prabhu Sathyamurthy
- **Conference:** Hot Chips 2024 (Tutorial)
- **Talk:** "Solid-state active cooling helps maintain Moore's Law"
- **GPU Operations Signal:** Solid-state cooling technology directly relevant for high-density GPU deployments where liquid cooling isn't viable. GPU cluster operators are their target customers.

---

## NVIDIA GTC 2024 (March 18–21, 2024 — San Jose, CA)

---

### 23. Google / Google Cloud
- **Speaker:** Dan Lenoski, VP Networking at Google
- **Conference:** NVIDIA GTC 2024
- **Talk:** "Wired for AI: Lessons from Networking 100K+ GPU AI Data Centers and Clouds"
- **GPU Operations Signal:** Google is operating GPU clusters of 100,000+ GPUs in production. Lenoski's talk reveals hard-won lessons in networking at that scale — topology, congestion control, fault recovery. This is the most explicit public disclosure of Google's GPU cluster scale.

- **Speaker:** Andi Gavrilescu (Sr. Engineering Manager) & Matthew Johnson (Research Scientist)
- **Conference:** NVIDIA GTC 2024
- **Talk:** "Horizontal Scaling of LLM Training with JAX"
- **GPU Operations Signal:** Google is scaling LLM training horizontally across massive GPU/TPU fleets via JAX's compilation and distributed execution model — revealing their core distributed training stack.

---

### 24. Amazon Web Services (AWS)
- **Speaker:** Chetan Kapoor, Director of Product Management, Amazon EC2
- **Conference:** NVIDIA GTC 2024
- **Talk:** AWS EC2 UltraClusters hyper-scale clustering + Project Ceiba AI Supercomputer
- **GPU Operations Signal:** AWS announced Project Ceiba — 20,736 NVIDIA GB200 Grace Blackwell Superchips built as a dedicated AI supercomputer on AWS with NVIDIA DGX Cloud. Demonstrates AWS committing to GPU supercomputing at national-lab scale for enterprise AI.

---

### 25. Meta (GTC 2024)
- **Speaker:** Joelle Pineau, VP of AI Research
- **Conference:** NVIDIA GTC 2024
- **Talk:** AI Research at Meta — scale, infrastructure, and open source
- **GPU Operations Signal:** Meta's senior AI leadership presenting at GTC confirms continued deep NVIDIA partnership for training infrastructure (Llama, etc.) even as they build custom silicon (MTIA) for inference.

---

### 26. Microsoft (GTC 2024)
- **Speaker:** Sébastien Bubeck, VP of GenAI at Microsoft
- **Conference:** NVIDIA GTC 2024
- **Talk:** "Building practical AI agents that reason and code at scale"
- **GPU Operations Signal:** Microsoft deploying agentic AI workloads across Azure GPU infrastructure — Bubeck's talk implies massive ongoing GPU cluster provisioning for multi-step reasoning tasks that are far more GPU-intensive than single-shot inference.

---

## GTC 2025 (March 17–21, 2025 — San Jose, CA)
*(25,000 in-person attendees, 300,000 virtual, 1,000+ sessions, 2,000 speakers)*

---

### 27. CoreWeave
- **Speaker:** CoreWeave team (session presented by CoreWeave)
- **Conference:** GTC 2025
- **Talk:** "Jane Street: How an Early AI Adopter Thinks About Infrastructure" (Presented by CoreWeave)
- **GPU Operations Signal:** CoreWeave, the largest dedicated NVIDIA GPU cloud provider outside the hyperscalers, presented with Jane Street as a case study. Reveals CoreWeave's position as the go-to GPU infrastructure provider for quant finance and AI-first companies requiring bare-metal GPU cluster access at scale.

---

### 28. Salesforce
- **Speaker:** Salesforce engineering leadership
- **Conference:** GTC 2025
- **Talk:** Agentforce 360 Platform powered by Vertex AI training clusters on NVIDIA GB200 NVL72
- **GPU Operations Signal:** Salesforce leveraged NVIDIA GB200 NVL72 GPU clusters for Agentforce training. Reveals Salesforce running production AI training workloads on the latest GPU generation — through Google Cloud's GB200 infrastructure.

---

### 29. Orange / Fastweb / Swisscom / Telefónica / Telenor (European Telco Consortium)
- **Conference:** GTC 2025
- **Talk:** European AI Infrastructure with NVIDIA DGX SuperPODs
- **GPU Operations Signal:** Five major European telcos announced rollout of NVIDIA DGX SuperPODs (highest-density Blackwell GPU clusters), delivering more than 3,000 exaflops of NVIDIA Blackwell compute across Europe. This reveals European telecoms are becoming GPU cloud providers at national scale.

---

### 30. Jane Street
- **Speaker:** Jane Street infrastructure team
- **Conference:** GTC 2025 (CoreWeave-presented session)
- **Talk:** "How an Early AI Adopter Thinks About Infrastructure"
- **GPU Operations Signal:** Jane Street (top quantitative trading firm) is an early and major GPU infrastructure consumer. Their talk reveals how sophisticated financial firms think about GPU cluster procurement, reliability, and workload characteristics for trading-adjacent AI.

---

### 31. Capital One
- **Speaker:** Capital One data/AI leadership
- **Conference:** GTC 2025
- **Talk:** AI infrastructure and GPU-accelerated ML at a major financial institution
- **GPU Operations Signal:** Capital One publicly presented their GPU infrastructure strategy at GTC 2025 — revealing they are deploying GPU clusters for financial services AI at scale. [Source: capitalone.com/tech/ai/sessions-and-speakers-at-nvidia-gtc-2025]

---

### 32. Eli Lilly (Pharmaceutical / Life Sciences)
- **Conference:** GTC 2025
- **Talk:** AI-powered drug discovery — "NVIDIA-powered AI factory advancing science at 9 quintillion calculations per second"
- **GPU Operations Signal:** Lilly is operating a massive GPU cluster for computational biology and drug discovery — 9 quintillion FLOPS implies a very large NVIDIA GPU deployment in a non-tech sector, signaling pharma as an emerging GPU cluster customer.

---

### 33. T-Mobile (with MITRE, Cisco, Booz Allen Hamilton)
- **Conference:** GTC 2025
- **Talk:** AI-native wireless network infrastructure and 6G R&D; NVIDIA Ariel platform deployment
- **GPU Operations Signal:** T-Mobile is deploying NVIDIA GPU-accelerated AI for RAN (Radio Access Network) operations and 6G research. Reveals telcos are now running GPU clusters inside their network infrastructure, not just for data center AI.

---

## SC24 — SUPERCOMPUTING 2024 (November 2024 — Atlanta, GA)

---

### 34. Meta AI (SC24)
- **Speaker:** Pavan Balaji, Principal Research Scientist, Meta AI
- **Conference:** SC24 (Invited Talk)
- **Talk:** "Network and Communication Infrastructure Powering Meta's GenAI and Recommendation Systems"
- **GPU Operations Signal:** Balaji built Meta's Grand Teton GPU supercomputing architecture — the system training Llama models. His SC24 invited talk is the most detailed public disclosure of Meta's GPU cluster networking and communication library stack. Grand Teton uses custom GPU server hardware, InfiniBand-scale networking, and Meta-developed collective communication libraries.

---

### 35. DeepSeek / High-Flyer Capital Management
- **Speaker:** DeepSeek research team
- **Conference:** SC24 (Technical Paper)
- **Talk:** "Fire-Flyer AI-HPC: A Cost-Effective Software-Hardware Co-Design for Deep Learning"
- **GPU Operations Signal:** High-Flyer (DeepSeek's parent quant fund) built Fire-Flyer 2 — a 10,000 A100 GPU HPC cluster with custom software-hardware co-design. The paper reveals their approach to cost-efficient GPU cluster operation, foreshadowing DeepSeek's breakthrough training efficiency that shocked the industry in early 2025.

---

### 36. Indiana University + Meta (Joint SC24 Paper)
- **Speaker:** Research team (Indiana U, Meta, U of Rochester, Chinese Academy of Sciences)
- **Conference:** SC24 (Technical Paper)
- **Talk:** "Accelerating Communication in Deep Learning Recommendation Model Training with Dual-Level Adaptive Lossy Compression"
- **GPU Operations Signal:** Meta-co-authored research on accelerating DLRM (recommendation model) training on GPU clusters via compressed all-to-all communication. Directly reveals Meta's GPU cluster communication bottlenecks for recommendation systems at scale.

---

### 37. University of Maryland / AxoNN Team (NSF/DOE)
- **Speaker:** Siddharth Singh et al.
- **Conference:** SC24 (Gordon Bell Prize Finalist)
- **Talk:** "Democratizing AI: Open-Source Scalable LLM Training on GPU-Based Supercomputers"
- **GPU Operations Signal:** AxoNN framework evaluated on Alps (CSCS), Frontier (ORNL), and Perlmutter (NERSC) GPU supercomputers — training 640 billion parameter GPT-style models. Reveals which public GPU supercomputers support frontier LLM training and their scaling characteristics.

---

### 38. ETH Zürich / CSCS (Swiss National Supercomputing Centre)
- **Speaker:** Research team (Sapienza University, ETH Zürich, NVIDIA joint)
- **Conference:** SC24 (Technical Paper)
- **Talk:** "Exploring GPU-to-GPU Communication: Insights into Supercomputer Interconnects"
- **GPU Operations Signal:** CSCS Alps (built on NVIDIA GH200 Grace Hopper Superchips) is one of Europe's most powerful GPU clusters. This paper characterizes real-world GPU interconnect performance in production supercomputers — crucial benchmarking data for GPU cluster designers.

---

### 39. Barcelona Supercomputing Center (BSC-CNS)
- **Speaker:** Alba Cervera-Lierta
- **Conference:** SC24 (Invited Talk)
- **Talk:** Quantum-HPC convergence at European scale
- **GPU Operations Signal:** BSC operates MareNostrum — Europe's flagship HPC cluster. Their GPU-accelerated quantum simulation work reveals European sovereign GPU computing strategy.

---

### 40. European Centre for Medium-Range Weather Forecasts (ECMWF)
- **Speaker:** Peter Dueben
- **Conference:** SC24 (Invited Talk)
- **Talk:** AI/ML for numerical weather prediction on GPU supercomputers
- **GPU Operations Signal:** ECMWF is deploying GPU-accelerated ML models in production weather forecasting — representing a non-tech-sector GPU cluster operator at institutional scale. Their operational GPU infrastructure requirements are significant and growing.

---

### 41. Jülich Supercomputing Centre / SiPEARL
- **Speaker:** Estela Suarez
- **Conference:** SC24 (Invited Talk)
- **Talk:** European HPC/AI infrastructure sovereignty and next-generation GPU system design
- **GPU Operations Signal:** Jülich operates JUWELS Booster (A100 GPU cluster) and is building next-gen exascale GPU-accelerated systems. Suarez's SiPEARL role signals European effort to build sovereign GPU-class processors.

---

### 48. Microsoft Azure HPC (SC24)
- **Speaker:** Glenn K. Lockwood, Principal Engineer, Microsoft Azure HPC
- **Conference:** SC24 (Tutorials, BoF sessions, booth announcement)
- **Talk:** Tutorial: "Delivering HPC: Procurement, Cost Models, Metrics, Value and More"; also BoF: "The Future of Benchmarks in Supercomputing"
- **Special Announcement:** "A major leap forward in high-performance computing" at Azure booth #1905 on November 19, 2024
- **GPU Operations Signal:** Lockwood is responsible for supporting Microsoft's *largest AI supercomputers* through workload-driven systems design. His SC24 presence and expertise in "scalable architectures, performance modeling, and I/O" directly reveals how Azure approaches GPU supercomputer procurement and operations at scale. The booth announcement signals a major Azure HPC GPU cluster expansion.

---

## MLSys 2024 (May 13–16, 2024 — Santa Clara, CA)

---

### 42. Google DeepMind / Google Research
- **Speaker:** Jeff Dean, Chief Scientist for Google Research and Google DeepMind
- **Conference:** MLSys 2024 (Keynote)
- **Talk:** "Exciting Directions in Systems for Machine Learning"
- **GPU Operations Signal:** Jeff Dean co-leads the Gemini project and has personally driven Google's ML accelerator strategy (TPUs, distributed training). His MLSys keynote signals Google's ongoing investment in GPU/TPU system co-design for frontier model training.

- **Co-authors (MLSys 2024 paper):** Yale + Google researchers
- **Paper:** "Prompt Cache: Modular Attention Reuse for Low-Latency Inference"
- **GPU Operations Signal:** Google co-authored research on reducing GPU memory and compute needed for LLM inference — directly optimizing their GPU cluster inference efficiency.

---

### 43. Meta AI (MLSys 2024)
- **Speaker/Authors:** Maxim Naumov, Liang Luo, Jongsoo Park et al., Meta AI
- **Conference:** MLSys 2024
- **Paper:** "Disaggregated Multi-Tower: Topology-aware Modeling Technique for Efficient Large Scale Recommendation"
- **GPU Operations Signal:** Meta's recommendation system research directly shapes their GPU cluster topology and deployment. This paper reveals Meta is redesigning GPU cluster topology to match the multi-tower architecture of their largest recommendation models.

---

### 44. Amazon Web Services (MLSys 2024)
- **Authors:** HKU + AWS + Boson AI team
- **Conference:** MLSys 2024
- **Papers:** "Lancet: Accelerating Mixture-of-Experts Training via Whole Graph Computation-Communication Overlapping" + "DiffusionPipe: Training Large Diffusion Models with Efficient Pipelines"
- **GPU Operations Signal:** AWS engineers co-authored two papers on GPU training efficiency for MoE models and diffusion models — revealing AWS is actively optimizing GPU cluster utilization for their AI training services (SageMaker, etc.).

---

### 45. Microsoft Research India
- **Authors:** GaTech + MSR India team
- **Conference:** MLSys 2024
- **Paper:** "Vidur: A Large-scale Simulation Framework for LLM Inference"
- **GPU Operations Signal:** Microsoft Research built Vidur to simulate large-scale GPU cluster inference deployments before provisioning actual hardware — revealing they operate LLM inference at sufficient scale that simulation-based capacity planning is necessary.

---

### 46. AMD (MLSys 2024)
- **Authors:** AMD team
- **Conference:** MLSys 2024
- **Paper:** "JIT-Q: Just-in-time Quantization with Processing-In-Memory for Efficient ML Training"
- **GPU Operations Signal:** AMD published research on quantization techniques for GPU training efficiency — directly relevant to their Instinct MI300X positioning and customer deployments.

---

### 47. Alibaba Cloud (MLSys 2024)
- **Authors:** Alibaba Cloud + UMich + UCLA + UC Merced
- **Conference:** MLSys 2024
- **Paper:** "CloudEval-YAML: A Practical Benchmark for Cloud Native YAML Configuration Generation"; also "UniDM: A Unified Framework for Data Manipulation with Large Language Models" (Alibaba + USTC)
- **GPU Operations Signal:** Alibaba Cloud is developing GPU-accelerated LLM infrastructure and operational tooling for cloud-native AI deployments — revealing their GPU cluster orchestration challenges at Alibaba scale.

---

## Summary Table

| # | Company | Conference | Speaker/Authors | Talk Topic | GPU Ops Signal |
|---|---------|------------|----------------|------------|----------------|
| 1 | OpenAI | Hot Chips 2024 | Trevor Cai | Predictable Scaling and Infrastructure | Petaflop GPU training cluster operations |
| 2 | NVIDIA | Hot Chips 2024 | Tirumala/Wong | Blackwell Platform GB200 NVL72 | 72-GPU rack-scale reference architecture |
| 3 | AMD | Hot Chips 2024 | Smith/Alla/Peng | MI300X + AI Keynote | Competing for hyperscaler GPU cluster slots |
| 4 | Intel | Hot Chips 2024 | Roman Kaplan | Gaudi 3 Training+Inference | Cost-alternative to NVIDIA in GPU clusters |
| 5 | Microsoft | Hot Chips 2024 / GTC 2024 | Xu/Ramakrishnan/Bubeck | MAIA 100 / Agentic AI at scale | Custom Azure AI silicon + massive GPU fleet |
| 6 | Meta | Hot Chips 2024 / SC24 / GTC 2024 / MLSys 2024 | Maddury/Balaji/Pineau/Naumov | MTIA / Grand Teton / Rec models | Custom inference chips + largest GPU training clusters |
| 7 | Tesla | Hot Chips 2024 | Eric Quinnell | Dojo TTPoE Exascale Network | Proprietary exascale AI training cluster |
| 8 | Cerebras | Hot Chips 2024 | Sean Lie | Wafer-Scale AI | GPU cluster alternative for LLM training |
| 9 | SambaNova | Hot Chips 2024 | Raghu Prabhakar | SN40L RDU | Trillion-param AI computing vs GPU clusters |
| 10 | Broadcom | Hot Chips 2024 | Manish Mehta | AI ASIC with Optical Attach | Powers hyperscaler custom silicon programs |
| 11 | Enfabrica | Hot Chips 2024 | Mukherjee/Norrie | 8-Tbit/s SuperNIC | GPU cluster networking silicon |
| 12 | FuriosaAI | Hot Chips 2024 | June Paik | RNGD Processor | Server-class AI inference accelerator |
| 13 | Tenstorrent | Hot Chips 2024 | Vasiljevic/Capalija | Blackhole & TT-Metalium | Standalone AI computer vs GPU cluster |
| 14 | Ampere Computing | Hot Chips 2024 | Matthew Erler | AmpereOne CPU | GPU cluster host CPU (deployed at OCI) |
| 15 | Preferred Networks | Hot Chips 2024 | Jun Makino | MN-Core 2 | Japanese sovereign AI HPC silicon |
| 16 | IBM | Hot Chips 2024 / SC24 | Berry/Gambetta | Telum II+Spyre / Quantum | Enterprise AI silicon + quantum-HPC |
| 17 | SK Hynix | Hot Chips 2024 | Guhyun Kim | AiM/AiMX In-Memory Compute | HBM supplier → system-level AI compute |
| 18 | Supermicro | Hot Chips 2024 | Tom Garvens | GPU datacenter thermal | Major GPU server OEM at cluster densities |
| 19 | Qualcomm | Hot Chips 2024 | Williams/Nikfar | CPU + Edge thermal | Cloud AI 100 inference deployments |
| 20 | Synopsys | Hot Chips 2024 | Diamantidis | AI chip design optimization | EDA toolchain for GPU chip design |
| 21 | PrimisAI | Hot Chips 2024 | Bouwmeester | LLM for chip design | AI-accelerated GPU hardware development |
| 22 | Frore Systems | Hot Chips 2024 | Sathyamurthy | Solid-state cooling | Thermal management for dense GPU clusters |
| 23 | Google/GCP | GTC 2024 | Lenoski/Gavrilescu | 100K+ GPU networking / JAX LLM | Operates 100K+ GPU AI data centers |
| 24 | AWS | GTC 2024 | Chetan Kapoor | Project Ceiba / EC2 UltraClusters | 20,736-GPU GB200 AI supercomputer |
| 25 | CoreWeave | GTC 2025 | CoreWeave team | GPU cloud infrastructure (Jane Street case) | Largest dedicated NVIDIA GPU cloud |
| 26 | Salesforce | GTC 2025 | Salesforce engineering | Agentforce on GB200 NVL72 clusters | Running LLM training on latest GPU generation |
| 27 | Orange/Telefónica/Swisscom/Fastweb/Telenor | GTC 2025 | Telco leadership | European AI with DGX SuperPODs | 3,000+ exaflops of Blackwell across Europe |
| 28 | Jane Street | GTC 2025 | Infrastructure team | Early AI adopter GPU infrastructure | Quant finance GPU cluster operator |
| 29 | Capital One | GTC 2025 | AI/Data leadership | GPU-accelerated ML in financial services | Bank-scale GPU cluster deployment |
| 30 | Eli Lilly | GTC 2025 | AI leadership | Drug discovery GPU AI factory | 9 quintillion FLOPS pharma GPU cluster |
| 31 | T-Mobile | GTC 2025 | Infrastructure team | AI-native wireless / NVIDIA Ariel | GPU clusters inside telco RAN infrastructure |
| 32 | DeepSeek/High-Flyer | SC24 | Research team | Fire-Flyer AI-HPC cost-effective co-design | 10,000-A100 GPU cluster, efficient training |
| 33 | Indiana U / Meta (joint) | SC24 | Research team | DLRM GPU training communication | Meta GPU cluster comms at recommendation scale |
| 34 | Univ. of Maryland | SC24 (Gordon Bell) | Siddharth Singh | AxoNN LLM on GPU supercomputers | 640B param training on Frontier/Alps/Perlmutter |
| 35 | ETH Zürich / CSCS | SC24 | Research team | GPU-to-GPU Communication in supercomputers | NVIDIA GH200-based Alps cluster characterization |
| 36 | Barcelona SC (BSC) | SC24 | Cervera-Lierta | Quantum-HPC convergence | European sovereign GPU HPC leadership |
| 37 | ECMWF | SC24 | Peter Dueben | AI/ML on HPC for weather | GPU cluster deployment in operational science |
| 38 | Jülich SC / SiPEARL | SC24 | Estela Suarez | European HPC/AI infrastructure | European sovereign GPU system design |
| 39 | Google DeepMind | MLSys 2024 | Jeff Dean | ML systems directions (keynote) | Co-leads Gemini; drives GPU/TPU co-design strategy |
| 40 | AWS | MLSys 2024 | HKU+AWS team | MoE training efficiency / DiffusionPipe | SageMaker GPU cluster training optimization |
| 41 | Microsoft Research | MLSys 2024 | GaTech+MSR team | Vidur LLM inference simulation | GPU capacity planning at inference scale |
| 42 | Alibaba Cloud | MLSys 2024 | Alibaba+USTC team | Cloud-native LLM tooling | GPU cluster orchestration for Alibaba scale |
| 43 | Microsoft Azure HPC | SC24 | Glenn Lockwood | HPC procurement, AI supercomputer benchmarking | Responsible for Microsoft's largest AI supercomputers |

---

## Key Themes Observed

1. **Hyperscaler GPU arms race**: AWS (Project Ceiba, 20,736 GPUs), Google (100K+ GPU clusters), Microsoft (MAIA 100 + Azure GPU), Meta (Grand Teton + MTIA) all presenting major GPU infrastructure at multiple conferences simultaneously.

2. **Custom silicon to complement GPUs**: Microsoft MAIA, Meta MTIA, Tesla Dojo, Broadcom ASICs, Google TPUs — all reveal companies building custom chips to reduce NVIDIA GPU dependency and optimize specific workloads (inference, recommendation, networking).

3. **Networking is the new GPU bottleneck**: Multiple talks (Google 100K GPU networking, Tesla TTPoE, Enfabrica SuperNIC, ETH Zürich GPU comms) signal that interconnect is now the primary scaling constraint — companies are building exascale networks around GPU clusters.

4. **GPU alternatives gaining traction**: SambaNova, Cerebras, Tenstorrent, FuriosaAI, Intel Gaudi all pitching GPU-cluster replacements — enterprises are actively evaluating alternatives, with Hot Chips as the primary arena for these competitive pitches.

5. **European and Asian GPU sovereignty**: BSC, ECMWF, Jülich, Preferred Networks, SK Hynix, FuriosaAI — non-US entities building sovereign GPU/AI compute infrastructure. European telcos (Orange, Telefónica, Swisscom, etc.) now deploying DGX SuperPODs nationally.

6. **Non-tech sectors operating GPU clusters**: Eli Lilly (pharma), Jane Street (finance), Capital One (banking), T-Mobile (telco), ECMWF (weather) — GPU clusters have diffused well beyond tech companies into regulated industries.

7. **Thermal/cooling as scaling constraint**: Supermicro, NVIDIA, Qualcomm, Frore all presenting on cooling — GPUs are pushing thermal limits at 40–100kW/rack cluster densities.

8. **Cost efficiency as differentiator**: DeepSeek's Fire-Flyer paper and multiple MLSys 2024 papers (AWQ quantization, Lancet, Vidur) reveal that GPU cluster operators are obsessively optimizing for cost-per-token — signaling that raw GPU procurement is only part of the operational equation.

---

*Sources: hc2024.hotchips.org (full program), sc24.supercomputing.org, nvidia.com/gtc, mlsys.org/Conferences/2024, proceedings.mlsys.org, aws.amazon.com/blogs, cloud.google.com/blog, siliconangle.com, hpcwire.com, capitalone.com/tech, servethehome.com, nvidia.com/en-us/on-demand*

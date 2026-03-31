# GitHub Organizations: Large Kubernetes GPU Clusters
*Research compiled: 2026-03-29*

This document maps GitHub organizations with significant GPU cluster infrastructure. Focus is on orgs operating at scale (100s–100,000s of GPUs), particularly those using Kubernetes, Slurm, or hybrid orchestration.

---

## Tier 1: GPU Cloud Providers (Large-Scale Operators)

### 1. `coreweave` — CoreWeave
- **GitHub:** https://github.com/coreweave (116 repos)
- **Real Company:** CoreWeave, Inc. (Roseland, NJ → NYC HQ)
- **GPU Scale:** ~250,000 GPUs across 32 data centers; 8,192 H100 GPU cluster demonstrated on Graph500; IPO'd March 2025, market cap $60B+
- **Infra Signals from Repos:**
  - `kubernetes-cloud` — Getting started with CoreWeave Kubernetes GPU Cloud (primary platform: Kubernetes-native bare metal)
  - `nccl-tests` — NVIDIA NCCL distributed training tests (actively maintained, 139 stars)
  - `tensorizer` — Model/tensor serialization for GPU inference (297 stars)
  - `cwic` — CoreWeave Intelligent CLI; includes SUNK (Slurm on Kubernetes) management
  - `slurm-containers` — Dockerfiles for Slurm workloads
  - `ml-containers` — ML-optimized container images (actively updated Mar 2026)
  - `kfserving` — KFServing fork with GPU autoscaling and scale-to-zero
  - `terraform-provider-coreweave` — Official Terraform provider
  - Forks of NVIDIA device plugin, Kubernetes autoscaler
- **Personnel:**
  - **Michael Intrator** — CEO & Co-founder (ex-energy hedge fund PM)
  - **Brian Venturo** — Co-founder & Chief Strategy Officer
  - **Brannin McBee** — Co-founder & Chief Development Officer
  - **Peter Salanki** — Co-founder & CTO
- **Notes:** Primarily Kubernetes-native. Offers SUNK (Slurm on K8s) via cwic CLI. NVIDIA's largest external cloud partner. $15B Stargate JV buildout ongoing.

---

### 2. `nebius` — Nebius AI Cloud
- **GitHub:** https://github.com/nebius (~20 public repos)
- **Real Company:** Nebius Group N.V. (Amsterdam; formerly Yandex international assets)
- **GPU Scale:** $3B data center deal with Meta (2025); targeting 2.5GW capacity by end of 2026; sold out capacity as of late 2025
- **Infra Signals from Repos:**
  - `soperator` — **World's first fully featured open-source Kubernetes operator for Slurm** (371 stars, Apache 2.0, actively maintained)
  - `slurm-deb-packages` — Builds Slurm & NCCL packages for Kubernetes environments
  - `nebius-solutions-library` — Terraform/Helm recipes for GPU cluster deployment (87 stars)
  - `nebius-k8s-applications` — Kubernetes app configs and Helm charts
  - `kvax` — FlashAttention for JAX with context parallelism (161 stars)
  - `ml-cookbook` — ML training recipes and infrastructure guides
  - `nebius-ps-services` — Parameter server services (AI training)
  - `soperator-terraform` — Terraform for Soperator deployment
- **Personnel:**
  - **Arkady Volozh** — Founder & CEO (co-founded Yandex 1997; returned as Nebius CEO 2024)
  - **Mikhail Mokrushin** — Managed Schedulers Team Leader (key Soperator author)
  - ~1,300 retained Yandex engineers; 850+ in AI/ML and cloud
- **Notes:** Yandex spinoff retaining international cloud & AI assets. Deepest open-source commitment in the Slurm-on-K8s space. Soperator is a major differentiator.

---

### 3. `crusoecloud` — Crusoe Cloud
- **GitHub:** https://github.com/crusoecloud (36 repos)
- **Real Company:** Crusoe Energy Systems / Crusoe Cloud (Denver, CO; founded 2018)
- **GPU Scale:** A100, H100, L40 fleet; ~13,000 AMD MI355X GPUs incoming (2025); Abilene/Stargate buildout targeting multi-hundred MW / $15B JV
- **Infra Signals from Repos:**
  - `slurm` — Slurm solution for Crusoe Cloud (Jinja templates, 14 stars)
  - `crusoe-hpc-slurm` — SLURM HPC Cluster Deployment with NVIDIA enroot/pyxis + elastic autoscaler (8 stars)
  - `crusoe-ml-rke2` — RKE2 (Kubernetes) cluster deployment with NVIDIA GPU/network driver installation
  - `terraform-provider-crusoe` — Official Terraform provider (26 stars)
  - `k8s-autoscaler` — Kubernetes autoscaler fork for Crusoe
  - `crusoe-csi-driver` — Storage driver (Kubernetes PVs)
  - `crusoe-watch-agent` / `crusoe-telemetry-agent` — vector.dev-based GPU telemetry
  - `solutions-library` — Deployment solutions (Slurm, K8s, ML)
- **Personnel:**
  - **Chase Lochmiller** — CEO & Co-founder (ex-GETCO, Jump Trading quant; Stanford CS/AI MS; MIT Math+Physics BS)
  - **Cully Cavness** — President & COO (Oxford MBA; oil & gas background)
- **Notes:** "Carbon negative" AI compute (stranded gas & renewables). Offers both Crusoe Managed Kubernetes (CMK) + Slurm. NVIDIA Run:ai and Project-HAMi integrations documented. $600M Series D (Dec 2024); $1.375B Series E (Oct 2025).

---

### 4. `togethercomputer` — Together AI
- **GitHub:** https://github.com/togethercomputer (89 repos)
- **Real Company:** Together AI, Inc. (San Francisco, CA)
- **GPU Scale:** Self-service H100/H200/B200/GB200 cluster platform; 36,000 GB200 NVL72 GPU cluster (co-build with Hypertec, announced Nov 2024)
- **Infra Signals from Repos:**
  - `slurm-operator` — Framework for running Slurm in Kubernetes (own implementation)
  - `flash-attention-3` — FlashAttention implementation (GPU kernel optimization at scale)
  - `RedPajama-Data` — Large-scale dataset preparation (evidence of large training runs)
  - `OpenChatKit` — Open source LLM training framework
  - `MoA` — Mixture-of-Agents (65.1% AlpacaEval)
  - `torchtitan` fork — Distributed training at scale
- **Personnel:** Team includes Tri Dao (FlashAttention author), Ce Zhang (co-founder/CTO from ETH Zurich), Percy Liang (co-founder)
- **Notes:** Instant GPU cluster provisioning product launched Feb 2025. Operate their own GPU fleet + offer cluster access. Own slurm-operator implementation suggests in-house HPC orchestration.

---

## Tier 2: Platform / Orchestration Tools (Operate or Enable Large GPU Clusters)

### 5. `SlinkyProject` — SchedMD (now NVIDIA)
- **GitHub:** https://github.com/SlinkyProject (7 repos)
- **Real Company:** SchedMD LLC (Lehi, UT) — **acquired by NVIDIA December 2025**
- **GPU Scale:** N/A (tooling vendor); used by 100s of HPC/AI orgs worldwide running Slurm clusters
- **Infra Signals from Repos:**
  - `slurm-operator` — Run Slurm on Kubernetes (260 stars, 65 forks)
  - `slurm-bridge` — Run Slurm as a Kubernetes scheduler (71 stars)
  - `slurm-client` — OpenAPI Go client for Slurm REST API (26 stars)
  - `slurm-exporter` — Prometheus metrics for Slurm clusters
  - `containers` — OCI container images for Slurm (Dockerfile)
- **Personnel:**
  - **Morris "Moe" Jette** — Founder & CTO (original Slurm author, LLNL)
  - **Danny Auble** — Co-founder & President
  - **Tim Wickberg**, **Skyler Malinowski**, **Alan Mutschelknaus**, **Marlow Warnicke** — Slinky contributors (SchedMD engineers; presented at SC24, SLUG24, KubeCon)
- **Notes:** Slurm is the dominant HPC job scheduler (~60% of Top500 supercomputers). NVIDIA acquisition gives NVIDIA end-to-end control of GPU orchestration stack (GPU hardware → drivers → CUDA → NCCL → Slurm). Slinky bridges Slurm ↔ Kubernetes, enabling HPC and cloud-native workloads on the same hardware.

---

### 6. `determined-ai` — Determined AI (HPE)
- **GitHub:** https://github.com/determined-ai (146 followers)
- **Real Company:** Determined AI (acquired by HPE ~2021); contact: ai-open-source@hpe.com
- **GPU Scale:** Enterprise ML platform used by large orgs for distributed GPU training
- **Infra Signals from Repos:**
  - `determined` — Open-source ML platform: distributed training, hyperparameter tuning, experiment tracking, GPU resource management on Kubernetes/Slurm (3.2k stars, 371 forks)
  - `devcluster` — Developer tool for running Determined cluster
- **Personnel:** Originally founded by Evan Mahoney, Neil Conway, et al. (Berkeley/CMU alumni). Now under HPE AI division.
- **Notes:** Supports both Kubernetes and Slurm backends. Used in enterprise environments with large GPU fleets. HPE sells this as HPE Machine Learning Development Environment (MLDE).

---

### 7. `leptonai` — Lepton AI
- **GitHub:** https://github.com/leptonai (~15 repos)
- **Real Company:** Lepton AI, Inc. (San Jose, CA; founded 2023)
- **GPU Scale:** Managed GPU cloud; GPU monitoring across large fleets
- **Infra Signals from Repos:**
  - `gpud` — **GPU daemon** — automates monitoring, diagnostics, and issue identification for GPUs (480 stars, Apache 2.0); Go-based, designed for fleet-scale GPU health management
  - `leptonai` — Pythonic AI service framework (2.8k stars)
  - `search_with_lepton` — Demo app (8.1k stars)
- **Personnel:**
  - **Yangqing Jia** — Co-founder & CEO (original creator of Caffe; ex-Facebook AI Research)
  - **Jiajing Xu** — Co-founder
- **Notes:** `gpud` is particularly notable — fleet-scale GPU health monitoring daemon, suggests operating 100s+ of GPUs. Kubernetes-based infrastructure.

---

### 8. `gpustack` — GPUStack
- **GitHub:** https://github.com/gpustack (~5 repos)
- **Real Company:** Seal Inc. (China-based; open-source GPU cluster management product)
- **GPU Scale:** Manages inference fleets; configures vLLM/SGLang across GPU clusters
- **Infra Signals from Repos:**
  - `gpustack` — GPU cluster manager for inference: configures/orchestrates vLLM and SGLang across GPU nodes (4.7k stars, 488 forks — **highest star count in this category**)
  - `gguf-parser-go` — GGUF model memory estimation (253 stars)
  - `runtime` — Unified GPU detection and workload management
  - `vox-box` — TTS/STT server (OpenAI API-compatible)
- **Personnel:** Primarily China-based team; org not publicly attributed to specific founders
- **Notes:** Strong community traction (4.7k stars). Kubernetes-native inference orchestration. Broad GPU support (NVIDIA, AMD, Apple Silicon).

---

### 9. `skypilot-org` — SkyPilot
- **GitHub:** https://github.com/skypilot-org (primarily the `skypilot` repo)
- **Real Company:** SkyPilot (UC Berkeley spinout → Skypilot Inc.)
- **GPU Scale:** Abstracts access to 20+ clouds, Kubernetes clusters, Slurm clusters; used by orgs with large multi-cloud GPU fleets
- **Infra Signals from Repos:**
  - `skypilot` — "Run, manage, and scale AI workloads on any AI infrastructure. Use one system to access & manage all AI compute (Kubernetes, Slurm, 20+ clouds, on-prem)" — actively maintained as of Mar 2026
- **Personnel:** Zongheng Yang (founder), Zhanghao Wu, Romil Bhardwaj, Shishir Patil (Berkeley Sky Computing Lab)
- **Notes:** Widely used at companies that need to manage GPU jobs across multiple clouds or clusters. Usage implies significant GPU fleet management at adopter orgs.

---

## Tier 3: Research/Enterprise Users with Notable GPU Infrastructure Repos

### 10. `microsoft` — Microsoft (OpenPAI)
- **GitHub:** https://github.com/microsoft/pai
- **Real Company:** Microsoft Corporation
- **GPU Scale:** Internal MSRA + Azure GPU fleets; OpenPAI was deployed at scale internally
- **Infra Signals from Repos:**
  - `pai` (OpenPAI) — "Resource scheduling and cluster management for AI"; GPU/FPGA farm sharing for teams; Kubernetes-compatible; supports virtual clusters (now in stable/read-only mode since Dec 2021)
- **Notes:** OpenPAI was Microsoft Research Asia's internal GPU cluster OS. Superseded by Azure ML and internal tooling. Evidence of early large-scale GPU cluster orchestration work.

---

### 11. `PaddlePaddle` — Baidu
- **GitHub:** https://github.com/PaddlePaddle
- **Real Company:** Baidu, Inc. (Beijing, China)
- **GPU Scale:** Training runs at 1,000s of GPUs (Baidu's own clusters); Paddle framework supports large-scale distributed GPU training
- **Infra Signals from Repos:**
  - `Paddle` — Deep learning framework with multi-GPU/distributed training ("high-performance single-machine, distributed training and cross-platform deployment")
  - `PaddleNLP` — LLM library with distributed training at scale
- **Notes:** Evidence of massive internal GPU infrastructure via scale of distributed training tooling.

---

### 12. `intelligent-machine-learning` — Ant Group (DLRover)
- **GitHub:** https://github.com/intelligent-machine-learning
- **Real Company:** Ant Group / Alibaba (China)
- **GPU Scale:** Production GPU clusters at Alibaba/Ant scale (1000s of GPUs)
- **Infra Signals from Repos:**
  - `dlrover` — "DLRover: An Automatic Distributed Deep Learning System" — auto-scales training jobs, fault tolerance, elastic training on Kubernetes/Ray (actively maintained Mar 2026)
- **Notes:** Handles distributed GPU training at Alibaba/Ant Group scale. Kubernetes-native. Addresses real-world problems at hyperscale (job fault recovery, elastic GPU allocation).

---

### 13. `alibaba` — Alibaba
- **GitHub:** https://github.com/alibaba
- **Real Company:** Alibaba Group
- **GPU Scale:** One of the largest GPU training clusters in Asia
- **Infra Signals from Repos:**
  - `Megatron-LLaMA` — "Best practice for training LLaMA models in Megatron-LM" — multi-GPU, multi-node distributed training guide
- **Notes:** Alibaba Cloud (Aliyun) operates large K8s GPU clusters for internal and commercial use.

---

### 14. `stackhpc` — StackHPC
- **GitHub:** https://github.com/stackhpc
- **Real Company:** StackHPC Ltd (Cambridge, UK)
- **GPU Scale:** UK-based HPC/research cloud integrator; builds OpenStack + Kubernetes HPC clusters for national research institutes
- **Infra Signals from Repos:**
  - `slurm-k8s-cluster` — Multi-container Slurm cluster using Kubernetes
  - `kube-perftest` — Kubernetes performance testing (MPI, GPU benchmarks)
  - `stackhpc-kayobe-config` — OpenStack baremetal deployment config (includes DGX nodes, NVIDIA GPU support)
  - Azimuth app packaging for Slinky/Slurm on K8s
- **Personnel:** Led by John Garbutt (CTO), Bharat Kunwar, and others; OpenStack Foundation members
- **Notes:** Major contributor to UK national research computing infrastructure (STFC, JASMIN, Cambridge HPC). GPU operator + Slurm integration for research HPC.

---

### 15. `FedML-AI` — FedML / TensorOpera
- **GitHub:** https://github.com/FedML-AI
- **Real Company:** TensorOpera AI (formerly FedML; San Jose, CA)
- **GPU Scale:** Cross-cloud GPU job scheduler (multi-cloud, on-prem clusters)
- **Infra Signals from Repos:**
  - `FedML` — "Unified and scalable ML library for large-scale distributed training, model serving, and federated learning. FedML Launch: cross-cloud scheduler for any AI job on any GPU cloud or on-premise cluster"
- **Notes:** Cross-cloud GPU orchestration platform. Enables access to CoreWeave, Lambda, and on-prem GPU clusters through unified API.

---

## Key Tooling Orgs (Not Cluster Operators, But Critical Infrastructure)

| GitHub Org | Tool | Relevance |
|---|---|---|
| `NVIDIA` | `deepops`, `gpu-operator`, `nccl` | Reference GPU cluster deployment tooling |
| `SlinkyProject` | `slurm-operator`, `slurm-bridge` | Slurm-on-K8s (SchedMD, acq. by NVIDIA Dec 2025) |
| `bytedance` | `byteps` | ByteDance's high-perf distributed training framework |
| `DeepRec-AI` | `DeepRec` | Alibaba's recommendation model GPU training (LF AI incubation) |
| `learning-at-home` | `hivemind` | Decentralized GPU training across 1000s of volunteers |
| `lambdal` | `deepops-cloud-slurm` | Lambda Labs' DeepOps fork for Slurm GPU clusters |
| `trace3` | `deepops-1` | IT solution provider, DeepOps fork (enterprise GPU clients) |

---

## Summary Signal Matrix

| Org | K8s | Slurm | Scale (GPU est.) | Open Source Depth | Best Entry Point |
|---|---|---|---|---|---|
| coreweave | ✅ | ✅ (SUNK) | 250,000+ | Medium | `kubernetes-cloud`, `cwic` |
| nebius | ✅ | ✅ (Soperator) | 10,000s+ | **High** | `soperator`, `nebius-solutions-library` |
| crusoecloud | ✅ | ✅ | 10,000s+ | Medium | `slurm`, `crusoe-hpc-slurm` |
| togethercomputer | ✅ | ✅ | 10,000s+ | Medium | `slurm-operator`, `flash-attention-3` |
| SlinkyProject | ✅ | ✅ | N/A (tooling) | **High** | `slurm-operator`, `slurm-bridge` |
| determined-ai (HPE) | ✅ | ✅ | Enterprise | **High** | `determined` |
| leptonai | ✅ | ❌ | 1,000s+ | Medium | `gpud` |
| gpustack | ✅ | ❌ | SMB–Enterprise | **High** | `gpustack` |
| skypilot-org | ✅ | ✅ | Multi-cloud | **High** | `skypilot` |
| microsoft (PAI) | ✅ | ❌ | Internal | Low (archived) | `pai` |
| intelligent-machine-learning | ✅ | ❌ | Hyperscale | Medium | `dlrover` |

---

## Intelligence Notes

1. **NVIDIA's Slurm acquisition (Dec 2025)** via SchedMD/SlinkyProject is a major market signal — NVIDIA now controls the dominant HPC job scheduler used on ~60% of Top500 supercomputers. This deeply integrates NVIDIA into GPU cluster orchestration stacks.

2. **Nebius Soperator** is the most sophisticated open-source Slurm-on-K8s implementation. Their willingness to open-source it signals aggressive market entry and a $3B Meta data center deal confirms real scale.

3. **CoreWeave** has the most comprehensive Kubernetes GPU cloud tooling but keeps core infrastructure private. Their IPO and 250K GPU count makes them the largest pure-play GPU cloud.

4. **Together AI's `slurm-operator`** repo is underappreciated — it signals they built their own Slurm-on-K8s solution independently of Nebius, suggesting serious in-house HPC engineering.

5. **Crusoe** has the most detailed public Slurm deployment automation (`crusoe-hpc-slurm` includes elastic autoscaler with NVIDIA enroot/pyxis) — good reference architecture signal.

6. **lambdal/deepops-cloud-slurm** (Lambda Labs fork) and **trace3/deepops-1** indicate Lambda Labs and Trace3 (a large IT solutions provider) are both deploying GPU clusters using NVIDIA's DeepOps framework for enterprise clients.

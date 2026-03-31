# Hugging Face Enterprise Customers & Inference at Scale

**Research Date:** March 2026  
**Sources:** HF blog, case studies, partnership announcements, industry reports

---

## Platform Scale (as of Spring 2026)

- **13M+ users** on the platform
- **2M+ public models** (top 0.01% = 49.6% of all downloads)
- **500K+ public datasets**
- **2,000+ paying Enterprise Hub customers**
- **10,000+ companies** using HF across industries
- **$130.1M revenue in 2024** (up from ~$70M in 2023)
- **30%+ of Fortune 500** maintain verified HF accounts
- ~500,000 API calls/day from applications on HF infrastructure

---

## Named Enterprise Customers

These companies are documented as paying enterprise customers or have confirmed deployments:

| Company | Sector | HF Usage |
|---|---|---|
| **Intel** | Semiconductor / Hardware | Enterprise Hub, Gaudi integration, RAG applications, OPEA contributor |
| **Pfizer** | Healthcare / Pharma | Drug discovery, biomedical data analysis |
| **Bloomberg** | Financial Media | BloombergGPT, market analysis, risk assessment |
| **eBay** | E-Commerce | Search algorithms, buyer-seller matching |
| **Mayo Clinic** | Healthcare | Medical record processing |
| **Standard Bank** | Financial Services | Market analysis, risk assessment |
| **Amazon (AWS)** | Cloud / Infrastructure | Production AI infrastructure, SageMaker integration |
| **NVIDIA** | Semiconductor / AI | Strongest Big Tech contributor to Hub; DGX Cloud training, NIM serverless inference |
| **Microsoft** | Cloud / Enterprise Software | Azure AI Foundry integration, 10K+ HF models on Azure |
| **Google / Google Cloud** | Cloud / AI | Vertex AI integration, TPU support for HF models |
| **Grammarly** | SaaS / NLP | Models published on Hub (CoEdIT, DeTexD); active OSS contributor |
| **Airbnb** | Travel / Tech | Increased engagement with open ecosystem per HF Spring 2026 report |
| **Salesforce** | CRM / Enterprise SaaS | Investor in HF ($235M round); LLM Open Connector supports HF models |
| **Kustomer** | Customer Service CRM | Conversation classification via HF Transformers + SageMaker endpoints |
| **Prophia** | Commercial Real Estate / AI | NER, text classification via HF DL containers on SageMaker |
| **Phamily** | Healthcare Tech | HIPAA-compliant Inference Endpoints for text classification |
| **Pinecone** | Vector Database | Inference Endpoints for embedding generation; 100+ req/s |

---

## Confirmed Case Studies (HF + AWS)

### Kustomer
- **Use case:** Conversation classification for CRM tickets
- **Stack:** Fine-tuned BERT-base, distilbert variants via HF Transformers → SageMaker endpoints
- **Scale:** Production inference serving all ticket classification
- **GPU signal:** SageMaker endpoints = GPU inference at scale

### Prophia (CRE)
- **Use case:** Extract 140+ named entities from commercial real estate lease docs
- **Stack:** LayoutLM, RoBERTa, T5 → HF DL containers on SageMaker → SageMaker Pipelines
- **Scale:** MLOps pipeline, end-to-end deployment
- **GPU signal:** HF DL containers on SageMaker = GPU-backed

### Phamily (Healthcare)
- **Use case:** HIPAA-compliant text classification for patient care management
- **Stack:** HF Inference Endpoints (custom containers), MPNET and BERT models
- **Result:** Saved ~1 week of developer time per deployment
- **GPU signal:** Dedicated Inference Endpoints = dedicated GPU instances

### Pinecone
- **Use case:** Autoscaled embedding endpoints
- **Stack:** HF Inference Endpoints
- **Scale:** 100+ requests/second served
- **GPU signal:** High-throughput embedding inference at 100+ RPS → significant GPU

---

## Cloud Provider Partnerships (Infrastructure Signal)

### AWS (deepest integration)
- HF Deep Learning Containers on SageMaker
- HF models available in SageMaker JumpStart
- Enterprise Hub available via AWS Marketplace
- Used by: Kustomer, Prophia, Phamily (confirmed)

### Google Cloud (Nov 2025 deepened partnership)
- HF model gateway cached directly on GCP infrastructure
- **TPU native support** for all HF open models
- Vertex AI deployment with Google Threat Intelligence model scanning
- Inference Endpoints now available on GCP

### Microsoft Azure
- 10,000+ HF models on Azure AI Foundry
- Same-day model releases as HF Hub
- Supports text, vision, speech, multimodal
- Deepened at Microsoft Build 2024 (20 new open models)
- HF models deployable via Azure AI Foundry Models

---

## Hardware / On-Prem Partnerships

### NVIDIA
- **Train on DGX Cloud** (Enterprise Hub): H100 at $8.25/GPU-hr, L40S at $2.75/GPU-hr
- **NVIDIA NIM Serverless** on HF: Llama, Mistral, Mixtral, Stable Diffusion, Gemma etc.
- NVIDIA = #1 Big Tech contributor to HF Hub (by repos/releases)
- Partnership for "Training Cluster as a Service" powered by DGX Cloud

### Dell Technologies (May 2024)
- **Dell Enterprise Hub** on Hugging Face
- Designed for on-prem LLM deployment on Dell infrastructure
- Announced at Dell Technologies World 2024
- Target: enterprise customers who can't/won't use public cloud

### Intel
- Gaudi 2 AI accelerators + Xeon CPUs for enterprise RAG on HF
- Active contributor to OPEA (Open Platform for Enterprise AI)
- HF integration for cost-efficient inference on Intel silicon

---

## Inference Provider Ecosystem (GPU-Heavy Workloads)

These companies are **official inference providers** integrated into HF Hub — all run significant GPU infrastructure:

| Provider | Hardware/Speed | HF Integration |
|---|---|---|
| **Cerebras** | CS-3 wafer chips; 2,000+ tokens/s (70x faster than GPU) | March 2025; Llama 3.3 70B etc. |
| **Groq** | LPU (Language Processing Unit); 800+ tokens/s | June 2025; 9+ major open-weight models |
| **Together AI** | GPU clusters; broad model support | Integrated inference provider |
| **Fireworks AI** | GPU inference; function calling specialist | Integrated inference provider |
| **SambaNova** | RDU chips; high throughput | Integrated inference provider |
| **Nebius** | GPU cloud (ex-Yandex); European focus | Integrated inference provider |
| **Hyperbolic** | GPU inference marketplace | Integrated inference provider |
| **Replicate** | Serverless GPU inference | Integrated inference provider |
| **Featherless AI** | Serverless GPU inference | Integrated inference provider |
| **Novita AI** | GPU inference | Integrated inference provider |
| **fal.ai** | GPU serverless, media/image focus | Integrated inference provider |
| **Cohere** | Enterprise LLM inference | Integrated inference provider |
| **Scaleway** | European GPU cloud | Integrated inference provider |
| **NScale** | GPU inference | Integrated inference provider |
| **DigitalOcean** | NVIDIA H100 GPU Droplets; 1-Click Models via HF HUGS | Strategic partnership 2024 |

### How Inference Providers Work
- Developers select provider in HF Playground or API
- Single HF token routes to chosen provider
- Usage billed to HF account at standard provider rates
- PRO users get $2/month inference credits usable across providers

---

## Top Organizations by Model Downloads / Presence

### Highest download volume / ecosystem presence:
1. **Meta** — Llama family; dominant in total downloads historically
2. **NVIDIA** — Strongest Big Tech contributor; accelerating releases
3. **Microsoft** — Phi models, Orca, etc.
4. **Google / Google DeepMind** — Gemma family
5. **DeepSeek** — Chinese lab; ~14% of recent downloads (with Qwen)
6. **Qwen / Alibaba** — Second largest Chinese contributor
7. **Mistral AI** — European; Mistral/Mixtral series
8. **Baidu** — 0 → 100+ releases in 2025
9. **ByteDance** — 8-9x increase in releases
10. **Tencent** — 8-9x increase in releases
11. **Stability AI** — Stable Diffusion models
12. **Cohere** — Command series; enterprise focus
13. **Hugging Face** (internal) — FLAN, BLOOM, Zephyr, SmolLM etc.
14. **ServiceNow** — Models published on HF; integration partnership

> China surpassed the U.S. in monthly downloads in 2025 — Chinese models = 41% of recent downloads

---

## Key Sectors & Use Cases

### Financial Services
- Bloomberg (BloombergGPT, market analysis)
- Standard Bank (risk assessment)
- Uses: NLP on financial documents, sentiment analysis, risk modeling

### Healthcare / Life Sciences
- Pfizer (drug discovery, biomedical NLP)
- Mayo Clinic (medical record processing)
- Phamily (HIPAA-compliant text classification)
- Uses: Named entity recognition, document processing, clinical NLP

### E-Commerce / Retail
- eBay (search, buyer-seller matching)
- Uses: Semantic search, recommendation, NLP

### SaaS / Tech
- Grammarly (text editing models)
- Kustomer (CX automation)
- ServiceNow (enterprise AI agents)
- Uses: Text classification, fine-tuned domain models

### Commercial Real Estate
- Prophia (lease document extraction)
- Uses: Document AI, NER, MLOps pipelines

---

## Inference Endpoints: Enterprise Tier Features

- **SOC2 Type 2** certified
- **HIPAA BAA** available
- **GDPR** data processing compliance
- **VPC-only** (private endpoints, no public internet exposure)
- Deployment on AWS, GCP, Azure
- Supports: vLLM, TGI (Text Generation Inference), SGLang, TEI (Text Embeddings Inference), custom containers
- Enterprise pricing: custom volume commit + annual contracts with 24/7 SLAs

---

## HF HUGS (GenAI Services) — Containerized Inference

- Pre-built containers: everything needed to run a model
- Built on TGI and Transformers
- Works with NVIDIA GPUs, AMD GPUs
- Planned: Amazon Inferentia, Google TPUs
- Used by **DigitalOcean** for 1-Click Model deployment on H100 Droplets
- Exposes standard OpenAI-compatible API

---

## Funding & Notable Investors (Signal of Enterprise Traction)

$235M Series D (August 2023) at $4.5B valuation. Investors included:
- **Salesforce** (strategic)
- **NVIDIA** (strategic)
- **Google** (strategic)
- **Amazon** (strategic)
- **Intel Capital** (strategic)
- **IBM** (strategic)
- **Qualcomm** (strategic)
- Coatue, Sequoia, Lux Capital, Betaworks

All major GPU / cloud / enterprise AI players are investors → HF is strategic infrastructure for the entire industry.

---

## Targeting Notes

**Best-fit targets for GPU/inference infrastructure sales:**

1. **HF Inference Endpoint customers** — companies using dedicated endpoints are already committed to paying for GPU inference; look for companies deploying via VPC endpoints (enterprise-tier)
2. **Inference providers** — Cerebras, Groq, Together AI, Fireworks, SambaNova, Nebius are all running massive GPU clusters; they're serving the HF ecosystem
3. **Enterprise Hub customers** — 2,000+ orgs; specifically those in regulated industries (healthcare, finance) running private deployments
4. **Dell Enterprise Hub customers** — on-prem GPU inference for companies avoiding cloud
5. **Fortune 500 on HF** — 30%+ of Fortune 500 have verified accounts; many are experimenting → conversion opportunity

**Companies with GPU-heavy inference confirmed:**
- Pinecone (100+ RPS embedding endpoints)
- Kustomer (production SageMaker inference)
- Phamily (HIPAA endpoint, production)
- Prophia (SageMaker pipeline inference)
- All inference providers (Cerebras, Groq, Together AI, Fireworks, SambaNova, etc.)

---

*Last updated: March 2026*

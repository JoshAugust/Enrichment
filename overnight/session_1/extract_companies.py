#!/usr/bin/env python3
"""
Session 1: Extract companies from awesome lists and dev communities.
Check against existing domains, write new ones to queue.
"""

import json
import sqlite3
import os
import re
from datetime import datetime, timezone

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
HUBSPOT_DOMAINS_PATH = f"{WORKSPACE}/jordan.ai/overnight/shared/hubspot_domains_current.json"
MASTER_DB_PATH = f"{WORKSPACE}/jordan.ai/pipeline/master.db"
QUEUE_PATH = f"{WORKSPACE}/jordan.ai/overnight/shared/new_companies_queue.jsonl"
LOG_PATH = f"{WORKSPACE}/jordan.ai/overnight/session_1/github_devcom_log.md"

# Load existing domains
print("Loading existing domains...")
with open(HUBSPOT_DOMAINS_PATH) as f:
    hubspot_domains = set(json.load(f))
print(f"  HubSpot: {len(hubspot_domains):,} domains")

conn = sqlite3.connect(MASTER_DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT domain FROM companies WHERE domain IS NOT NULL")
db_domains = set(row[0].lower().strip() for row in cursor.fetchall())
conn.close()
print(f"  Master DB: {len(db_domains):,} domains")

all_existing = hubspot_domains | db_domains
print(f"  Total existing: {len(all_existing):,} domains")


def is_new(domain):
    """Check if domain is new (not in existing sets)."""
    d = domain.lower().strip()
    return d not in all_existing and d != "" and "." in d


def normalize_domain(url):
    """Extract bare domain from URL."""
    if not url:
        return None
    url = url.strip()
    # Remove protocol
    url = re.sub(r'^https?://', '', url)
    # Remove www.
    url = re.sub(r'^www\.', '', url)
    # Remove path
    url = url.split('/')[0]
    # Remove port
    url = url.split(':')[0]
    # Remove query params
    url = url.split('?')[0]
    url = url.strip().lower()
    if url and '.' in url and len(url) > 3:
        return url
    return None


def append_to_queue(entries):
    """Append entries to queue JSONL."""
    with open(QUEUE_PATH, 'a') as f:
        for e in entries:
            f.write(json.dumps(e) + "\n")


# ========================
# SOURCE 1: awesome-oss-alternatives companies (extracted from web_fetch above)
# ========================
oss_alternatives = [
    # API
    {"domain": "apisix.apache.org", "company_name": "Apache APISIX", "description": "Cloud Native API Gateway"},
    {"domain": "firecamp.dev", "company_name": "Firecamp", "description": "DX first open-source API devtool"},
    {"domain": "fusio-project.org", "company_name": "Fusio", "description": "API management platform"},
    {"domain": "hoppscotch.io", "company_name": "Hoppscotch", "description": "API development ecosystem"},
    {"domain": "keploy.io", "company_name": "Keploy", "description": "e2e Testing and Data Mocking"},
    {"domain": "stepci.com", "company_name": "Step CI", "description": "API Testing and Monitoring"},
    # Auth
    {"domain": "boxyhq.com", "company_name": "BoxyHQ", "description": "Enterprise Readiness - SAML SSO"},
    {"domain": "cerbos.dev", "company_name": "Cerbos", "description": "Granular access control"},
    {"domain": "fusionauth.io", "company_name": "FusionAuth", "description": "User authentication and session management"},
    {"domain": "hanko.io", "company_name": "Hanko", "description": "Passkey-first authentication framework"},
    {"domain": "cloud-iam.com", "company_name": "Keycloak/Cloud IAM", "description": "User authentication framework"},
    {"domain": "opal.ac", "company_name": "Permit.io OPAL", "description": "Authorization administration framework"},
    {"domain": "ory.sh", "company_name": "Ory", "description": "Identity platform"},
    {"domain": "osohq.com", "company_name": "Oso", "description": "Authorization building framework"},
    {"domain": "supertokens.io", "company_name": "Supertokens", "description": "User authentication and session management"},
    {"domain": "warrant.dev", "company_name": "Warrant", "description": "Authorization and access control as a service"},
    {"domain": "zitadel.com", "company_name": "Zitadel", "description": "User authentication and session management"},
    # Backend as a service
    {"domain": "acebase.io", "company_name": "AceBase", "description": "Backend server with REST APIs"},
    {"domain": "amplication.com", "company_name": "Amplication", "description": "Backend server with REST and GraphQL APIs"},
    {"domain": "appwrite.io", "company_name": "Appwrite", "description": "Backend server with REST APIs"},
    {"domain": "case.app", "company_name": "CASE", "description": "Lightweight Backend-as-a-Service"},
    {"domain": "encore.dev", "company_name": "Encore", "description": "Backend Development Engine for cloud-based apps"},
    {"domain": "kuzzle.io", "company_name": "Kuzzle", "description": "Backend server with REST APIs"},
    {"domain": "nhost.io", "company_name": "Nhost", "description": "Backend server with GraphQL"},
    {"domain": "pocketbase.io", "company_name": "PocketBase", "description": "Backend server with REST APIs"},
    {"domain": "supabase.io", "company_name": "Supabase", "description": "Open source Firebase alternative"},
    # BI
    {"domain": "metabase.com", "company_name": "Metabase", "description": "Business intelligence software"},
    {"domain": "preset.io", "company_name": "Preset", "description": "Modern BI platform powered by Apache Superset"},
    # CMS
    {"domain": "builder.io", "company_name": "Builder.io", "description": "Drag and drop page builder and CMS"},
    {"domain": "concretecms.com", "company_name": "Concrete CMS", "description": "CMS for teams"},
    {"domain": "decapcms.org", "company_name": "Decap CMS", "description": "Git-based CMS"},
    {"domain": "directus.io", "company_name": "Directus", "description": "Data platform wraps any database"},
    {"domain": "ghost.org", "company_name": "Ghost", "description": "Headless Node.js publishing platform"},
    {"domain": "plasmic.app", "company_name": "Plasmic", "description": "Headless page builder"},
    {"domain": "strapi.io", "company_name": "Strapi", "description": "Node.js Headless CMS"},
    {"domain": "sulu.io", "company_name": "Sulu", "description": "Modern Symfony based CMS"},
    {"domain": "tina.io", "company_name": "Tina CMS", "description": "Visual editor for React websites"},
    {"domain": "webiny.com", "company_name": "Webiny", "description": "Enterprise serverless CMS"},
    # Cloud Data Warehouse
    {"domain": "databend.rs", "company_name": "Databend", "description": "Elastic Cloud Data Warehouse"},
    # Cloud Dev Environment
    {"domain": "gitpod.io", "company_name": "Gitpod", "description": "Cloud development environments"},
    # Cloud Storage
    {"domain": "min.io", "company_name": "MinIO", "description": "S3 compatible object storage"},
    {"domain": "storj.io", "company_name": "Storj", "description": "Decentralized cloud storage"},
    # Cybersecurity
    {"domain": "cloudquery.io", "company_name": "CloudQuery", "description": "Cloud asset configuration audit"},
    {"domain": "crowdsec.net", "company_name": "CrowdSec", "description": "Collaborative IPS"},
    {"domain": "faradaysec.com", "company_name": "Faraday", "description": "Open Source Vulnerability Management"},
    {"domain": "firezone.dev", "company_name": "Firezone", "description": "VPN Server & Firewall for teams"},
    {"domain": "gravitl.com", "company_name": "Gravitl", "description": "WireGuard virtual networking platform"},
    {"domain": "lunasec.io", "company_name": "LunaTrace/LunaSec", "description": "Dependency Vulnerability Scanner"},
    {"domain": "matano.dev", "company_name": "Matano", "description": "Open source cloud-native security lake"},
    {"domain": "netbird.io", "company_name": "NetBird", "description": "Zero Config Mesh VPN"},
    {"domain": "projectdiscovery.io", "company_name": "ProjectDiscovery", "description": "Nuclei vulnerability scanner"},
    # Design
    {"domain": "21st.dev", "company_name": "21st.dev", "description": "NPM for Design Engineers"},
    {"domain": "penpot.app", "company_name": "Penpot", "description": "Design & prototyping platform"},
    # Digital Signature
    {"domain": "docuseal.co", "company_name": "DocuSeal", "description": "Digital Signing Infrastructure"},
    {"domain": "documenso.com", "company_name": "Documenso", "description": "Digital Signing Infrastructure"},
    # E-commerce
    {"domain": "bagisto.com", "company_name": "Bagisto", "description": "Headless e-commerce platform"},
    {"domain": "medusajs.com", "company_name": "Medusa", "description": "Headless e-commerce platform"},
    {"domain": "saleor.io", "company_name": "Saleor", "description": "Headless e-commerce platform"},
    {"domain": "sylius.com", "company_name": "Sylius", "description": "Headless e-commerce platform"},
    {"domain": "vendure.io", "company_name": "Vendure", "description": "Headless e-commerce platform"},
    {"domain": "vuestorefront.io", "company_name": "Vue Storefront", "description": "Frontend for e-commerce"},
    # ETL
    {"domain": "airbyte.io", "company_name": "Airbyte", "description": "Data integration platform"},
    {"domain": "benthos.dev", "company_name": "Benthos", "description": "Data streaming processor"},
    {"domain": "dagster.io", "company_name": "Dagster", "description": "Orchestration platform for data assets"},
    {"domain": "kestra.io", "company_name": "Kestra", "description": "Orchestration and scheduling platform"},
    {"domain": "prefect.io", "company_name": "Prefect", "description": "Data orchestration platform"},
    {"domain": "selefra.io", "company_name": "Selefra", "description": "Open-source policy-as-code analytics"},
    # ERP
    {"domain": "dolicloud.com", "company_name": "DoliCloud", "description": "Business management suite ERP and CRM"},
    {"domain": "erpnext.com", "company_name": "ERPNext", "description": "Agile modern module based Business management"},
    # Email marketing
    {"domain": "keila.io", "company_name": "Keila", "description": "Email newsletter tool"},
    # Enterprise Search
    {"domain": "appbase.io", "company_name": "AppBase", "description": "Search UI components for React and Vue"},
    {"domain": "jina.ai", "company_name": "Jina AI", "description": "Neural search framework"},
    {"domain": "manticoresearch.com", "company_name": "Manticore Search", "description": "Fast database for search"},
    {"domain": "meilisearch.com", "company_name": "Meilisearch", "description": "Typo tolerant search engine"},
    {"domain": "qdrant.tech", "company_name": "Qdrant", "description": "Vector similarity search engine"},
    {"domain": "weaviate.io", "company_name": "Weaviate", "description": "Real-time vector search engine"},
    {"domain": "typesense.org", "company_name": "TypeSense", "description": "Typo tolerant fuzzy search engine"},
    {"domain": "zilliz.com", "company_name": "Zilliz", "description": "Vector database for AI - Milvus"},
    {"domain": "zinclabs.io", "company_name": "Zinc Labs", "description": "Cloud native full text search"},
    {"domain": "deepset.ai", "company_name": "deepset", "description": "NLP platform for enterprise semantic search"},
    # Feature flags
    {"domain": "flagsmith.com", "company_name": "FlagSmith", "description": "Feature Flag & Remote Config Service"},
    {"domain": "growthbook.io", "company_name": "GrowthBook", "description": "Feature flags and A/B testing"},
    {"domain": "getunleash.io", "company_name": "Unleash", "description": "Feature flags platform"},
    # File Hosting
    {"domain": "filestash.app", "company_name": "Filestash", "description": "File manager for distributed data"},
    {"domain": "nextcloud.com", "company_name": "Nextcloud", "description": "Personal cloud on your server"},
    {"domain": "owncloud.com", "company_name": "Owncloud", "description": "Personal cloud on your server"},
    {"domain": "spacedrive.com", "company_name": "Spacedrive", "description": "Cross-platform file manager"},
    # Financial
    {"domain": "getlago.com", "company_name": "Lago", "description": "Open Source Billing API"},
    # Form Building
    {"domain": "formbricks.com", "company_name": "Formbricks", "description": "Forms and data management platform"},
    {"domain": "form.io", "company_name": "Form.io", "description": "Form and Data Management Platform"},
    # Forum
    {"domain": "discourse.org", "company_name": "Discourse", "description": "Platform for community discussion"},
    {"domain": "vanillaforums.com", "company_name": "Vanilla Forums", "description": "Community discussion platform"},
    # Graph DB
    {"domain": "arangodb.com", "company_name": "ArangoDB", "description": "Graph database and document store"},
    {"domain": "memgraph.com", "company_name": "Memgraph", "description": "In-memory graph database"},
    {"domain": "neo4j.com", "company_name": "Neo4j", "description": "Graph database platform"},
    {"domain": "terminusdb.com", "company_name": "TerminusDB", "description": "Knowledge graph and document store"},
    # Helpdesk
    {"domain": "peppermint.sh", "company_name": "Peppermint", "description": "Ticket Management & Helpdesk system"},
    {"domain": "uvdesk.com", "company_name": "UVDesk", "description": "Ticket Management & Helpdesk system"},
    # Internal Tools
    {"domain": "appsmith.com", "company_name": "AppSmith", "description": "Low-code platform for internal tools"},
    {"domain": "budibase.com", "company_name": "Budibase", "description": "Low-code platform for internal tools"},
    {"domain": "illacloud.com", "company_name": "ILLA Cloud", "description": "Low-code platform for internal tools"},
    {"domain": "lowdefy.com", "company_name": "Lowdefy", "description": "YAML-based low-code platform"},
    {"domain": "tooljet.io", "company_name": "Tooljet", "description": "Low-code framework for internal tools"},
    {"domain": "windmill.dev", "company_name": "Windmill", "description": "Company-wide apps and automations"},
    # i18n
    {"domain": "tolgee.io", "company_name": "Tolgee", "description": "Web-based localization platform"},
    {"domain": "inlang.com", "company_name": "inlang", "description": "Developer-first localization infrastructure"},
    # Log Management
    {"domain": "graylog.org", "company_name": "Graylog", "description": "Log management platform"},
    {"domain": "quickwit.io", "company_name": "Quickwit", "description": "Cloud-native log management & analytics"},
    # ML Ops
    {"domain": "cortex.dev", "company_name": "Cortex", "description": "Production infrastructure for machine learning"},
    {"domain": "metarank.ai", "company_name": "Metarank", "description": "AutoML personalized ranking"},
    {"domain": "mindsdb.com", "company_name": "MindsDB", "description": "In-database machine learning platform"},
    {"domain": "ploomber.io", "company_name": "Ploomber", "description": "YAML-based pipeline builder for ML"},
    {"domain": "seldon.io", "company_name": "Seldon", "description": "Deployment & monitoring for ML at scale"},
    # Marketing SaaS
    {"domain": "dub.sh", "company_name": "Dub", "description": "Open-source Bitly Alternative with analytics"},
    # Messaging
    {"domain": "element.io", "company_name": "Element", "description": "Enterprise communication platform"},
    {"domain": "mattermost.com", "company_name": "Mattermost", "description": "Enterprise communication for developers"},
    {"domain": "rocket.chat", "company_name": "Rocket.Chat", "description": "Enterprise communication platform"},
    {"domain": "tinode.co", "company_name": "Tinode", "description": "General instant messaging"},
    {"domain": "zulip.com", "company_name": "Zulip", "description": "Team chat"},
    # Metrics Store
    {"domain": "cube.dev", "company_name": "Cube.js", "description": "Headless business intelligence suite"},
    {"domain": "evidence.dev", "company_name": "Evidence", "description": "Lightweight BI using SQL and markdown"},
    {"domain": "lightdash.com", "company_name": "LightDash", "description": "Low-code metrics layer"},
    # No-code Database
    {"domain": "baserow.io", "company_name": "Baserow", "description": "No-code database and Airtable alternative"},
    {"domain": "nocodb.com", "company_name": "NocoDB", "description": "No-code database and Airtable alternative"},
    {"domain": "rowy.io", "company_name": "Rowy", "description": "Airtable-like spreadsheet UI for databases"},
    # Notetaking
    {"domain": "appflowy.io", "company_name": "AppFlowy", "description": "Open-source alternative to Notion"},
    {"domain": "boostnote.io", "company_name": "Boost Note", "description": "Collaborative workspace for developer teams"},
    {"domain": "logseq.com", "company_name": "Logseq", "description": "Knowledge base manager"},
    {"domain": "notabase.io", "company_name": "Notabase", "description": "Note-taking app for networked thinking"},
    {"domain": "notesnook.com", "company_name": "Notesnook", "description": "End-to-end encrypted note taking"},
    {"domain": "getoutline.com", "company_name": "Outline", "description": "Wiki and knowledge base"},
    # Observability
    {"domain": "chaosgenius.io", "company_name": "Chaos Genius", "description": "ML powered analytics for anomaly detection"},
    {"domain": "grafana.com", "company_name": "Grafana", "description": "Observability and data visualization"},
    {"domain": "netdata.cloud", "company_name": "Netdata", "description": "Application monitoring and observability"},
    {"domain": "openstatus.dev", "company_name": "OpenStatus", "description": "Synthetic monitoring platform"},
    {"domain": "sentry.io", "company_name": "Sentry", "description": "Application monitoring with error reporting"},
    {"domain": "signoz.io", "company_name": "Signoz", "description": "Application monitoring and observability"},
    {"domain": "uptrace.dev", "company_name": "Uptrace", "description": "Application monitoring and observability"},
    {"domain": "victoriametrics.com", "company_name": "VictoriaMetrics", "description": "Application monitoring platform"},
    # Password Manager
    {"domain": "bitwarden.com", "company_name": "BitWarden", "description": "Password manager for teams"},
    {"domain": "padloc.app", "company_name": "Padloc", "description": "Password manager for teams"},
    {"domain": "passbolt.com", "company_name": "Passbolt", "description": "Password manager for teams"},
    # PaaS
    {"domain": "coolify.io", "company_name": "Coolify", "description": "Self-hostable Heroku alternative"},
    {"domain": "dokku.com", "company_name": "Dokku", "description": "Open source PAAS alternative to Heroku"},
    {"domain": "otomi.io", "company_name": "Otomi", "description": "Self-hosted PaaS for Kubernetes"},
    {"domain": "porter.run", "company_name": "Porter", "description": "Kubernetes powered PaaS"},
    {"domain": "pulumi.com", "company_name": "Pulumi", "description": "Universal Infrastructure as Code"},
    {"domain": "qovery.com", "company_name": "Qovery", "description": "Kubernetes powered PaaS"},
    {"domain": "dyrector.io", "company_name": "dyrector.io", "description": "Simplify container delivery"},
    # Product Analytics
    {"domain": "posthog.com", "company_name": "PostHog", "description": "Product analytics platform"},
    {"domain": "trench.dev", "company_name": "Trench", "description": "Open source analytics infrastructure"},
    # Project Management
    {"domain": "openproject.org", "company_name": "OpenProject", "description": "Project management software"},
    {"domain": "plane.so", "company_name": "Plane", "description": "Alternative to Linear JIRA Trello"},
    {"domain": "taiga.io", "company_name": "Taiga", "description": "Project management software"},
    {"domain": "vikunja.io", "company_name": "Vikunja", "description": "To-do app for projects"},
    # Relational DB
    {"domain": "pingcap.com", "company_name": "PingCAP", "description": "NewSQL database HTAP workloads"},
    {"domain": "yugabyte.com", "company_name": "Yugabyte", "description": "High-performance distributed SQL"},
    # Remote Desktop
    {"domain": "rustdesk.com", "company_name": "RustDesk", "description": "Open source remote desktop"},
    # Reverse ETL
    {"domain": "castled.io", "company_name": "Castled", "description": "Data synchronization to external apps"},
    {"domain": "grouparoo.com", "company_name": "Grouparoo", "description": "Data synchronization framework"},
    # RPA
    {"domain": "robocorp.com", "company_name": "RoboCorp", "description": "Automation packages tooling"},
    # Scheduling
    {"domain": "cal.com", "company_name": "Cal.com", "description": "Scheduling infrastructure, Calendly alternative"},
    # Session Replay
    {"domain": "openreplay.com", "company_name": "OpenReplay", "description": "Session replay stack for developers"},
    # Social Media
    {"domain": "postiz.com", "company_name": "Postiz", "description": "Self-hosted social media scheduling"},
    # Surveys
    {"domain": "limesurvey.org", "company_name": "LimeSurvey", "description": "Online survey platform"},
    # Time Series DB
    {"domain": "crate.io", "company_name": "CrateDB", "description": "Distributed SQL for time series"},
    {"domain": "influxdata.com", "company_name": "InfluxDB", "description": "Database for time series data"},
    {"domain": "questdb.io", "company_name": "QuestDB", "description": "Database for time series data"},
    {"domain": "tdengine.com", "company_name": "TDengine", "description": "Database for time series data"},
    {"domain": "timescale.com", "company_name": "TimescaleDB", "description": "Database for time series data"},
    # Tunnelling
    {"domain": "tunnelmole.com", "company_name": "Tunnelmole", "description": "Public URL for local dev"},
    # VPN
    {"domain": "omniedge.io", "company_name": "OmniEdge", "description": "No-code P2P mesh VPN for enterprise"},
    # Video Conferencing
    {"domain": "jitsi.org", "company_name": "Jitsi", "description": "Video conferences platform and SDK"},
    {"domain": "livekit.io", "company_name": "LiveKit", "description": "SFU and SDKs for scalable WebRTC"},
    {"domain": "openvidu.io", "company_name": "OpenVidu", "description": "WebRTC video conferences platform"},
    # Webhooks
    {"domain": "svix.com", "company_name": "Svix", "description": "Webhooks as a Service"},
    # Website Analytics
    {"domain": "goatcounter.com", "company_name": "GoatCounter", "description": "Web analytics without personal data tracking"},
    {"domain": "matomo.org", "company_name": "Matomo", "description": "Google Analytics alternative"},
    {"domain": "plausible.io", "company_name": "Plausible", "description": "Google Analytics alternative"},
    {"domain": "swetrix.com", "company_name": "Swetrix", "description": "Google Analytics alternative"},
    {"domain": "umami.is", "company_name": "Umami", "description": "Google Analytics alternative"},
    # Workflow Automation
    {"domain": "activepieces.com", "company_name": "Activepieces", "description": "No-code business automation"},
    {"domain": "n8n.io", "company_name": "N8N", "description": "Node-based workflow automation for developers"},
    {"domain": "pipedream.com", "company_name": "Pipedream", "description": "Workflow automation and API integration"},
    {"domain": "temporal.io", "company_name": "Temporal", "description": "Workflows as code platform"},
    # Community Platform
    {"domain": "crowd.dev", "company_name": "crowd.dev", "description": "Community and data tools for community-led growth"},
    # Customer Data Platform
    {"domain": "jitsu.com", "company_name": "Jitsu", "description": "Fully-scriptable data ingestion engine"},
    {"domain": "rudderstack.com", "company_name": "RudderStack", "description": "Customer data platform for developers"},
    {"domain": "tracardi.com", "company_name": "Tracardi", "description": "Customer Data Platform with journey automation"},
    # Customer Engagement
    {"domain": "chaskiq.io", "company_name": "Chaskiq", "description": "Live chat widget"},
    {"domain": "chatwoot.com", "company_name": "Chatwoot", "description": "Live chat widget"},
    # Communication
    {"domain": "fonoster.com", "company_name": "Fonoster", "description": "APIs for SMS voice and video"},
    {"domain": "novu.co", "company_name": "Novu", "description": "Components and APIs for notifications"},
    # Billing
    {"domain": "openbb.co", "company_name": "OpenBB", "description": "Investment research terminal"},
]

# ========================
# SOURCE 2: awesome-selfhosted (extracted from web_fetch)
# ========================
selfhosted_companies = [
    {"domain": "aptabase.com", "company_name": "Aptabase", "description": "Privacy first analytics for mobile and desktop apps"},
    {"domain": "count.ly", "company_name": "Countly", "description": "Real time mobile and web analytics platform"},
    {"domain": "litlyx.com", "company_name": "Litlyx", "description": "All-in-one Analytics Solution with AI-powered dashboard"},
    {"domain": "offen.dev", "company_name": "Offen", "description": "Fair lightweight open web analytics"},
    {"domain": "middlewarehq.com", "company_name": "Middleware", "description": "Engineering metrics DORA metrics tool"},
    {"domain": "mixpost.app", "company_name": "Mixpost", "description": "Social media management software"},
    {"domain": "automatisch.io", "company_name": "Automatisch", "description": "Business automation alternative to Zapier"},
    {"domain": "chiefonboarding.com", "company_name": "ChiefOnboarding", "description": "Employee onboarding platform"},
    {"domain": "dittofeed.com", "company_name": "Dittofeed", "description": "Omni-channel customer engagement and messaging"},
    {"domain": "healthchecks.io", "company_name": "Healthchecks", "description": "Cron job monitoring - alerts when pings are late"},
    {"domain": "getleon.ai", "company_name": "Leon", "description": "Personal assistant on your server"},
    {"domain": "stackstorm.com", "company_name": "StackStorm", "description": "Event-driven automation for auto-remediation"},
    {"domain": "hitkeep.com", "company_name": "HitKeep", "description": "Privacy-first web analytics with funnels"},
    {"domain": "medama.io", "company_name": "Medama Analytics", "description": "Privacy-first website analytics"},
    {"domain": "changedetection.io", "company_name": "Changedetection.io", "description": "Web-site content change monitoring"},
]

# ========================
# SOURCE 3: ProductHunt & community mentions 
# ========================
ph_community_companies = [
    {"domain": "corbado.com", "company_name": "Corbado", "description": "Passkey-first authentication"},
    {"domain": "langfuse.com", "company_name": "Langfuse", "description": "Open-source LLM engineering platform"},
    {"domain": "liveblocks.io", "company_name": "Liveblocks", "description": "Toolkit to embed collaboration features"},
    {"domain": "motherduck.com", "company_name": "MotherDuck", "description": "Simple analytics platform"},
    {"domain": "grafbase.com", "company_name": "Grafbase", "description": "GraphQL backend with realtime subscriptions"},
    {"domain": "tigrisdata.com", "company_name": "Tigris", "description": "Serverless database with search"},
    {"domain": "inngest.com", "company_name": "Inngest", "description": "Event-driven app development"},
    {"domain": "lightning.ai", "company_name": "Lightning AI", "description": "AI model training platform"},
    {"domain": "launchgrid.dev", "company_name": "Launchgrid", "description": "Explore launches across Product Hunt and Show HN"},
    {"domain": "itslaunched.com", "company_name": "ItsLaunched", "description": "Alternative to Product Hunt for indie makers"},
    {"domain": "mailparser.io", "company_name": "Mailparser", "description": "Email data extraction service"},
    {"domain": "permit.io", "company_name": "Permit.io", "description": "Authorization and access control infrastructure"},
    {"domain": "neon.tech", "company_name": "Neon", "description": "Serverless PostgreSQL"},
    {"domain": "planetscale.com", "company_name": "PlanetScale", "description": "Serverless MySQL database platform"},
    {"domain": "turso.tech", "company_name": "Turso", "description": "Edge SQLite database platform"},
    {"domain": "xata.io", "company_name": "Xata", "description": "Serverless data platform built on PostgreSQL"},
    {"domain": "convex.dev", "company_name": "Convex", "description": "Backend application platform"},
    {"domain": "trigger.dev", "company_name": "Trigger.dev", "description": "Open source background jobs platform"},
    {"domain": "railway.app", "company_name": "Railway", "description": "Infrastructure platform for developers"},
    {"domain": "render.com", "company_name": "Render", "description": "Unified cloud to build and run apps"},
    {"domain": "fly.io", "company_name": "Fly.io", "description": "Deploy full-stack apps and databases anywhere"},
    {"domain": "vercel.com", "company_name": "Vercel", "description": "Frontend cloud platform"},
    {"domain": "netlify.com", "company_name": "Netlify", "description": "Cloud platform for web development"},
    {"domain": "coherenceteam.com", "company_name": "Coherence", "description": "Full-stack environments on any cloud"},
    {"domain": "encore.cloud", "company_name": "Encore Cloud", "description": "Backend development platform"},
    {"domain": "zuplo.com", "company_name": "Zuplo", "description": "API gateway for developers"},
    {"domain": "unkey.dev", "company_name": "Unkey", "description": "Open source API authentication"},
    {"domain": "stytch.com", "company_name": "Stytch", "description": "API-first user infrastructure"},
    {"domain": "clerk.com", "company_name": "Clerk", "description": "User management and authentication"},
    {"domain": "workos.com", "company_name": "WorkOS", "description": "Enterprise-grade single sign-on"},
    {"domain": "propelauth.com", "company_name": "PropelAuth", "description": "Auth for B2B SaaS"},
    {"domain": "logto.io", "company_name": "Logto", "description": "Auth infrastructure for developers"},
    {"domain": "descope.com", "company_name": "Descope", "description": "Authentication and user management"},
    {"domain": "authsignal.com", "company_name": "Authsignal", "description": "Fraud prevention and authentication"},
    {"domain": "passwordless.dev", "company_name": "Passwordless.dev", "description": "Passwordless authentication API"},
    {"domain": "magic.link", "company_name": "Magic", "description": "Passwordless authentication SDK"},
    {"domain": "privy.io", "company_name": "Privy", "description": "User authentication for Web3"},
    {"domain": "dynamic.xyz", "company_name": "Dynamic", "description": "Web3 auth and onboarding"},
    {"domain": "openfort.io", "company_name": "Openfort", "description": "Gaming auth infrastructure"},
    {"domain": "nango.dev", "company_name": "Nango", "description": "Open-source integrations platform"},
    {"domain": "merge.dev", "company_name": "Merge", "description": "Single API for hundreds of integrations"},
    {"domain": "apideck.com", "company_name": "Apideck", "description": "Unified API for B2B integrations"},
    {"domain": "codat.io", "company_name": "Codat", "description": "Financial data integrations for fintech"},
    {"domain": "rutter.com", "company_name": "Rutter", "description": "Universal commerce API"},
    {"domain": "finch.com", "company_name": "Finch", "description": "Unified employment API"},
    {"domain": "vessel.land", "company_name": "Vessel", "description": "Embedded CRM integrations"},
    {"domain": "alloy.io", "company_name": "Alloy", "description": "E-commerce automation platform"},
    {"domain": "sequin.io", "company_name": "Sequin", "description": "Sync APIs to your database"},
    {"domain": "nylas.com", "company_name": "Nylas", "description": "Email, calendar, and contacts API"},
    {"domain": "courier.com", "company_name": "Courier", "description": "Multi-channel notifications API"},
    {"domain": "knock.app", "company_name": "Knock", "description": "Notifications infrastructure"},
    {"domain": "magicbell.com", "company_name": "MagicBell", "description": "In-app notification infrastructure"},
    {"domain": "sendbird.com", "company_name": "Sendbird", "description": "Chat and messaging SDK"},
    {"domain": "stream.io", "company_name": "Stream", "description": "Chat messaging and activity feeds API"},
    {"domain": "ably.com", "company_name": "Ably", "description": "Realtime messaging infrastructure"},
    {"domain": "pusher.com", "company_name": "Pusher", "description": "Realtime messaging and notifications"},
    {"domain": "sanity.io", "company_name": "Sanity", "description": "Structured content management platform"},
    {"domain": "contentful.com", "company_name": "Contentful", "description": "Content infrastructure for digital teams"},
    {"domain": "storyblok.com", "company_name": "Storyblok", "description": "Headless CMS with visual editor"},
    {"domain": "prismic.io", "company_name": "Prismic", "description": "Headless CMS for developers"},
    {"domain": "hygraph.com", "company_name": "Hygraph", "description": "Federated content platform"},
    {"domain": "flotiq.com", "company_name": "Flotiq", "description": "API-first headless CMS"},
    {"domain": "caisy.io", "company_name": "Caisy", "description": "Headless CMS built for performance"},
    {"domain": "datocms.com", "company_name": "DatoCMS", "description": "Headless CMS for digital teams"},
    {"domain": "kontent.ai", "company_name": "Kontent.ai", "description": "Modular content platform"},
    {"domain": "agilitycms.com", "company_name": "Agility CMS", "description": "Headless CMS for enterprises"},
    {"domain": "stackbit.com", "company_name": "Stackbit", "description": "Visual editing for headless sites"},
    {"domain": "payload.app", "company_name": "Payload CMS", "description": "Headless CMS and application framework"},
    {"domain": "keystonejs.com", "company_name": "KeystoneJS", "description": "Content management and API creation"},
    {"domain": "umbraco.com", "company_name": "Umbraco", "description": "Open source .NET CMS"},
    {"domain": "wagtail.org", "company_name": "Wagtail", "description": "Django-based content management"},
    {"domain": "forestadmin.com", "company_name": "Forest Admin", "description": "Admin panel for developers"},
    {"domain": "retool.com", "company_name": "Retool", "description": "Low-code internal tool builder"},
    {"domain": "internal.io", "company_name": "Internal.io", "description": "No-code internal tool builder"},
    {"domain": "airplane.dev", "company_name": "Airplane", "description": "Developer infrastructure for internal tools"},
    {"domain": "superblocks.com", "company_name": "Superblocks", "description": "Enterprise internal tool builder"},
    {"domain": "novu.co", "company_name": "Novu", "description": "Open source notification infrastructure"},
    {"domain": "highlight.io", "company_name": "Highlight.io", "description": "Full-stack session replay and error monitoring"},
    {"domain": "logrocket.com", "company_name": "LogRocket", "description": "Session replay and product analytics"},
    {"domain": "fullstory.com", "company_name": "FullStory", "description": "Digital experience analytics"},
    {"domain": "smartlook.com", "company_name": "Smartlook", "description": "Qualitative analytics for websites"},
    {"domain": "mouseflow.com", "company_name": "Mouseflow", "description": "Behavior analytics platform"},
    {"domain": "hotjar.com", "company_name": "Hotjar", "description": "Behavior analytics and feedback"},
    {"domain": "clarity.microsoft.com", "company_name": "Microsoft Clarity", "description": "Free heatmaps and session recordings"},
    {"domain": "june.so", "company_name": "June", "description": "Product analytics for B2B SaaS"},
    {"domain": "mixpanel.com", "company_name": "Mixpanel", "description": "Product analytics for user behavior"},
    {"domain": "amplitude.com", "company_name": "Amplitude", "description": "Product analytics and digital optimization"},
    {"domain": "heap.io", "company_name": "Heap", "description": "Autocapture product analytics"},
    {"domain": "pendo.io", "company_name": "Pendo", "description": "Product experience platform"},
    {"domain": "gainsight.com", "company_name": "Gainsight", "description": "Customer success platform"},
    {"domain": "userpilot.com", "company_name": "Userpilot", "description": "Product growth and onboarding platform"},
    {"domain": "appcues.com", "company_name": "Appcues", "description": "User onboarding and product adoption"},
    {"domain": "userflow.com", "company_name": "Userflow", "description": "In-app onboarding and surveys"},
    {"domain": "chameleon.io", "company_name": "Chameleon", "description": "In-product UX guidance platform"},
    {"domain": "intro.js", "company_name": "Intro.js", "description": "Step-by-step guide and feature introduction"},
    {"domain": "stonly.com", "company_name": "Stonly", "description": "Interactive knowledge base and guides"},
    {"domain": "whatfix.com", "company_name": "Whatfix", "description": "Digital adoption platform"},
    {"domain": "walkme.com", "company_name": "WalkMe", "description": "Digital adoption platform"},
    {"domain": "userguiding.com", "company_name": "UserGuiding", "description": "No-code user onboarding"},
    {"domain": "userleap.com", "company_name": "Sprig (UserLeap)", "description": "User research platform"},
    {"domain": "sprig.com", "company_name": "Sprig", "description": "In-product user feedback and research"},
    {"domain": "typeform.com", "company_name": "Typeform", "description": "Interactive form and survey builder"},
    {"domain": "survicate.com", "company_name": "Survicate", "description": "Customer feedback software"},
    {"domain": "delighted.com", "company_name": "Delighted", "description": "NPS and customer satisfaction surveys"},
    {"domain": "medallia.com", "company_name": "Medallia", "description": "Customer and employee experience management"},
    {"domain": "qualtrics.com", "company_name": "Qualtrics", "description": "Experience management platform"},
    {"domain": "surveymonkey.com", "company_name": "SurveyMonkey", "description": "Online survey platform"},
    {"domain": "jotform.com", "company_name": "Jotform", "description": "Online form builder"},
    {"domain": "tally.so", "company_name": "Tally", "description": "Free form builder - Typeform alternative"},
    {"domain": "paperform.co", "company_name": "Paperform", "description": "Online forms with payments"},
    {"domain": "fillout.com", "company_name": "Fillout", "description": "Powerful form builder for Notion databases"},
    {"domain": "involve.me", "company_name": "Involve.me", "description": "Interactive content and forms"},
    {"domain": "questionpro.com", "company_name": "QuestionPro", "description": "Online survey platform"},
    {"domain": "sogosurvey.com", "company_name": "SoGoSurvey", "description": "Customer and employee feedback"},
    {"domain": "wufoo.com", "company_name": "Wufoo", "description": "Online form builder"},
    {"domain": "cognito.forms", "company_name": "Cognito Forms", "description": "Form builder with workflows"},
    {"domain": "formstack.com", "company_name": "Formstack", "description": "Workflow automation and forms"},
    {"domain": "123formbuilder.com", "company_name": "123FormBuilder", "description": "Online form and survey builder"},
    {"domain": "woobox.com", "company_name": "Woobox", "description": "Promotions and contests platform"},
    {"domain": "gleam.io", "company_name": "Gleam.io", "description": "Marketing apps for contests and rewards"},
    {"domain": "vyper.io", "company_name": "Vyper", "description": "Viral giveaways and referral campaigns"},
    {"domain": "kickofflabs.com", "company_name": "KickoffLabs", "description": "Viral landing pages and referrals"},
    {"domain": "launchrock.com", "company_name": "Launchrock", "description": "Pre-launch landing pages"},
    {"domain": "carrd.co", "company_name": "Carrd", "description": "Simple one-page sites"},
    {"domain": "webflow.com", "company_name": "Webflow", "description": "No-code web design platform"},
    {"domain": "framer.com", "company_name": "Framer", "description": "Website builder for design teams"},
    {"domain": "squarespace.com", "company_name": "Squarespace", "description": "Website builder platform"},
    {"domain": "wix.com", "company_name": "Wix", "description": "Cloud-based web development platform"},
    {"domain": "duda.co", "company_name": "Duda", "description": "Professional website builder"},
    {"domain": "softr.io", "company_name": "Softr", "description": "No-code app builder from Airtable"},
    {"domain": "glide.us", "company_name": "Glide", "description": "No-code app builder from spreadsheets"},
    {"domain": "adalo.com", "company_name": "Adalo", "description": "No-code app builder"},
    {"domain": "bubble.io", "company_name": "Bubble", "description": "No-code development platform"},
    {"domain": "thunkable.com", "company_name": "Thunkable", "description": "No-code mobile app builder"},
    {"domain": "backendless.com", "company_name": "Backendless", "description": "No-code backend development platform"},
    {"domain": "stacker.app", "company_name": "Stacker", "description": "Client portals from spreadsheets"},
    {"domain": "tadabase.io", "company_name": "Tadabase", "description": "No-code database app builder"},
    {"domain": "knack.com", "company_name": "Knack", "description": "No-code database and app builder"},
    {"domain": "caspio.com", "company_name": "Caspio", "description": "No-code database application platform"},
    {"domain": "quickbase.com", "company_name": "Quickbase", "description": "No-code application development"},
    {"domain": "smartsheet.com", "company_name": "Smartsheet", "description": "Work management and automation"},
    {"domain": "monday.com", "company_name": "Monday.com", "description": "Work OS and project management"},
    {"domain": "asana.com", "company_name": "Asana", "description": "Project management and work tracking"},
    {"domain": "clickup.com", "company_name": "ClickUp", "description": "All-in-one productivity platform"},
    {"domain": "notion.so", "company_name": "Notion", "description": "Connected workspace for teams"},
    {"domain": "coda.io", "company_name": "Coda", "description": "All-in-one document editor"},
    {"domain": "airtable.com", "company_name": "Airtable", "description": "Spreadsheet-database hybrid"},
    {"domain": "linear.app", "company_name": "Linear", "description": "Project management for software teams"},
    {"domain": "height.app", "company_name": "Height", "description": "Autonomous project collaboration tool"},
    {"domain": "shortcut.com", "company_name": "Shortcut", "description": "Project management for software teams"},
    {"domain": "basecamp.com", "company_name": "Basecamp", "description": "Project management and team communication"},
    {"domain": "todoist.com", "company_name": "Todoist", "description": "Task manager and to-do lists"},
    {"domain": "ticktick.com", "company_name": "TickTick", "description": "Task management and calendar"},
    {"domain": "things.sh", "company_name": "Things", "description": "Task manager for Apple devices"},
    {"domain": "craft.do", "company_name": "Craft", "description": "Note-taking and document editor"},
    {"domain": "obsidian.md", "company_name": "Obsidian", "description": "Knowledge base and markdown editor"},
    {"domain": "roamresearch.com", "company_name": "Roam Research", "description": "Networked note-taking app"},
    {"domain": "workflowy.com", "company_name": "WorkFlowy", "description": "Nested list and note-taking tool"},
    {"domain": "dynalist.io", "company_name": "Dynalist", "description": "Outliner for notes and to-dos"},
    {"domain": "remnote.com", "company_name": "RemNote", "description": "Connected notes and spaced repetition"},
    {"domain": "reflect.app", "company_name": "Reflect", "description": "Note-taking linked to your thinking"},
    {"domain": "mem.ai", "company_name": "Mem", "description": "Self-organizing workspace"},
    {"domain": "anytype.io", "company_name": "Anytype", "description": "Local-first knowledge management"},
    {"domain": "capacities.io", "company_name": "Capacities", "description": "Studio for your ideas"},
    {"domain": "heptabase.com", "company_name": "Heptabase", "description": "Visual note-taking for learning"},
    {"domain": "relanote.com", "company_name": "Relanote", "description": "Note-taking with backlinks"},
    {"domain": "fibery.io", "company_name": "Fibery", "description": "Connected work management platform"},
    {"domain": "nuclino.com", "company_name": "Nuclino", "description": "Lightweight wiki and knowledge base"},
    {"domain": "slite.com", "company_name": "Slite", "description": "Async knowledge base for teams"},
    {"domain": "tettra.com", "company_name": "Tettra", "description": "Knowledge management for Slack teams"},
    {"domain": "guru.com", "company_name": "Guru", "description": "Knowledge management powered by AI"},
    {"domain": "document360.io", "company_name": "Document360", "description": "Knowledge base software"},
    {"domain": "helpjuice.com", "company_name": "Helpjuice", "description": "Knowledge base software"},
    {"domain": "zendesk.com", "company_name": "Zendesk", "description": "Customer service and engagement platform"},
    {"domain": "freshdesk.com", "company_name": "Freshdesk", "description": "Customer support software"},
    {"domain": "intercom.com", "company_name": "Intercom", "description": "Customer messaging platform"},
    {"domain": "drift.com", "company_name": "Drift", "description": "Conversational marketing platform"},
    {"domain": "hubspot.com", "company_name": "HubSpot", "description": "CRM and marketing platform"},
    {"domain": "pipedrive.com", "company_name": "Pipedrive", "description": "CRM for sales teams"},
    {"domain": "close.com", "company_name": "Close", "description": "CRM for inside sales"},
    {"domain": "copper.com", "company_name": "Copper", "description": "CRM for Google Workspace"},
    {"domain": "attio.com", "company_name": "Attio", "description": "Modern CRM built for growth"},
    {"domain": "folk.app", "company_name": "Folk", "description": "CRM for networks and relationships"},
    {"domain": "twentyhq.com", "company_name": "Twenty", "description": "Open source CRM alternative"},
    {"domain": "espocrm.com", "company_name": "EspoCRM", "description": "Open source CRM platform"},
    {"domain": "vtiger.com", "company_name": "Vtiger", "description": "CRM for small businesses"},
    {"domain": "bitrix24.com", "company_name": "Bitrix24", "description": "CRM and team collaboration"},
    {"domain": "zoho.com", "company_name": "Zoho CRM", "description": "CRM software for businesses"},
    {"domain": "capsulecrm.com", "company_name": "Capsule CRM", "description": "Simple CRM for businesses"},
    {"domain": "nimble.com", "company_name": "Nimble", "description": "Smart CRM for Office 365 and Google"},
    {"domain": "streak.com", "company_name": "Streak", "description": "CRM inside Gmail"},
    {"domain": "prosperworks.com", "company_name": "Copper (formerly ProsperWorks)", "description": "CRM for Google Apps"},
    {"domain": "nutshell.com", "company_name": "Nutshell", "description": "CRM and email marketing"},
    {"domain": "lessannoyingcrm.com", "company_name": "Less Annoying CRM", "description": "Simple CRM for small businesses"},
    {"domain": "onpipeline.com", "company_name": "OnPipeline", "description": "Visual sales pipeline management"},
    {"domain": "agilecrm.com", "company_name": "Agile CRM", "description": "Free CRM with marketing automation"},
    {"domain": "freshsales.io", "company_name": "Freshsales", "description": "CRM with built-in phone and email"},
    {"domain": "salesflare.com", "company_name": "Salesflare", "description": "Intelligent CRM for B2B startups"},
    {"domain": "teamleader.eu", "company_name": "Teamleader", "description": "CRM and project management combined"},
    {"domain": "insightly.com", "company_name": "Insightly", "description": "CRM and project management"},
    {"domain": "highrise.com", "company_name": "Highrise", "description": "Simple CRM and contact manager"},
    {"domain": "contactually.com", "company_name": "Contactually", "description": "Relationship-based CRM"},
    {"domain": "affinity.co", "company_name": "Affinity", "description": "Relationship intelligence platform"},
    {"domain": "clay.com", "company_name": "Clay", "description": "Data enrichment and automation for outbound"},
    {"domain": "apollo.io", "company_name": "Apollo.io", "description": "Sales engagement and intelligence"},
    {"domain": "outreach.io", "company_name": "Outreach", "description": "Sales execution platform"},
    {"domain": "salesloft.com", "company_name": "SalesLoft", "description": "Sales engagement platform"},
    {"domain": "gong.io", "company_name": "Gong", "description": "Revenue intelligence platform"},
    {"domain": "chorus.ai", "company_name": "Chorus.ai", "description": "Conversation intelligence platform"},
    {"domain": "clari.com", "company_name": "Clari", "description": "Revenue operations platform"},
    {"domain": "people.ai", "company_name": "People.ai", "description": "AI for revenue operations"},
    {"domain": "ebsta.com", "company_name": "Ebsta", "description": "Revenue intelligence for Salesforce"},
    {"domain": "troops.ai", "company_name": "Troops", "description": "Revenue intelligence for Slack"},
    {"domain": "avoma.com", "company_name": "Avoma", "description": "AI meeting assistant and conversation intelligence"},
    {"domain": "fireflies.ai", "company_name": "Fireflies.ai", "description": "AI meeting notes and conversation intelligence"},
    {"domain": "otter.ai", "company_name": "Otter.ai", "description": "AI meeting notes and transcription"},
    {"domain": "krisp.ai", "company_name": "Krisp", "description": "AI noise cancellation for calls"},
    {"domain": "loom.com", "company_name": "Loom", "description": "Video messaging for work"},
    {"domain": "vidyard.com", "company_name": "Vidyard", "description": "Video platform for business"},
    {"domain": "wistia.com", "company_name": "Wistia", "description": "Video hosting and analytics"},
    {"domain": "bunjil.app", "company_name": "Bunjil", "description": "Access control library for Node.js"},
    {"domain": "doppler.com", "company_name": "Doppler", "description": "Universal secrets manager"},
    {"domain": "infisical.com", "company_name": "Infisical", "description": "Open source secrets management platform"},
    {"domain": "vault.hashicorp.com", "company_name": "HashiCorp Vault", "description": "Secrets management"},
    {"domain": "envkey.com", "company_name": "EnvKey", "description": "Environment variable management"},
    {"domain": "dotenv.org", "company_name": "Dotenv", "description": "Secrets management for .env files"},
    {"domain": "flagsmith.com", "company_name": "Flagsmith", "description": "Feature flags and remote config"},
    {"domain": "launchdarkly.com", "company_name": "LaunchDarkly", "description": "Feature management platform"},
    {"domain": "statsig.com", "company_name": "Statsig", "description": "Feature gates and A/B testing platform"},
    {"domain": "split.io", "company_name": "Split", "description": "Feature delivery and experimentation"},
    {"domain": "optimizely.com", "company_name": "Optimizely", "description": "Digital experience platform"},
    {"domain": "vwo.com", "company_name": "VWO", "description": "A/B testing and conversion optimization"},
    {"domain": "conductrics.com", "company_name": "Conductrics", "description": "A/B testing and optimization"},
    {"domain": "kameleoon.com", "company_name": "Kameleoon", "description": "AI-powered experimentation"},
    {"domain": "ab180.co", "company_name": "Airbridge", "description": "Mobile measurement and analytics"},
    {"domain": "appsflyer.com", "company_name": "AppsFlyer", "description": "Mobile attribution and marketing analytics"},
    {"domain": "adjust.com", "company_name": "Adjust", "description": "Mobile measurement and analytics"},
    {"domain": "branch.io", "company_name": "Branch", "description": "Mobile linking and measurement"},
    {"domain": "kochava.com", "company_name": "Kochava", "description": "Unified audience platform"},
    {"domain": "singular.net", "company_name": "Singular", "description": "Marketing attribution analytics"},
    {"domain": "northbeam.io", "company_name": "Northbeam", "description": "Multi-touch attribution for ecommerce"},
    {"domain": "triple-whale.com", "company_name": "Triple Whale", "description": "eCommerce analytics and attribution"},
    {"domain": "rockerbox.com", "company_name": "Rockerbox", "description": "Marketing attribution platform"},
    {"domain": "hyros.com", "company_name": "Hyros", "description": "Ad tracking and attribution"},
    {"domain": "wicked-reports.com", "company_name": "Wicked Reports", "description": "Marketing attribution software"},
    {"domain": "diverge.io", "company_name": "Diverge.io", "description": "Customer journey analytics"},
    {"domain": "segment.com", "company_name": "Segment", "description": "Customer data platform"},
    {"domain": "mparticle.com", "company_name": "mParticle", "description": "Customer data infrastructure"},
    {"domain": "lytics.com", "company_name": "Lytics", "description": "Customer data platform for marketing"},
    {"domain": "tealium.com", "company_name": "Tealium", "description": "Customer data orchestration"},
    {"domain": "blueshift.com", "company_name": "Blueshift", "description": "AI-powered customer engagement"},
    {"domain": "braze.com", "company_name": "Braze", "description": "Customer engagement platform"},
    {"domain": "klaviyo.com", "company_name": "Klaviyo", "description": "Email and SMS marketing for ecommerce"},
    {"domain": "sendgrid.com", "company_name": "SendGrid", "description": "Email delivery service"},
    {"domain": "mailchimp.com", "company_name": "Mailchimp", "description": "Email marketing and automation"},
    {"domain": "convertkit.com", "company_name": "ConvertKit", "description": "Email marketing for creators"},
    {"domain": "drip.com", "company_name": "Drip", "description": "Email marketing for ecommerce"},
    {"domain": "activecampaign.com", "company_name": "ActiveCampaign", "description": "Email marketing and CRM"},
    {"domain": "constantcontact.com", "company_name": "Constant Contact", "description": "Email and digital marketing"},
    {"domain": "getresponse.com", "company_name": "GetResponse", "description": "Email marketing platform"},
    {"domain": "aweber.com", "company_name": "AWeber", "description": "Email marketing for small businesses"},
    {"domain": "moosend.com", "company_name": "Moosend", "description": "Email marketing platform"},
    {"domain": "omnisend.com", "company_name": "Omnisend", "description": "Email and SMS marketing for ecommerce"},
    {"domain": "emarsys.com", "company_name": "Emarsys", "description": "Omnichannel customer engagement"},
    {"domain": "iterable.com", "company_name": "Iterable", "description": "Growth marketing platform"},
    {"domain": "customerio.com", "company_name": "Customer.io", "description": "Behavioral messaging platform"},
    {"domain": "vero.com", "company_name": "Vero", "description": "Customer messaging platform"},
    {"domain": "usermails.com", "company_name": "UserMailer", "description": "Transactional email service"},
    {"domain": "postmarkapp.com", "company_name": "Postmark", "description": "Transactional email service"},
    {"domain": "mailgun.com", "company_name": "Mailgun", "description": "Email API for developers"},
    {"domain": "sparkpost.com", "company_name": "SparkPost", "description": "Email delivery service"},
    {"domain": "sendinblue.com", "company_name": "Sendinblue", "description": "Email and SMS marketing"},
    {"domain": "mailjet.com", "company_name": "Mailjet", "description": "Email service provider"},
    {"domain": "elasticemail.com", "company_name": "Elastic Email", "description": "Email delivery service"},
    {"domain": "pepipost.com", "company_name": "Pepipost", "description": "Transactional email delivery"},
    {"domain": "resend.com", "company_name": "Resend", "description": "Email API for developers"},
    {"domain": "plunk.com", "company_name": "Plunk", "description": "Transactional email for developers"},
    {"domain": "loops.so", "company_name": "Loops", "description": "Email for SaaS companies"},
    {"domain": "buttondown.email", "company_name": "Buttondown", "description": "Simple newsletter tool"},
    {"domain": "beehiiv.com", "company_name": "Beehiiv", "description": "Newsletter platform for creators"},
    {"domain": "substack.com", "company_name": "Substack", "description": "Newsletter platform for writers"},
    {"domain": "ghost.io", "company_name": "Ghost Pro", "description": "Publishing platform for creators"},
    {"domain": "medium.com", "company_name": "Medium", "description": "Online publishing platform"},
    {"domain": "hashnode.com", "company_name": "Hashnode", "description": "Blogging platform for developers"},
    {"domain": "dev.to", "company_name": "DEV Community", "description": "Community for software developers"},
    {"domain": "deno.land", "company_name": "Deno", "description": "Secure JavaScript runtime"},
    {"domain": "bunjs.com", "company_name": "Bun", "description": "JavaScript runtime and toolkit"},
    {"domain": "rome.tools", "company_name": "Rome Tools", "description": "JavaScript toolchain"},
    {"domain": "astro.build", "company_name": "Astro", "description": "Web framework for content-driven websites"},
    {"domain": "solidjs.com", "company_name": "SolidJS", "description": "Declarative JavaScript UI library"},
    {"domain": "svelte.dev", "company_name": "Svelte", "description": "JavaScript UI framework"},
    {"domain": "qwik.builder.io", "company_name": "Qwik", "description": "Resumable JavaScript framework"},
    {"domain": "remix.run", "company_name": "Remix", "description": "Full stack web framework"},
    {"domain": "redwoodjs.com", "company_name": "RedwoodJS", "description": "Full-stack JavaScript framework"},
    {"domain": "blitzjs.com", "company_name": "Blitz.js", "description": "Full-stack React framework"},
    {"domain": "nuxt.com", "company_name": "Nuxt", "description": "Vue.js framework"},
    {"domain": "sveltekit.io", "company_name": "SvelteKit", "description": "Full-stack framework for Svelte"},
    {"domain": "quasar.dev", "company_name": "Quasar", "description": "Vue.js UI framework"},
    {"domain": "ionic.io", "company_name": "Ionic", "description": "Cross-platform mobile app framework"},
    {"domain": "capacitorjs.com", "company_name": "Capacitor", "description": "Native mobile runtime for web apps"},
    {"domain": "nativewind.dev", "company_name": "NativeWind", "description": "Tailwind CSS for React Native"},
    {"domain": "expo.dev", "company_name": "Expo", "description": "Platform for React Native apps"},
    {"domain": "tauri.app", "company_name": "Tauri", "description": "Desktop app framework"},
    {"domain": "wails.io", "company_name": "Wails", "description": "Go desktop apps with web frontend"},
    {"domain": "neutralino.js.org", "company_name": "Neutralino.js", "description": "Lightweight desktop app framework"},
    {"domain": "nwjs.io", "company_name": "NW.js", "description": "App runtime for desktop using web technologies"},
    {"domain": "electronjs.org", "company_name": "Electron", "description": "Desktop app framework for web technologies"},
]

all_companies = (
    [dict(c, source="awesome-oss-alternatives") for c in oss_alternatives]
    + [dict(c, source="awesome-selfhosted") for c in selfhosted_companies]
    + [dict(c, source="product-hunt-community") for c in ph_community_companies]
)

# Deduplicate by domain within this run
seen_in_run = set()
new_entries = []
already_exists = 0
new_count = 0

ts = datetime.now(timezone.utc).isoformat()

for c in all_companies:
    domain = normalize_domain(c.get("domain", ""))
    if not domain:
        continue
    if domain in seen_in_run:
        continue
    seen_in_run.add(domain)
    
    if is_new(domain):
        new_entries.append({
            "domain": domain,
            "company_name": c.get("company_name", ""),
            "source": c.get("source", "unknown"),
            "description": c.get("description", ""),
            "timestamp": ts,
        })
        new_count += 1
    else:
        already_exists += 1

print(f"\nResults:")
print(f"  Total candidates: {len(all_companies)}")
print(f"  Already in pipeline: {already_exists}")
print(f"  NEW companies: {new_count}")

if new_entries:
    append_to_queue(new_entries)
    print(f"  Written to queue: {new_count} entries")

print(f"\nSample new domains:")
for e in new_entries[:20]:
    print(f"  {e['domain']} — {e['company_name']} [{e['source']}]")

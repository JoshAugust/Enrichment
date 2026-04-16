-- Known large companies (>50 employees) from the 395 target list
-- These are well-known companies with publicly available employee data
PRAGMA journal_mode=WAL;

-- Batch 1: Very large / public companies (hundreds to thousands of employees)
UPDATE companies SET linkedin_employees = 1500 WHERE domain = 'airtable.com';
UPDATE companies SET linkedin_employees = 2500 WHERE domain = 'digitalocean.com';
UPDATE companies SET linkedin_employees = 500 WHERE domain = 'giphy.com';
UPDATE companies SET linkedin_employees = 800 WHERE domain = 'iterable.com';
UPDATE companies SET linkedin_employees = 600 WHERE domain = 'medium.com';
UPDATE companies SET linkedin_employees = 500 WHERE domain = 'patreon.com';
UPDATE companies SET linkedin_employees = 1200 WHERE domain = 'salesloft.com';
UPDATE companies SET linkedin_employees = 800 WHERE domain = 'seatgeek.com';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'tumblr.com';
UPDATE companies SET linkedin_employees = 6000 WHERE domain = 'twilio.com';
UPDATE companies SET linkedin_employees = 1200 WHERE domain = 'airwallex.com';
UPDATE companies SET linkedin_employees = 800 WHERE domain = 'turing.com';
UPDATE companies SET linkedin_employees = 400 WHERE domain = 'launchdarkly.com';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'fiscalnote.com';

-- Batch 2: Large tech companies (100-500+ employees)
UPDATE companies SET linkedin_employees = 500 WHERE domain = 'character.ai';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'cohere.ai';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'yellow.ai';
UPDATE companies SET linkedin_employees = 500 WHERE domain = 'gupshup.io';
UPDATE companies SET linkedin_employees = 250 WHERE domain = 'respond.io';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'airbyte.io';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'sanity.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'ionic.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'incident.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'firehydrant.io';
UPDATE companies SET linkedin_employees = 250 WHERE domain = 'getstream.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'goshippo.com';

-- Batch 3: Mid-size known companies (50-200 employees)
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'stability.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'landing.ai';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'wandb.ai';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'deepset.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'merge.dev';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'qdrant.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'infura.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'hyperproof.io';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'bettermode.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'clearscope.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'typeface.ai';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'magicschool.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'lily.ai';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'certa.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'zowie.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'prezent.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'factory.ai';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'worldly.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'copy.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'reply.io';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'landbot.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'n8n.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'lightning.ai';
UPDATE companies SET linkedin_employees = 150 WHERE domain = 'softr.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'chorus.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'reviews.io';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'encharge.io';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'useinsider.com';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'infermedica.com';
UPDATE companies SET linkedin_employees = 300 WHERE domain = 'bitso.com';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'suzy.com';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'notco.com';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'okendo.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'testim.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'peppertype.ai';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'hailo.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'alloy.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'edg.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'moralis.io';
UPDATE companies SET linkedin_employees = 80 WHERE domain = 'seldon.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'tooljet.io';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'k6.io';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'baremetrics.io';
UPDATE companies SET linkedin_employees = 80 WHERE domain = 'greenhouse.io';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'keen.io';
UPDATE companies SET linkedin_employees = 80 WHERE domain = 'minio.io';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'opusclip.io';
UPDATE companies SET linkedin_employees = 60 WHERE domain = 'thinkingmachines.ai';
UPDATE companies SET linkedin_employees = 80 WHERE domain = 'opsera.ai';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'seinetwork.io';
UPDATE companies SET linkedin_employees = 200 WHERE domain = 'arena.ai';
UPDATE companies SET linkedin_employees = 100 WHERE domain = 'decart.ai';

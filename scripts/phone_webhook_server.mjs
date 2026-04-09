import express from 'express';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const app = express();
app.use(express.json());

const RESULTS_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/pipeline/apollo_phone_results.json';

// Load existing results
let results = {};
if (existsSync(RESULTS_FILE)) {
  results = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
}

app.post('/webhook/apollo-phone', (req, res) => {
  const body = req.body || {};
  // Apollo can send data in different formats - handle both
  const people = body.people || (body.person ? [body.person] : []);
  
  // Also handle direct person object at top level
  if (people.length === 0 && body.first_name) {
    people.push(body);
  }

  for (const person of people) {
    const phones = person.phone_numbers || [];
    if (phones.length > 0) {
      const key = person.id || person.email || `${person.first_name}_${person.last_name}`;
      results[key] = {
        name: `${person.first_name} ${person.last_name}`,
        phones: phones.map(p => ({ 
          number: p.sanitized_number || p.raw_number, 
          type: p.type_cd, 
          confidence: p.confidence_cd 
        })),
        email: person.email,
        org: person.organization_name || person.organization?.name,
        domain: person.organization?.website_url || person.organization?.primary_domain,
        received_at: new Date().toISOString()
      };
      writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      console.log(`📱 Phone received: ${person.first_name} ${person.last_name} — ${phones[0].sanitized_number || phones[0].raw_number}`);
    }
  }
  console.log(`Total phones received: ${Object.keys(results).length}`);
  res.json({ status: 'ok' });
});

// Also handle the match endpoint webhook format
app.post('/webhook/apollo-match', (req, res) => {
  const body = req.body || {};
  const person = body.person || body;
  const phones = person.phone_numbers || [];
  
  if (phones.length > 0) {
    const key = person.id || person.email || `${person.first_name}_${person.last_name}`;
    results[key] = {
      name: `${person.first_name} ${person.last_name}`,
      phones: phones.map(p => ({ 
        number: p.sanitized_number || p.raw_number, 
        type: p.type_cd, 
        confidence: p.confidence_cd 
      })),
      email: person.email,
      org: person.organization_name || person.organization?.name,
      domain: person.organization?.website_url || person.organization?.primary_domain,
      received_at: new Date().toISOString()
    };
    writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    console.log(`📱 Match phone: ${person.first_name} ${person.last_name} — ${phones[0].sanitized_number || phones[0].raw_number}`);
  }
  console.log(`Total phones received: ${Object.keys(results).length}`);
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => res.json({ status: 'healthy', phones_received: Object.keys(results).length }));

// Catch-all to log unexpected requests
app.all('/{*path}', (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body).substring(0, 500));
  }
  res.json({ status: 'ok' });
});

const PORT = 9876;
app.listen(PORT, () => console.log(`Webhook server listening on port ${PORT}`));

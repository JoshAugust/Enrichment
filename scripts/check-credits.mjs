import { readFileSync } from "fs";

// Read the API key
const config = JSON.parse(readFileSync("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/orangeslice/config.json", "utf8"));
const apiKey = config.apiKey || config.key || Object.values(config)[0];

// Try the API endpoint for account/usage info
const endpoints = [
    "https://api.orangeslice.ai/v1/account",
    "https://api.orangeslice.ai/v1/usage",
    "https://api.orangeslice.ai/v1/credits",
    "https://api.orangeslice.ai/v1/me",
    "https://api.orangeslice.ai/account",
    "https://api.orangeslice.ai/usage",
];

for (const url of endpoints) {
    try {
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${apiKey}`, "x-api-key": apiKey }
        });
        const text = await res.text();
        console.log(`${url} [${res.status}]: ${text.slice(0, 300)}`);
    } catch (e) {
        console.log(`${url}: ${e.message}`);
    }
}

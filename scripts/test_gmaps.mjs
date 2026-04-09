import { services } from "orangeslice";

console.log("Testing Google Maps scrape...");
try {
  const result = await services.googleMaps.scrape({
    searchStringsArray: ["MATTER NEUROSCIENCE INC."],
    state: "CO",
    countryCode: "us",
    maxCrawledPlacesPerSearch: 1,
    language: "en",
  });
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  console.error("Full:", err);
}

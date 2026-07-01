import { logger } from "./logger";
const API_TOKEN = process.env.TXLINE_API_TOKEN!;

async function test() {
  // Try scores endpoint (might propagate faster)
  for (const endpoint of ["/api/scores?limit=1", "/api/odds?limit=1", "/api/fixtures?limit=1"]) {
    for (let i = 0; i < 2; i++) {
      try {
        const res = await fetch(`https://txline.txodds.com${endpoint}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` }
        });
        console.log(`${endpoint} Attempt ${i+1}: HTTP ${res.status}`);
        if (res.ok) {
          const data = await res.json();
          console.log("  Data:", JSON.stringify(data).slice(0, 200));
          break;
        } else if (res.status === 401) {
          console.log("  Token not ready yet");
        } else {
          const body = await res.text();
          console.log("  Body:", body.slice(0, 200));
        }
      } catch (e: any) {
        console.log(`${endpoint} Attempt ${i+1}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}
test();

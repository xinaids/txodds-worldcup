import { logger } from "./logger";

const API_TOKEN = process.env.TXLINE_API_TOKEN!;

async function test() {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch("https://txline.txodds.com/api/fixtures?limit=1", {
        headers: { Authorization: `Bearer ${API_TOKEN}` }
      });
      console.log(`Attempt ${i+1}: HTTP ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Fixtures:", JSON.stringify(data).slice(0, 300));
        break;
      } else {
        const body = await res.text();
        console.log("Body:", body.slice(0, 200));
      }
    } catch (e: any) {
      console.log(`Attempt ${i+1}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}
test();

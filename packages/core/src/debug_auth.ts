import axios from "axios";

async function main() {
  // 1. Get fresh JWT
  console.log("Getting JWT...");
  const authRes = await axios.post("https://txline.txodds.com/auth/guest/start");
  const jwt = authRes.data.token;
  console.log("JWT:", jwt.slice(0, 50) + "...");

  // 2. Test JWT on different endpoints
  for (const url of [
    "https://txline.txodds.com/api/fixtures?limit=1",
    "https://txline.txodds.com/api/odds?limit=1",
    "https://txline.txodds.com/api/scores?limit=1",
    "https://txline.txodds.com/api/leagues",
  ]) {
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${jwt}` },
        timeout: 5000,
      });
      console.log(`✅ ${url.split("/").pop()?.split("?")[0]}: HTTP ${res.status}`);
    } catch (e: any) {
      console.log(`❌ ${url.split("/").pop()?.split("?")[0]}: HTTP ${e.response?.status} - ${e.message?.slice(0, 50)}`);
    }
  }
}
main().catch(console.error);

import { db } from "../src/lib/db";
import { brands } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const brand = await db.query.brands.findFirst({ where: eq(brands.name, "Capitec Bank") });
  if (!brand) { console.log("brand missing"); return; }
  console.log("brand:", brand.id, brand.name);
  // Call the endpoint against the local dev server
  const res = await fetch(`http://localhost:3011/api/predictions/summary?brandId=${brand.id}`, {
    headers: { cookie: "" }, // will 401 unless logged in via cookie
  });
  console.log("status:", res.status);
  const body = await res.text();
  console.log(body.slice(0, 500));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });

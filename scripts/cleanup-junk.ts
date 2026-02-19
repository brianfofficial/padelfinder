/**
 * Deactivate junk/non-facility entries from the database.
 *
 * Usage:
 *   npx tsx scripts/cleanup-junk.ts
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

process.loadEnvFile(resolve(__dirname, "../.env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// IDs from audit - junk entries (not real facilities)
const JUNK_IDS = [
  // Court 1-8 (individual courts at a facility, not facilities themselves)
  "3c6be231-0e07-4230-b366-9c003b93ef79", // Court 1
  "3b8cb118-b027-49b4-b64f-87e61edaee60", // Court 2
  "c5a17fa9-ba23-43e3-9d71-e2cd20b0ada5", // Court 3
  "29531a78-1333-41bf-9c12-f146cf39f8ee", // Court 4
  "79bafcbc-abb7-42d5-9e6a-8c312b18b8ed", // Court 5
  "c32d623b-3635-498c-abff-5ea2eed94e3b", // Court 6
  "61bfb728-c791-440e-868f-d8ff8c49169f", // Court 7
  "ec3aba5a-7364-47a3-b35a-0e189e070986", // Court 8
  // Padel Court 1-6 (individual courts, not facilities)
  "f2e85778-06cd-48d3-9aa1-e013b24919f3", // Padel Court 1
  "bf6fb89f-99f3-4cf8-941d-7a2df6dec4bc", // Padel court 2
  "03ae2c5e-7727-460a-889d-e6cfa096ba46", // Padel Court 3
  "2c2b0b5f-8885-426b-a853-78e00863382e", // Padel court 4
  "76d18b3f-b016-4ca9-bba2-3ff01db8e3a0", // Padel Court 5
  "b4fd64ac-92d4-4934-a2e3-f85561e37167", // Padel Court 6
  // Non-facility entries
  "4438f1dd-aea3-417e-bf77-11fbc7729487", // Northeast Padel Court Construction (contractor)
  "d10720aa-69f6-4bf3-8f37-b9571c4ec709", // padel en san antonio texas (search query artifact)
  "5e3ac279-0535-4c6e-9527-b12852a33d4f", // Padel PIckleball (generic name, not a real club)
  "e125a777-e4fc-4f62-a01e-c365b1f70a08", // Prime Padel Shop (retail store, not a court)
];

async function main() {
  console.log(`Deactivating ${JUNK_IDS.length} junk entries...\n`);

  let deactivated = 0;

  for (const id of JUNK_IDS) {
    const { data, error } = await supabase
      .from("facilities")
      .update({ status: "inactive" })
      .eq("id", id)
      .select("name")
      .single();

    if (error) {
      console.log(`  Error deactivating ${id}: ${error.message}`);
    } else {
      console.log(`  Deactivated: "${data.name}"`);
      deactivated++;
    }
  }

  // Verify remaining count
  const { count } = await supabase
    .from("facilities")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  console.log(`\nDeactivated: ${deactivated}/${JUNK_IDS.length}`);
  console.log(`Remaining active facilities: ${count}`);
}

main().catch(console.error);

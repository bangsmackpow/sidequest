/**
 * Standalone Local Database Seeder Script
 * Calls the local worker's /api/v1/seed endpoint or executes directly.
 */
async function run() {
  console.log("Seeding database via local endpoint http://localhost:8787/api/v1/seed ...");
  try {
    const res = await fetch("http://localhost:8787/api/v1/seed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-User-Id": "user_curtis_admin",
        "X-Dev-Role": "admin",
        "X-Dev-Org-Id": "org_demo_sdvosb",
      },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Seeding successful:", data);
    } else {
      console.error("Seeding request returned status:", res.status, await res.text());
    }
  } catch (err: any) {
    console.log("Note: Start dev server with 'pnpm run dev' first, or use the in-app [Seed Demo Data] button.");
  }
}

run();

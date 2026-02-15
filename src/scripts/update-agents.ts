import Database from "better-sqlite3";

const sqlite = new Database("./mission-control.db");

// Update Bulma to Bulmaai
sqlite.prepare("UPDATE agents SET name = ?, emoji = ? WHERE id = ?")
  .run("Bulmaai", "🔧", "bulma");

// Update Saraai emoji
sqlite.prepare("UPDATE agents SET emoji = ? WHERE id = ?")
  .run("🏗️", "saraai");

console.log("✅ Updated: Bulma → Bulmaai, Saraai emoji → 🏗️");

sqlite.close();

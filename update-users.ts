import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updateUsers() {
  console.log("Updating users...");
  
  try {
    // Update admin password
    const hashedPassword = await hashPassword("POLA143pan@@ZaYN");
    console.log("Generated new password hash");
    
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, 1))
      .execute();
    console.log("Updated admin password");
    
    // Make all users admins
    await db.update(users)
      .set({ is_admin: true })
      .execute();
    console.log("Made all users admins");
    
    // Verify changes
    const updatedUsers = await db.select().from(users);
    console.log("Updated users:", updatedUsers.map(user => ({
      id: user.id,
      email: user.email,
      is_admin: user.is_admin
    })));
    
    console.log("User updates completed successfully");
  } catch (error) {
    console.error("Error updating users:", error);
  }
}

updateUsers().catch(console.error);
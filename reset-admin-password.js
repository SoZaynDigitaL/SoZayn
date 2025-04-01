import { scrypt } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';
const { Pool } = pg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = '1a33d47e95b2cc11d6336c2641a6b03e'; // Use the same salt to maintain the pattern
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const hashedPassword = await hashPassword('admin123');
    console.log('New hashed password:', hashedPassword);
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'admin@deliverconnect.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Password reset successful for user:', result.rows[0]);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
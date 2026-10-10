import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.join(process.cwd(), 'admin-auth-config.json');

export interface AdminCredentials {
  email: string;
  passwordHash: string; // Or plaintext for dev portal
  name: string;
  updatedAt: string;
}

export function getAdminCredentials(): AdminCredentials {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading admin credentials:', err);
  }

  return {
    email: process.env.ADMIN_USERNAME || 'counter365@tecstellar.com',
    passwordHash: process.env.ADMIN_PASSWORD || 'Counterproadmin@4321',
    name: 'Counter365 Super Admin',
    updatedAt: new Date().toISOString(),
  };
}

export function saveAdminCredentials(email: string, password: string,name: string = 'Counter365 Super Admin') {
  const creds: AdminCredentials = {
    email: email.trim().toLowerCase(),
    passwordHash: password,
    name,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving admin credentials:', err);
    return false;
  }
}

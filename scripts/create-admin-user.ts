// scripts/create-admin-user.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import bcrypt from 'bcrypt';
import { supabase } from '../lib/supabase';

async function createAdminUser(email: string, password: string) {
  try {
    console.log('Creating admin user...');
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    // Insert into Supabase
    const { data, error } = await supabase
      .from('admin_users')
      .insert([
        {
          email,
          password_hash: passwordHash,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating admin user:', error);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('ID:', data?.[0]?.id);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin user:', err);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: ts-node scripts/create-admin-user.ts <email> <password>');
  console.log('Example: ts-node scripts/create-admin-user.ts admin@example.com mypassword123');
  process.exit(1);
}

createAdminUser(email, password);

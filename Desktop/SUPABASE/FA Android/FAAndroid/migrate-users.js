const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase project URL and SERVICE ROLE KEY
const supabase = createClient('https://rzyrhnupwzppwiudfuxk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eXJobnVwd3pwcHdpdWRmdXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTg4MDk2OSwiZXhwIjoyMDY3NDU2OTY5fQ.s1VHuo13Lk2uTH35eqMBKE7bGfSoJ90r9QPcdjvUPYI');

// Paste your users array here
const users = [
  { email: 'bsit.christiantolentino@gmail.com', password: 'admin' }
  // Add more users here
];

async function migrateUsers() {
  for (const user of users) {
    if (!user.email || !user.password) continue;
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });
    if (error) {
      console.error(`Error creating user ${user.email}:`, error.message);
    } else {
      console.log(`Created user: ${user.email}`);
    }
  }
}

migrateUsers(); 
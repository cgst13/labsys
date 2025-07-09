const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase project URL and SERVICE ROLE KEY
const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SERVICE_ROLE_KEY');

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
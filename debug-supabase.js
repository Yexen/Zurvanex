// Simple Supabase connection test
// Run this with: node debug-supabase.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to add your environment variables here manually for testing
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('conversations').select('count');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Table structure check...');
    
    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('❌ Table structure error:', tableError);
    } else {
      console.log('✅ Table exists and accessible');
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
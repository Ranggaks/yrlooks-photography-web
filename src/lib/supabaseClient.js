import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://taddgyyxxnjtdmncfcvj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZGRneXl4eG5qdGRtbmNmY3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MTU2OTgsImV4cCI6MjEwODI5MTY5OH0.KUJAf8p1fxLjJMOuhoEpe-wvkwqXevQYEmlX1GDLWug';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
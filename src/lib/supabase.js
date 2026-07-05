import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ipfxjlaoawmhrihwhvnn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZnhqbGFvYXdtaHJpaHdodm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzEwNTUsImV4cCI6MjA5ODgwNzA1NX0.g17dCo0yYUqFDXBa1XkgO1S5gDztoS94UH_BtNx6vcc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

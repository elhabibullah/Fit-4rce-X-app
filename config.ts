// ========================================================================
//  Configuration des Clés API
// ========================================================================

// --- 🔑 Clés SUPABASE (Pour la connexion et les profils utilisateur) ---
export const SUPABASE_URL = 'https://yoursupabaseurl.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNabAE';


// --- 🔑 Clé STRIPE (Pour les abonnements et les paiements) ---
// La clé actuelle est une clé de test à des fins de démonstration.
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Hh2Y2L9o5f0g0g3eF7g5j6k4h3i2j1f0e9d8c7b6a5g4f3h2i1j0k9l8m7n6o5p4';


// --- 🔑 Autres Clés (Services backend) ---
// Les clés secrètes (par ex. pour Twilio, Resend) ne doivent JAMAIS être dans le code de l'application.
// L'application est déjà conçue pour gérer cela de manière sécurisée via un backend.
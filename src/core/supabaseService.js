// ut-game-jam/src/core/supabaseService.js

// <<< IMPORTANT: Replace with YOUR Supabase URL and Anon Key >>>
// Consider using environment variables for production builds if possible
const SUPABASE_URL = 'https://zvjwxbpnqdgutiwhdtlo.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2and4YnBucWRndXRpd2hkdGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODExNzYsImV4cCI6MjA1OTQ1NzE3Nn0.LP5Gb0XN_u4uiys9cv4gMzaWtX-g9YxL50BeEhFEjLY';

// Check if Supabase global exists (from CDN)
if (typeof supabase === 'undefined') {
  console.error("Supabase client not loaded. Ensure the CDN script is in index.html.");
}

let supabaseClient = null;
try {
    // REMOVE the redundant if/else check
    /* REMOVE:
    if (SUPABASE_URL !== 'https://zvjwxbpnqdgutiwhdtlo.supabase.co' && SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2and4YnBucWRndXRpd2hkdGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODExNzYsImV4cCI6MjA1OTQ1NzE3Nn0.LP5Gb0XN_u4uiys9cv4gMzaWtX-g9YxL50BeEhFEjLY') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized.");
    } else {
        console.warn("Supabase URL or Anon Key not provided. High scores will not be saved.");
    }
    */
    // <<< Directly initialize the client >>>
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized.");
    } else {
        console.error("Supabase object or createClient function not found. Check CDN script.")
    }
} catch (error) {
    console.error("Error initializing Supabase client:", error);
}


export class SupabaseService {
  
  async saveHighScore(playerName, score, gameTime, artifactsCollected) {
    if (!supabaseClient) {
      console.log("Supabase not initialized, skipping high score save.");
      return;
    }

    console.log(`Attempting to save high score: ${playerName} - ${score}`);
    try {
      // <<< Round the score before inserting >>>
      const scoreToSave = Math.floor(score);
      console.log(`Rounded score to save: ${scoreToSave}`); // Optional log

      const { data, error } = await supabaseClient
        .from('high_scores') // <<< Your table name here
        .insert([
          { 
            player_name: playerName, 
            score: scoreToSave, // <<< Use the rounded score
            game_time: gameTime, // Optional column
            artifacts_collected: artifactsCollected // Optional column
          }
        ]);

      if (error) {
        console.error('Error saving high score:', error);
        // Optionally inform the user via UI
      } else {
        console.log('High score saved successfully:', data);
        // Optionally inform the user via UI
      }
    } catch (error) {
        console.error('Supabase request failed:', error);
    }
  }

  async getHighScores(limit = 10) {
    if (!supabaseClient) {
      console.log("Supabase not initialized, cannot fetch high scores.");
      return [];
    }

    console.log(`Fetching top ${limit} high scores...`);
    try {
       const { data, error } = await supabaseClient
        .from('high_scores') // <<< Your table name here
        .select('player_name, score') // Select desired columns
        .order('score', { ascending: false }) // Order by score descending
        .limit(limit);

        if (error) {
            console.error('Error fetching high scores:', error);
            return [];
        }

        console.log('Fetched high scores:', data);
        return data || [];

    } catch (error) {
        console.error('Supabase request failed:', error);
        return [];
    }
  }
} 
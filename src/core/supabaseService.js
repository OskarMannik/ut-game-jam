// ut-game-jam/src/core/supabaseService.js

// <<< IMPORTANT: Use environment variables >>>
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase global exists (from CDN)
if (typeof supabase === 'undefined') {
  console.error("Supabase client not loaded. Ensure the CDN script is in index.html.");
}

let supabaseClient = null;
try {
    // <<< Check if the environment variables are loaded >>>
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase URL or Anon Key missing from environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
    } else if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase client initialized from environment variables.");
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

    console.log(`Attempting to save high score:`, {
      player_name: playerName,
      score: score,
      game_time: Math.floor(gameTime),
      artifacts_collected: artifactsCollected
    });

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
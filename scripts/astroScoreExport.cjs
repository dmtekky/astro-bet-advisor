// Import the original astro score module
const astroModule = require('./astroScore_2025-06-07.cjs');

// Function to calculate astro influence score for a single player
async function calculateAstroInfluenceScore(player, currentDateString) {
  try {
    // Create a mock players array with the single player
    const players = [{
      player_id: player.player_id,
      name: `${player.player_first_name || ''} ${player.player_last_name || ''}`.trim(),
      birth_date: player.player_birth_date,
      // Retain original fields for compatibility or other potential uses
      player_first_name: player.player_first_name,
      player_last_name: player.player_last_name
    }];
    
    // Convert currentDateString to a Date object before passing
    const currentDateObj = new Date(currentDateString);
    if (isNaN(currentDateObj.getTime())) {
      console.error(`Invalid currentDateString passed to calculateAstroInfluenceScore: ${currentDateString}`);
      return 50; // Default score on invalid date
    }

    // Call the original module's main function with the players array and Date object
    console.log(`[astroScoreExport] Calling astroModule.main with player: ${JSON.stringify(players)}, date: ${currentDateObj.toISOString()}`);
    const results = await astroModule.main(players, currentDateObj);
    console.log(`[astroScoreExport] Received results from astroModule.main: ${JSON.stringify(results)}`);
    
    // Find the result for our player
    const playerResult = results.find(r => String(r.player_id) === String(player.player_id)); // Ensure type consistency for comparison
    console.log(`[astroScoreExport] Found playerResult: ${JSON.stringify(playerResult)} for player_id: ${player.player_id}`);
    
    if (!playerResult || playerResult.astro_influence_score === undefined) {
      console.error(`No score generated for player ${player.player_id}`);
      return 50; // Default score if no score is generated
    }
    
    return playerResult.astro_influence_score;
    
  } catch (error) {
    console.error(`Error calculating score for player ${player.player_id}:`, error);
    return 50; // Default score on error
  }
}

// Export the function
module.exports = {
  calculateAstroInfluenceScore
};

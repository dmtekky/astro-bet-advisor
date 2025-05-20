import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateTeamStats() {
  try {
    console.log('Updating team stats...');
    
    // Run the team scraper
    console.log('Running team scraper...');
    const { stdout, stderr } = await execAsync('python -m scripts.scrape_teams_only');
    
    if (stderr) {
      console.error('Error running team scraper:', stderr);
      process.exit(1);
    }
    
    console.log('Team stats updated successfully!');
    console.log(stdout);
    process.exit(0);
  } catch (error) {
    console.error('Error updating team stats:', error);
    process.exit(1);
  }
}

updateTeamStats();

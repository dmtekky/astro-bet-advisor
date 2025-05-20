import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import TeamMatchingService from '../services/teamMatching.js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY
);

const teamMatching = new TeamMatchingService(supabase);

async function findTeams(query, sport = null) {
  let queryBuilder = supabase
    .from('teams')
    .select('*')
    .ilike('name', `%${query}%`);

  if (sport) {
    queryBuilder = queryBuilder.eq('sport', sport);
  }

  const { data, error } = await queryBuilder.limit(10);

  if (error) throw error;
  return data;
}

async function findAliases(query, source = null) {
  let queryBuilder = supabase
    .from('team_aliases')
    .select('*, team:teams(*)')
    .ilike('alias', `%${query}%`);

  if (source) {
    queryBuilder = queryBuilder.eq('source_id', source);
  }

  const { data, error } = await queryBuilder.limit(10);

  if (error) throw error;
  return data;
}

async function main() {
  await teamMatching.initialize();

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'Find team by name',
          'Find alias',
          'Create new alias',
          'Exit'
        ]
      }
    ]);

    if (action === 'Exit') break;

    try {
      switch (action) {
        case 'Find team by name': {
          const { query } = await inquirer.prompt([
            { type: 'input', name: 'query', message: 'Enter team name:' }
          ]);

          const teams = await findTeams(query);
          console.table(teams);
          break;
        }

        case 'Find alias': {
          const { query } = await inquirer.prompt([
            { type: 'input', name: 'query', message: 'Enter alias to search:' }
          ]);

          const aliases = await findAliases(query);
          console.table(aliases.map(a => ({
            alias: a.alias,
            team: a.team?.name,
            team_id: a.team_id,
            source: a.source_id,
            confidence: a.confidence,
            auto_generated: a.is_auto_generated
          })));
          break;
        }

        case 'Create new alias': {
          const { teamId, alias, source } = await inquirer.prompt([
            { type: 'input', name: 'teamId', message: 'Enter team ID:' },
            { type: 'input', name: 'alias', message: 'Enter alias:' },
            { type: 'input', name: 'source', message: 'Enter source (default: odds_api_v1):', default: 'odds_api_v1' }
          ]);

          const result = await teamMatching.createAlias(teamId, alias, 1.0, false, source);
          console.log('✅ Alias created:', result);
          break;
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

main().catch(console.error);

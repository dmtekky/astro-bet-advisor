import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SyncGames from '@/components/SyncGames';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Admin page for managing the application
 * Includes tools for syncing games and other admin functions
 */
export default function Admin() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Sports Data</CardTitle>
              <CardDescription>
                Fetch the latest NBA and MLB games from The Odds API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SyncGames />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>
                Current status of your Supabase database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">API Usage</span>
                  <span className="text-green-600 font-semibold">Weekly Sync (Low)</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Last Sync</span>
                  <span className="text-gray-600">Check cached_odds table</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Upcoming Games</span>
                  <span className="text-gray-600">Check schedules table</span>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>The weekly sync approach ensures we stay well under the 500 API calls/month limit while keeping game data current.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

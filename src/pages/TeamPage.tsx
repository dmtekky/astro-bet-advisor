import React from 'react';
import { useParams } from 'react-router-dom';

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Team: {teamId}</h1>
        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
          <p className="text-lg text-gray-300">
            Team details and statistics will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}

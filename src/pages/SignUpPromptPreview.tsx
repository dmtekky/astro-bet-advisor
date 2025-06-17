import React, { useState } from 'react';
import SignUpPrompt from '../components/auth/SignUpPrompt';
import { Button } from '../components/ui/button';

export default function SignUpPromptPreview() {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Sign Up Prompt Preview</h1>
        <p className="mb-6 text-slate-600">
          This page lets you preview the sign-up prompt that appears for guest users.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Preview Controls</h2>
          <div className="space-y-4">
            <Button 
              onClick={() => setShowPrompt(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Show Sign Up Prompt
            </Button>
            
            <div className="pt-4 border-t border-slate-200">
              <h3 className="font-medium mb-2">How it works:</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>For guest users, the prompt appears after 3 page views or 2 minutes on site</li>
                <li>Uses cookies to remember if the user has seen the prompt</li>
                <li>Mobile-responsive design with smooth animations</li>
                <li>Includes rotating feature highlights</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* The actual prompt component */}
        {showPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-md">
              <SignUpPrompt onClose={() => setShowPrompt(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

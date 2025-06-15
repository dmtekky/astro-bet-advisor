import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DailyAstroTipProps {
  tip?: string;
}

export const DailyAstroTip: React.FC<DailyAstroTipProps> = ({
  tip
}) => {
  return (
    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-amber-500" /> Daily Astro Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          {tip || 'General astrological conditions apply. Stay observant and adaptive.'}
        </p>
      </CardContent>
    </Card>
  );
};

export default DailyAstroTip;

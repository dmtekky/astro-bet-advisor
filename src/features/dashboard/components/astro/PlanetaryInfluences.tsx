import React from 'react';
import { Zap, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface PlanetaryInfluence {
  name: string;
  impact: number;
  description: string;
  icon?: React.ReactNode;
}

interface PlanetaryInfluencesProps {
  influences: PlanetaryInfluence[];
}

export const PlanetaryInfluences: React.FC<PlanetaryInfluencesProps> = ({
  influences = []
}) => {
  return (
    <Card className="border border-slate-200/50 bg-white/50 backdrop-blur-sm md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-blue-500" /> Key Planetary Influences
        </CardTitle>
        <CardDescription>Current significant astrological energies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {influences.length > 0 ? (
          influences.map((influence, index) => (
            <div key={`influence-${index}`} className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5">
                {influence.icon || <Activity className="h-5 w-5 text-slate-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{influence.name}</p>
                <p className="text-xs text-slate-500">{influence.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No specific planetary influences highlighted at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanetaryInfluences;

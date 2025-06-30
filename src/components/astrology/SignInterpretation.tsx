import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SignInterpretationProps {
  placement: string;
  sign: string;
  interpretation: string;
  icon?: string;
  colorClass?: string;
}

const SignInterpretation: React.FC<SignInterpretationProps> = ({
  placement,
  sign,
  interpretation,
  icon = '♈',
  colorClass = 'bg-blue-100 text-blue-800',
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className={`${colorClass} pb-2`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {placement} in {sign}
          </CardTitle>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-gray-600">{interpretation}</p>
      </CardContent>
    </Card>
  );
};

export default SignInterpretation;

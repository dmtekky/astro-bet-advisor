import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { UserProfile, BirthData } from '@types/profiles';

const UserBirthDataForm = lazy(() => import('@components/forms/UserBirthDataForm'));

interface BirthDataSectionProps {
  birthData: BirthData;
  onUpdateBirthData: (data: BirthData) => void;
}

const BirthDataSection: React.FC<BirthDataSectionProps> = ({ birthData, onUpdateBirthData }) => {
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = (updatedData: BirthData) => {
    setShowForm(false);
    onUpdateBirthData(updatedData);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Birth Data</CardTitle>
        <CardDescription>
          Your birth information is used to calculate your astrological charts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Date:</strong> {birthData.birthDate}</p>
          <p><strong>Time:</strong> {birthData.birthTime}</p>
          <p><strong>City:</strong> {birthData.birthCity}</p>
          <p><strong>Coordinates:</strong> {birthData.birthLatitude}, {birthData.birthLongitude}</p>
          <p><strong>Timezone:</strong> {birthData.birthTimeZone}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="mt-4">
          Edit Birth Data
        </Button>
        {showForm && (
          <Suspense fallback={<div>Loading form...</div>}>
            <UserBirthDataForm
              initialData={birthData}
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </Suspense>
        )}
      </CardContent>
    </Card>
  );
};


export default BirthDataSection;

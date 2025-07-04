import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/profiles';

const UserBirthDataForm = lazy(() => import('@/components/forms/UserBirthDataForm'));

import { BirthData } from '@/types/profiles';

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
            )}
            {majorSigns.moon && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">🌙 Moon in {majorSigns.moon}</Badge>
            )}
            {majorSigns.rising && (
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-rose-200">🌅 {majorSigns.rising} Rising</Badge>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-slate-900">Birth Data</h3>
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)}
              variant="outline" 
              className="text-slate-900 bg-white/90 hover:bg-blue-700 hover:text-white border-blue-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-200"
            >
              {user.birthData ? 'Edit Birth Data' : 'Add Birth Data'}
            </Button>
          )}
        </div>

        {user.birthData ? (
          <div className="text-sm text-slate-700">
            <p><strong>Date:</strong> {user.birthData.birthDate}</p>
            <p><strong>Time:</strong> {user.birthData.timeUnknown ? 'Unknown' : user.birthData.birthTime}</p>
            <p><strong>Location:</strong> {user.birthData.birthCity}</p>
            {user.birthData.birthLatitude && user.birthData.birthLongitude && (
              <p><strong>Coordinates:</strong> {user.birthData.birthLatitude.toFixed(4)}°N, {Math.abs(user.birthData.birthLongitude).toFixed(4)}°W</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No birth data provided yet. Add your birth information to unlock your astrological profile.</p>
        )}

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative mt-6 p-4 border rounded-lg shadow-inner bg-slate-50"
          >
            <Card>
              <CardContent>
                <Suspense fallback={<div>Loading form...</div>}>
                  <UserBirthDataForm 
                    onSuccess={handleFormSuccess} 
                    defaultValues={user.birthData}
                  />
                </Suspense>
              </CardContent>
            </Card>
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close form"
            >✕</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BirthDataSection;

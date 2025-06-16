import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <div className="container mx-auto p-4">
      <Alert>
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          Event details page is under construction. Event ID: {eventId}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EventPage; 
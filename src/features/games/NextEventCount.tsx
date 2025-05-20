import { useEffect, useState } from 'react';
import { fetchLatestAstrologicalData } from '@/lib/supabase';

function getTimeRemaining(target: string) {
  const now = new Date();
  const eventTime = new Date(target);
  const diff = eventTime.getTime() - now.getTime();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

export default function NextEventCount() {
  const [nextTime, setNextTime] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    fetchLatestAstrologicalData().then(data => {
      setNextTime(data?.next_event_time ?? null);
    });
  }, []);

  useEffect(() => {
    if (!nextTime) return;
    setRemaining(getTimeRemaining(nextTime));
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(nextTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextTime]);

  if (!nextTime) return <div>Loading next event...</div>;
  if (!remaining) return <div>Event is occurring now!</div>;
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="font-bold mb-2">Next Event Count</h2>
      <div className="text-xl">
        {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
      </div>
    </div>
  );
}

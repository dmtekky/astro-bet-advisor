import React, { useState, useEffect } from 'react';

const NEXT_EVENT = {
  name: 'Mercury Retrograde Ends',
  date: '2023-12-06T23:00:00Z',
  description: 'Mercury will end its retrograde motion in Sagittarius',
};

function NextEvent() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function calculateTimeLeft() {
    const difference = new Date(NEXT_EVENT.date) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  const timerComponents = [];
  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) return;
    
    timerComponents.push(
      <div key={interval} className="flex flex-col items-center">
        <span className="text-2xl font-bold">{timeLeft[interval]}</span>
        <span className="text-xs text-gray-500 uppercase">{interval}</span>
      </div>
    );
  });

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
      <h2 className="text-xl font-bold mb-2">Next Astrological Event</h2>
      <p className="text-indigo-100 mb-4">{NEXT_EVENT.name}</p>
      <p className="text-sm text-indigo-100 mb-6">{NEXT_EVENT.description}</p>
      
      <div className="flex justify-between max-w-xs mx-auto">
        {timerComponents.length ? (
          timerComponents
        ) : (
          <span className="text-lg">Event in progress!</span>
        )}
      </div>
    </div>
  );
}

export default NextEvent;

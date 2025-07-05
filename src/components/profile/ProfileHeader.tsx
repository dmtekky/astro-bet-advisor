import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.js';
import { Badge } from '@/components/ui/badge.js';
import { UserProfile } from '@/types/profiles.js';

interface ProfileHeaderProps {
  user: UserProfile;
  majorSigns: { sun: string | null; moon: string | null; rising: string | null };
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, majorSigns }) => {
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  const signDetails = {
    sun: {
      icon: '☀️',
      colorClass: 'border-yellow-300',
    },
    moon: {
      icon: '🌙',
      colorClass: 'border-slate-300',
    },
    rising: {
      icon: '🌅',
      colorClass: 'border-rose-300',
    },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar || ''} alt={user.name || user.email} />
            <AvatarFallback>
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-medium">
              {user.name || user.email}
            </h3>
            <p className="text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Member since: {user.memberSince} | Last Login: {user.lastLogin}
            </p>
            <Badge
              variant={user.isPremium ? 'default' : 'outline'}
              className={`mt-2 ${user.isPremium ? 'bg-indigo-500 text-white' : 'text-indigo-500 border-indigo-500'}`}
            >
              {user.isPremium ? 'Premium Member' : 'Standard Member'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2 mt-4">
        {majorSigns.sun && (
          <Badge variant="outline" className={`flex items-center gap-1 ${signDetails.sun.colorClass}`}>
            {signDetails.sun.icon} Sun: {majorSigns.sun}
          </Badge>
        )}
        {majorSigns.moon && (
          <Badge variant="outline" className={`flex items-center gap-1 ${signDetails.moon.colorClass}`}>
            {signDetails.moon.icon} Moon: {majorSigns.moon}
          </Badge>
        )}
        {majorSigns.rising && (
          <Badge variant="outline" className={`flex items-center gap-1 ${signDetails.rising.colorClass}`}>
            {signDetails.rising.icon} Rising: {majorSigns.rising}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;

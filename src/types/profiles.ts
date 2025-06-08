export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  updated_at: string;
  created_at: string;
};

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>> & {
  updated_at?: string;
};

// src/utils/zodiacIllustrations.ts
import { ZodiacSign } from '../types/app.types';

export function getZodiacIllustration(sign: ZodiacSign | string | undefined): string {
  if (!sign) return '/illustrations/zodiac/placeholder.svg'; // Default placeholder
  // Ensure sign is a string and lowercase for path consistency
  const signName = typeof sign === 'string' ? sign.toLowerCase() : sign;
  return `/illustrations/zodiac/${signName}.svg`;
}

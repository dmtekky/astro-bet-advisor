// Team colors utility
export const getTeamColorStyles = (team: any) => {
  const primaryColor = team?.primary_color || '#1e40af';  // Default to a blue
  const secondaryColor = team?.secondary_color || '#60a5fa';

  return {
    primary: primaryColor,
    secondary: secondaryColor,
    gradientBg: `linear-gradient(to bottom, ${primaryColor}10, #f8fafc)`,
    highlight: `${primaryColor}33`, // 20% opacity version of primary color
  };
};

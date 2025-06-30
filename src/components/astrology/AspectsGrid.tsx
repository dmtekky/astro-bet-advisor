import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define types for aspects and interpretations
interface Aspect {
  aspect_type: string;
  planet1: string;
  planet2: string;
  orb: number;
  applying?: boolean;
}

interface AspectInterpretations {
  [key: string]: {
    [key: string]: string;
  };
}

interface AspectsGridProps {
  aspects: Aspect[];
  interpretations?: AspectInterpretations;
}

// Map of aspect types to symbols and colors
const aspectSymbols: Record<string, { symbol: string; color: string }> = {
  conjunction: { symbol: '☌', color: 'text-blue-600' },
  opposition: { symbol: '☍', color: 'text-red-600' },
  trine: { symbol: '△', color: 'text-green-600' },
  square: { symbol: '□', color: 'text-orange-600' },
  sextile: { symbol: '⚹', color: 'text-purple-600' },
  quincunx: { symbol: '⚻', color: 'text-yellow-600' },
  semisextile: { symbol: '⚺', color: 'text-teal-600' },
  semisquare: { symbol: '∠', color: 'text-pink-600' },
  sesquiquadrate: { symbol: '⚼', color: 'text-indigo-600' },
};

// Map of planets to symbols
const planetSymbols: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
  north_node: '☊',
  south_node: '☋',
  chiron: '⚷',
  ascendant: 'Asc',
  midheaven: 'MC',
};

const AspectsGrid: React.FC<AspectsGridProps> = ({ aspects, interpretations = {} }) => {
  // Sort aspects by importance
  const sortedAspects = [...aspects].sort((a, b) => {
    // Prioritize major aspects
    const majorAspects = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    const aIsMajor = majorAspects.includes(a.aspect_type);
    const bIsMajor = majorAspects.includes(b.aspect_type);
    
    if (aIsMajor && !bIsMajor) return -1;
    if (!aIsMajor && bIsMajor) return 1;
    
    // Then sort by orb (closer orbs are more significant)
    return a.orb - b.orb;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planetary Aspects</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aspect</TableHead>
              <TableHead>Planets</TableHead>
              <TableHead>Orb</TableHead>
              <TableHead>Influence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAspects.map((aspect, index) => {
              const aspectInfo = aspectSymbols[aspect.aspect_type] || { symbol: '?', color: 'text-gray-600' };
              const planet1Symbol = planetSymbols[aspect.planet1] || aspect.planet1;
              const planet2Symbol = planetSymbols[aspect.planet2] || aspect.planet2;
              
              // Get interpretation if available
              const interpretation = interpretations?.[aspect.aspect_type]?.[`${aspect.planet1}_${aspect.planet2}`] || 
                                    interpretations?.[aspect.aspect_type]?.[`${aspect.planet2}_${aspect.planet1}`] || 
                                    '';
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    <span className={`text-lg font-bold ${aspectInfo.color}`}>
                      {aspectInfo.symbol}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {aspect.aspect_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{planet1Symbol}</span>
                      <span className="text-xs">-</span>
                      <span className="text-lg">{planet2Symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {aspect.orb.toFixed(1)}°
                    {aspect.applying !== undefined && (
                      <span className={aspect.applying ? "text-green-500 ml-1" : "text-red-500 ml-1"}>
                        {aspect.applying ? "↑" : "↓"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {interpretation ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              View
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            <p className="text-sm">{interpretation}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {sortedAspects.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No aspects available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AspectsGrid;

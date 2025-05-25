import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  console.log('[[[CLEAN TEST DEBUG]]] Clean API route hit!');
  return new Response(
    JSON.stringify({ message: 'Hello from clean Astro API route!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

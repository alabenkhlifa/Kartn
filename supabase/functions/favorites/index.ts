import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const conversationId = url.searchParams.get('conversation_id');
      if (!conversationId) {
        return new Response(JSON.stringify({ error: 'conversation_id required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id, car_id, created_at,
          cars (
            id, brand, model, variant, year,
            price_eur, price_tnd, fuel_type, engine_cc,
            mileage_km, body_type, country, url,
            fcr_tre_eligible, fcr_famille_eligible
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ favorites: data || [] }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const { conversation_id, car_id } = await req.json();
      if (!conversation_id || !car_id) {
        return new Response(JSON.stringify({ error: 'conversation_id and car_id required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('favorites')
        .upsert({ conversation_id, car_id }, { onConflict: 'conversation_id,car_id' })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ favorite: data }), {
        status: 201,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { conversation_id, car_id } = await req.json();
      if (!conversation_id || !car_id) {
        return new Response(JSON.stringify({ error: 'conversation_id and car_id required' }), {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('conversation_id', conversation_id)
        .eq('car_id', car_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Favorites error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
});

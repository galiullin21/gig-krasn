import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentEntry {
  title: string;
  url: string;
  file_type?: string;
}

// Get file type from URL
function getFileType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };
  return typeMap[ext] || 'application/octet-stream';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const documents = body.documents as DocumentEntry[];
    
    if (!documents || !Array.isArray(documents)) {
      return new Response(
        JSON.stringify({ success: false, error: 'documents array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${documents.length} documents...`);

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const entry of documents) {
      try {
        // Check if exists by URL
        const { data: existing } = await supabase
          .from('documents')
          .select('id')
          .eq('file_url', entry.url)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        const { error } = await supabase
          .from('documents')
          .insert({
            title: entry.title,
            file_url: entry.url,
            file_type: entry.file_type || getFileType(entry.url),
            description: null,
            category_id: null
          });

        if (error) {
          results.errors.push(`${entry.title.substring(0, 50)}: ${error.message}`);
        } else {
          results.inserted++;
        }
      } catch (e) {
        results.errors.push(`${entry.title.substring(0, 50)}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    console.log(`Import complete: ${results.inserted} inserted, ${results.skipped} skipped, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

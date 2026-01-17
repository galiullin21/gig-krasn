import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Parse Russian date string to ISO date
function parseRussianDate(dateStr: string, year: number): string {
  const months: Record<string, string> = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04',
    'мая': '05', 'июня': '06', 'июля': '07', 'августа': '08',
    'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };
  
  // Try format: "9 января 2025 г." or "9 января"
  const match = dateStr.match(/(\d{1,2})\s+(\S+)(?:\s+(\d{4}))?/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2].toLowerCase().replace('.', '');
    const parsedYear = match[3] ? parseInt(match[3]) : year;
    const month = months[monthName] || '01';
    return `${parsedYear}-${month}-${day}`;
  }
  
  // Try format: "dd.mm.yyyy"
  const dotMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1]}`;
  }
  
  return `${year}-01-01`;
}

// Parse archive entry from markdown line
function parseArchiveEntry(line: string, year: number): { issue_number: string; issue_date: string; pdf_url: string; year: number } | null {
  // Match patterns like: [Выпуск №1-2 от 9 января 2025 г.](url)
  // or: [№103 от 30 декабря 2014](url)
  const match = line.match(/\[(?:Выпуск\s+)?№?\s*([^\s]+)\s+от\s+([^\]]+)\]\((https?:\/\/[^\)]+)\)/i);
  if (match) {
    const issueNumber = match[1].replace(/^0+/, ''); // Remove leading zeros
    const dateStr = match[2].replace(' г.', '');
    const pdfUrl = match[3];
    const issueDate = parseRussianDate(dateStr, year);
    
    return {
      issue_number: issueNumber,
      issue_date: issueDate,
      pdf_url: pdfUrl,
      year
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { archiveData } = await req.json();
    
    if (!archiveData || !Array.isArray(archiveData)) {
      return new Response(
        JSON.stringify({ success: false, error: 'archiveData array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = {
      inserted: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const { year, content } of archiveData) {
      const lines = content.split('\n');
      
      for (const line of lines) {
        const entry = parseArchiveEntry(line, year);
        if (!entry) continue;

        // Check if exists
        const { data: existing } = await supabase
          .from('newspaper_archive')
          .select('id')
          .eq('issue_number', entry.issue_number)
          .eq('year', entry.year)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        const { error } = await supabase
          .from('newspaper_archive')
          .insert({
            issue_number: entry.issue_number,
            issue_date: entry.issue_date,
            pdf_url: entry.pdf_url,
            year: entry.year,
            cover_image: null
          });

        if (error) {
          results.errors.push(`Year ${year}, №${entry.issue_number}: ${error.message}`);
        } else {
          results.inserted++;
        }
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

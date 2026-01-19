import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ArchiveRecord {
  id: string;
  issue_number: string;
  year: number;
  pdf_url: string;
  cover_image: string | null;
  issue_date: string;
}

interface MigrationResult {
  id: string;
  issue_number: string;
  year: number;
  status: "success" | "error" | "skipped";
  oldUrl?: string;
  newUrl?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for options
    let limit = 10; // Process in batches to avoid timeout
    let offset = 0;
    let dryRun = false;

    try {
      const body = await req.json();
      limit = body.limit || 10;
      offset = body.offset || 0;
      dryRun = body.dryRun || false;
    } catch {
      // Use defaults if no body
    }

    console.log(`Starting migration: limit=${limit}, offset=${offset}, dryRun=${dryRun}`);

    // Fetch archives that still point to old site
    const { data: archives, error: fetchError } = await supabase
      .from("newspaper_archive")
      .select("*")
      .like("pdf_url", "%gig26.ru%")
      .order("year", { ascending: false })
      .order("issue_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error("Error fetching archives:", fetchError);
      throw new Error(`Failed to fetch archives: ${fetchError.message}`);
    }

    if (!archives || archives.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No more archives to migrate",
          total: 0,
          results: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${archives.length} archives to process`);

    const results: MigrationResult[] = [];

    for (const archive of archives as ArchiveRecord[]) {
      const result: MigrationResult = {
        id: archive.id,
        issue_number: archive.issue_number,
        year: archive.year,
        status: "success",
        oldUrl: archive.pdf_url,
      };

      try {
        // Skip if already migrated
        if (!archive.pdf_url.includes("gig26.ru")) {
          result.status = "skipped";
          result.error = "Already migrated";
          results.push(result);
          continue;
        }

        console.log(`Processing: ${archive.year}/${archive.issue_number} - ${archive.pdf_url}`);

        if (dryRun) {
          result.status = "skipped";
          result.error = "Dry run - would migrate";
          results.push(result);
          continue;
        }

        // Download PDF from old site
        const pdfResponse = await fetch(archive.pdf_url);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to download PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
        }

        const pdfBlob = await pdfResponse.blob();
        const pdfBuffer = await pdfBlob.arrayBuffer();
        
        console.log(`Downloaded PDF: ${pdfBlob.size} bytes`);

        // Generate new file path
        const fileName = `${archive.year}/gig_${archive.issue_number}.pdf`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("newspapers")
          .upload(fileName, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("newspapers")
          .getPublicUrl(fileName);

        const newUrl = publicUrlData.publicUrl;
        console.log(`Uploaded to: ${newUrl}`);

        // Update database record
        const { error: updateError } = await supabase
          .from("newspaper_archive")
          .update({ pdf_url: newUrl })
          .eq("id", archive.id);

        if (updateError) {
          throw new Error(`Failed to update record: ${updateError.message}`);
        }

        result.newUrl = newUrl;
        result.status = "success";
        console.log(`Successfully migrated: ${archive.year}/${archive.issue_number}`);

      } catch (error) {
        result.status = "error";
        result.error = error instanceof Error ? error.message : String(error);
        console.error(`Error migrating ${archive.id}:`, error);
      }

      results.push(result);
    }

    // Count remaining
    const { count: remaining } = await supabase
      .from("newspaper_archive")
      .select("*", { count: "exact", head: true })
      .like("pdf_url", "%gig26.ru%");

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    return new Response(
      JSON.stringify({
        message: `Processed ${archives.length} archives`,
        processed: archives.length,
        success: successCount,
        errors: errorCount,
        remaining: remaining || 0,
        nextOffset: offset + limit,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

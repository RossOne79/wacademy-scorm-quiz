import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const csvHeaders = [
  "package_id",
  "package_title",
  "package_version",
  "learner_id",
  "learner_name",
  "attempt_id",
  "video_start_timestamp",
  "video_end_timestamp",
  "first_event_at",
  "last_event_at",
  "completion_status",
  "success_status",
  "raw_score",
  "max_score",
  "scaled_score",
  "passed",
  "session_time_seconds",
  "max_watched_seconds",
  "last_location",
  "created_at",
  "updated_at",
];

const toCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
};

export const handler: Handler = async () => {
  const supabaseUrl = process.env.SCORM_REPORTING_SUPABASE_URL;
  const supabaseApiKey =
    process.env.SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SCORM_REPORTING_SUPABASE_API_KEY;

  if (!supabaseUrl || !supabaseApiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing Supabase configuration" }),
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseApiKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("scorm_attempts")
      .select("package_id, package_title, package_version, learner_id, learner_name, attempt_id, video_start_timestamp, video_end_timestamp, first_event_at, last_event_at, completion_status, success_status, raw_score, max_score, scaled_score, passed, session_time_seconds, max_watched_seconds, last_location, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const rows = (data || []).map((row) =>
      csvHeaders.map((header) => toCsvValue((row as Record<string, unknown>)[header])).join(",")
    );

    const csv = [csvHeaders.join(","), ...rows].join("\n");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="scorm-attempts-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
      body: csv,
    };
  } catch (error) {
    console.error("Failed to export SCORM attempts:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to export SCORM attempts" }),
    };
  }
};

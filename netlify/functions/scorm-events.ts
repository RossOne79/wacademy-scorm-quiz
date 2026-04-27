import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

type NullableNumber = number | null;

interface ScormEventPayload {
  eventType: string;
  eventTimestamp: string;
  packageId: string;
  packageTitle: string;
  packageVersion?: string;
  learnerId: string;
  learnerName?: string;
  attemptId: string;
  scormVersion?: string;
  lastLocation?: string;
  videoStartTimestamp?: string | null;
  videoEndTimestamp?: string | null;
  sessionTimeSeconds?: NullableNumber;
  maxWatchedSeconds?: NullableNumber;
  completionStatus?: string | null;
  successStatus?: string | null;
  rawScore?: NullableNumber;
  maxScore?: NullableNumber;
  scaledScore?: NullableNumber;
  passed?: boolean | null;
  suspendData?: Record<string, unknown>;
}

const parseNumber = (value: unknown): NullableNumber => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseTimestamp = (value: unknown): string | null => {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const supabaseUrl = process.env.SCORM_REPORTING_SUPABASE_URL;
  const supabaseApiKey =
    process.env.SCORM_REPORTING_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SCORM_REPORTING_SUPABASE_API_KEY;

  if (!supabaseUrl || !supabaseApiKey) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing Supabase configuration" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}") as ScormEventPayload;

    if (!body.packageId || !body.packageTitle || !body.attemptId || !body.eventType) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required SCORM event fields" }),
      };
    }

    const normalizedLearnerId =
      typeof body.learnerId === "string" && body.learnerId.trim().length > 0
        ? body.learnerId.trim()
        : "anonymous";
    const normalizedLearnerName =
      typeof body.learnerName === "string" && body.learnerName.trim().length > 0
        ? body.learnerName.trim()
        : "Anonymous learner";

    const supabase = createClient(supabaseUrl, supabaseApiKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const eventTimestamp = parseTimestamp(body.eventTimestamp) || new Date().toISOString();

    const attemptRow = {
      package_id: body.packageId,
      package_title: body.packageTitle,
      package_version: body.packageVersion || null,
      learner_id: normalizedLearnerId,
      learner_name: normalizedLearnerName,
      attempt_id: body.attemptId,
      video_start_timestamp: parseTimestamp(body.videoStartTimestamp),
      video_end_timestamp: parseTimestamp(body.videoEndTimestamp),
      first_event_at: eventTimestamp,
      last_event_at: eventTimestamp,
      completion_status: body.completionStatus || null,
      success_status: body.successStatus || null,
      raw_score: parseNumber(body.rawScore),
      max_score: parseNumber(body.maxScore),
      scaled_score: parseNumber(body.scaledScore),
      passed: typeof body.passed === "boolean" ? body.passed : null,
      session_time_seconds: parseNumber(body.sessionTimeSeconds),
      max_watched_seconds: parseNumber(body.maxWatchedSeconds),
      last_location: body.lastLocation || null,
      suspend_data_snapshot: body.suspendData || null,
      latest_payload: body,
    };

    const { error: upsertError } = await supabase
      .from("scorm_attempts")
      .upsert(attemptRow, {
        onConflict: "package_id,learner_id,attempt_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      throw upsertError;
    }

    const { error: mergeError } = await supabase.rpc("merge_scorm_attempt_event", {
      p_package_id: body.packageId,
      p_learner_id: normalizedLearnerId,
      p_attempt_id: body.attemptId,
      p_event_timestamp: eventTimestamp,
      p_video_start_timestamp: parseTimestamp(body.videoStartTimestamp),
      p_video_end_timestamp: parseTimestamp(body.videoEndTimestamp),
      p_completion_status: body.completionStatus || null,
      p_success_status: body.successStatus || null,
      p_raw_score: parseNumber(body.rawScore),
      p_max_score: parseNumber(body.maxScore),
      p_scaled_score: parseNumber(body.scaledScore),
      p_passed: typeof body.passed === "boolean" ? body.passed : null,
      p_session_time_seconds: parseNumber(body.sessionTimeSeconds),
      p_max_watched_seconds: parseNumber(body.maxWatchedSeconds),
      p_last_location: body.lastLocation || null,
      p_suspend_data_snapshot: body.suspendData || null,
      p_latest_payload: body,
    });

    if (mergeError) {
      throw mergeError;
    }

    const { error: eventInsertError } = await supabase.from("scorm_attempt_events").insert({
      package_id: body.packageId,
      learner_id: normalizedLearnerId,
      attempt_id: body.attemptId,
      event_type: body.eventType,
      event_timestamp: eventTimestamp,
      payload_json: body,
    });

    if (eventInsertError) {
      throw eventInsertError;
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error("Failed to persist SCORM event:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Failed to persist SCORM event" }),
    };
  }
};

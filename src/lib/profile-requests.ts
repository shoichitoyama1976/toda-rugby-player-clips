import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PLAYERS } from "@/data/players";
import {
  formatProposed,
  isProfileFieldKey,
  playerFieldValue,
  type ProfileFieldKey,
} from "@/data/profile-fields";
import { getSql } from "@/lib/db";
import { verifyProfileClaim } from "@/lib/verify-profile";

export type RequestStatus = "checked" | "approved" | "rejected" | "published";
export type CheckVerdict = "supports" | "conflicts" | "unclear";

export type ProfileRequest = {
  id: string;
  createdAt: string;
  playerSlug: string;
  playerName: string;
  fieldKey: ProfileFieldKey;
  currentValue: string;
  proposedValue: string;
  note: string;
  status: RequestStatus;
  checkVerdict: CheckVerdict | null;
  checkSummary: string | null;
  checkSources: Array<{ label: string; url: string; found: boolean }>;
  checkedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
};

type RequestRow = {
  id: string;
  created_at: string | Date;
  player_slug: string;
  player_name: string;
  field_key: string;
  current_value: string;
  proposed_value: string;
  note: string;
  status: string;
  check_verdict: string | null;
  check_summary: string | null;
  check_sources: string | null;
  checked_at: string | Date | null;
  reviewed_at: string | Date | null;
  published_at: string | Date | null;
};

function asIso(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function mapRequest(row: RequestRow): ProfileRequest {
  let sources: ProfileRequest["checkSources"] = [];
  if (row.check_sources) {
    try {
      sources = JSON.parse(row.check_sources) as ProfileRequest["checkSources"];
    } catch {
      sources = [];
    }
  }
  return {
    id: row.id,
    createdAt: asIso(row.created_at) ?? "",
    playerSlug: row.player_slug,
    playerName: row.player_name,
    fieldKey: isProfileFieldKey(row.field_key) ? row.field_key : "origin",
    currentValue: row.current_value,
    proposedValue: row.proposed_value,
    note: row.note,
    status: (row.status as RequestStatus) ?? "checked",
    checkVerdict: (row.check_verdict as CheckVerdict | null) ?? null,
    checkSummary: row.check_summary,
    checkSources: sources,
    checkedAt: asIso(row.checked_at),
    reviewedAt: asIso(row.reviewed_at),
    publishedAt: asIso(row.published_at),
  };
}

function reviewPin(): string {
  return process.env.TODA_REVIEW_PIN?.trim() || "";
}

export const submitProfileRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        playerSlug: z.string().min(1).max(80),
        fieldKey: z.string().min(1).max(40),
        proposedValue: z.string().min(1).max(200),
        note: z.string().max(200).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!isProfileFieldKey(data.fieldKey)) {
      return { ok: false as const, error: "その項目は扱えません。" };
    }
    const player = PLAYERS.find((item) => item.slug === data.playerSlug);
    if (!player || player.unlisted) {
      return { ok: false as const, error: "選手が見つかりません。" };
    }
    const proposed = data.proposedValue.trim();
    if (!proposed) return { ok: false as const, error: "新しい値を選んでください。" };
    const current = playerFieldValue(player, data.fieldKey);
    if (current === proposed || formatProposed(data.fieldKey, proposed) === current) {
      return { ok: false as const, error: "現在の表示と同じです。" };
    }

    const check = await verifyProfileClaim({
      playerSlug: player.slug,
      playerName: player.name,
      fieldKey: data.fieldKey,
      currentValue: current,
      proposedValue: proposed,
    });

    const id = crypto.randomUUID();
    const sql = await getSql();
    await sql`
      insert into profile_requests (
        id, player_slug, player_name, field_key, current_value, proposed_value,
        note, status, check_verdict, check_summary, check_sources, checked_at
      ) values (
        ${id}, ${player.slug}, ${player.name}, ${data.fieldKey}, ${current}, ${proposed},
        ${data.note?.trim() ?? ""}, ${"checked"}, ${check.verdict}, ${check.summary},
        ${JSON.stringify(check.sources)}, ${new Date().toISOString()}
      )
    `;

    return {
      ok: true as const,
      id,
      check,
      current,
      proposed: formatProposed(data.fieldKey, proposed),
    };
  });

export const listProfileRequests = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ pin: z.string().min(1).max(80) }).parse(data))
  .handler(async ({ data }) => {
    if (data.pin !== reviewPin()) return { ok: false as const, error: "合い言葉が違います。" };
    const sql = await getSql();
    const rows = await sql<RequestRow>`
      select * from profile_requests
      order by case status
        when 'checked' then 0
        when 'approved' then 1
        when 'published' then 2
        else 3
      end, created_at desc
      limit 80
    `;
    return { ok: true as const, requests: rows.map(mapRequest) };
  });

export const reviewProfileRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        pin: z.string().min(1).max(80),
        id: z.string().min(8).max(80),
        action: z.enum(["approve", "reject"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.pin !== reviewPin()) return { ok: false as const, error: "合い言葉が違います。" };
    const sql = await getSql();
    const rows = await sql<RequestRow>`select * from profile_requests where id = ${data.id} limit 1`;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "依頼が見つかりません。" };
    if (row.status !== "checked") return { ok: false as const, error: "この依頼はすでに処理済みです。" };

    const now = new Date().toISOString();
    if (data.action === "reject") {
      await sql`update profile_requests set status = ${"rejected"}, reviewed_at = ${now} where id = ${data.id}`;
      return { ok: true as const, status: "rejected" as const };
    }

    await sql`update profile_requests set status = ${"approved"}, reviewed_at = ${now} where id = ${data.id}`;
    return { ok: true as const, status: "approved" as const };
  });

export const publishProfileRequest = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        pin: z.string().min(1).max(80),
        id: z.string().min(8).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (data.pin !== reviewPin()) return { ok: false as const, error: "合い言葉が違います。" };
    const sql = await getSql();
    const rows = await sql<RequestRow>`select * from profile_requests where id = ${data.id} limit 1`;
    const row = rows[0];
    if (!row) return { ok: false as const, error: "依頼が見つかりません。" };
    if (row.status !== "approved") return { ok: false as const, error: "承認済みの依頼だけを更新済みにできます。" };

    const now = new Date().toISOString();
    await sql`update profile_requests set status = ${"published"}, published_at = ${now} where id = ${data.id}`;
    const { correctionXDraft } = await import("./correction-log.ts");
    const { loadRequestOrigin } = await import("./seo.ts");
    const origin = await loadRequestOrigin().catch(() => "");
    const mapped = mapRequest({ ...row, status: "published", published_at: now });
    return {
      ok: true as const,
      status: "published" as const,
      draft: correctionXDraft({
        playerName: mapped.playerName,
        slug: mapped.playerSlug,
        origin,
        fields: [
          {
            fieldKey: mapped.fieldKey,
            from: mapped.currentValue,
            to: mapped.proposedValue,
          },
        ],
      }),
    };
  });

export type PlayerNotice = {
  playerSlug: string;
  kind: "pending" | "updated";
  date: string;
  fields: string[];
};

export const loadPlayerNotices = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<RequestRow>`
      select * from profile_requests
      where status in (${"approved"}, ${"published"})
    `;
    const { PROFILE_FIELD_LABEL } = await import("@/data/profile-fields");
    const { withinMonths } = await import("./format.ts");
    const bySlug = new Map<string, RequestRow[]>();
    for (const row of rows) {
      const list = bySlug.get(row.player_slug) ?? [];
      list.push(row);
      bySlug.set(row.player_slug, list);
    }
    const notices: PlayerNotice[] = [];
    for (const [playerSlug, list] of bySlug) {
      const pending = list.filter(
        (row) =>
          row.status === "approved" &&
          withinMonths(asIso(row.reviewed_at) ?? asIso(row.created_at) ?? "", 3),
      );
      if (pending.length > 0) {
        const dates = pending
          .map((row) => asIso(row.reviewed_at) ?? asIso(row.created_at))
          .filter((value): value is string => Boolean(value))
          .sort();
        notices.push({
          playerSlug,
          kind: "pending",
          date: dates[0] ?? "",
          fields: [],
        });
        continue;
      }
      const published = list.filter(
        (row) => row.status === "published" && withinMonths(asIso(row.published_at) ?? "", 3),
      );
      if (published.length === 0) continue;
      const dates = published
        .map((row) => asIso(row.published_at))
        .filter((value): value is string => Boolean(value))
        .sort();
      const fields = [
        ...new Set(
          published.map((row) =>
            isProfileFieldKey(row.field_key) ? PROFILE_FIELD_LABEL[row.field_key] : row.field_key,
          ),
        ),
      ];
      notices.push({
        playerSlug,
        kind: "updated",
        date: dates[dates.length - 1] ?? "",
        fields,
      });
    }
    return notices;
  } catch {
    return [];
  }
});

export const loadPlayerOverrides = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{ player_slug: string; field_key: string; value: string }>`
    select player_slug, field_key, value from player_overrides
  `;
});

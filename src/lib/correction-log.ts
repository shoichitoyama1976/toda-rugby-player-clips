import { PROFILE_FIELD_LABEL, formatProposed, type ProfileFieldKey } from "@/data/profile-fields";
import { formatTokyoDate } from "@/lib/format";
import type { ProfileRequest } from "@/lib/profile-requests";

function statusLabel(status: ProfileRequest["status"]): string {
  if (status === "checked") return "未処理";
  if (status === "approved") return "承認（シート未反映）";
  if (status === "published") return "名簿を更新済み";
  return "見送り";
}

export function correctionMarkdown(requests: ProfileRequest[]): string {
  const lines = ["# 修正依頼一覧", ""];
  if (requests.length === 0) {
    lines.push("いま依頼はありません。", "");
    return lines.join("\n");
  }
  for (const item of requests) {
    const field = PROFILE_FIELD_LABEL[item.fieldKey] ?? item.fieldKey;
    const proposed = formatProposed(item.fieldKey, item.proposedValue);
    const received = item.createdAt ? formatTokyoDate(item.createdAt) : "";
    lines.push(`## ${received} ${item.playerName} · ${field}`);
    lines.push(`- 状態: ${statusLabel(item.status)}`);
    lines.push(`- 変更: ${item.currentValue || "（空）"} → ${proposed}`);
    if (item.note) lines.push(`- 根拠: ${item.note}`);
    if (item.reviewedAt) lines.push(`- 承認: ${formatTokyoDate(item.reviewedAt)}`);
    if (item.publishedAt) lines.push(`- 名簿更新: ${formatTokyoDate(item.publishedAt)}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function correctionXDraft(args: {
  playerName: string;
  slug: string;
  origin: string;
  fields: Array<{ fieldKey: ProfileFieldKey; from: string; to: string }>;
}): string {
  const page = args.origin ? `${args.origin.replace(/\/$/, "")}/players/${args.slug}` : `/players/${args.slug}`;
  const body = args.fields.map((field) => {
    const label = PROFILE_FIELD_LABEL[field.fieldKey] ?? field.fieldKey;
    const from = field.from || "（空）";
    const to = formatProposed(field.fieldKey, field.to);
    return `${label}: ${from} → ${to}`;
  });
  return [`【選手情報を更新しました】`, `${args.playerName} 選手`, ...body, page].join("\n");
}

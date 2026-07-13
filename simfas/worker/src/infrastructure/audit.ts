/**
 * Audit log writer — setiap perubahan data penting dicatat (PRD §7.5 / §8).
 */

import type { Env } from "../domain/env";
import { newId } from "./auth";

export async function writeAudit(
  env: Env,
  params: {
    userId: string;
    entity: string;
    entityId: string;
    action: string;
    oldValue?: unknown;
    newValue?: unknown;
  }
): Promise<void> {
  // Side-effect: 1 write D1 — tetap hemat (hanya metadata, bukan rekap penuh)
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, user_id, entity, entity_id, action, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      newId(),
      params.userId,
      params.entity,
      params.entityId,
      params.action,
      params.oldValue != null ? JSON.stringify(params.oldValue) : null,
      params.newValue != null ? JSON.stringify(params.newValue) : null
    )
    .run();
}

import "server-only";
import { readOneMoveConfig, databaseReady } from "./config";
import { DomainError } from "./errors";
import { createSupabaseRoundRepository } from "./supabase-repository";
import type { RoundRepository } from "./storage";

let repository: RoundRepository | null = null;

export function configuredRepository(): RoundRepository {
  if (repository) return repository;
  const config = readOneMoveConfig();
  if (!databaseReady(config)) throw new DomainError("unavailable", "Saved rounds are not configured.", 503);
  repository = createSupabaseRoundRepository(config);
  return repository;
}

export function resetRepositoryForTests(): void {
  repository = null;
}

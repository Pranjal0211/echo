export type DomainErrorCode = "version_conflict" | "invalid_transition" | "policy_blocked";

/** A business-rule violation. The API maps `code` to an HTTP status. */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

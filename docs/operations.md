# Operations runbook

## Release sequence

1. Build and test the exact commit in CI.
2. Back up the production database and verify the backup timestamp.
3. Run `npm run db:migrate` as a release job.
4. Deploy one application revision.
5. Smoke-test storefront, admin login, checkout health, and webhook health.
6. Monitor error rate, latency, failed payments, and notification failures.

Application requests must not run migrations. Failed migrations stop the release before new application instances receive traffic.

## Rollback

Application rollback uses the previous immutable build. Schema changes must remain backward compatible for at least one release. Destructive schema cleanup is performed only after the prior application version is no longer deployable.

## Backup and restore

- Encrypt daily database backups and retain copies in a separate account or region.
- Test restoration into an isolated environment at least monthly.
- Record recovery point and recovery time results.
- Back up provider configuration and media metadata; object storage requires its own versioning policy.

## Monitoring

Alert on elevated HTTP 5xx responses, authentication rate limiting, webhook signature failures, payment event backlog, negative/low stock anomalies, failed notifications, and backup failures. Logs use correlation IDs and redact credentials and personal contact fields.

## Incident safety

Disable checkout rather than accepting unverifiable payments. Never replay webhooks without their original provider event ID. Never modify order totals or stock directly; use audited domain operations.

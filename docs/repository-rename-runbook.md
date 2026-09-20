# Repository rename runbook

This milestone does not rename a repository. Use this only for a later,
separately approved change.

## Before the rename

1. Freeze merges and inventory release jobs, badges, package metadata, update
   feeds, submodules, deployment hooks, app-store URLs, OAuth callbacks, secrets,
   branch protection, Pages, and external consumers.
2. Confirm the target owner/name and collision status. Record the source and
   target URLs and the rollback owner.
3. Land product naming separately from durable client identifiers. Keep installed
   app bundle IDs, Android application IDs, keychain/app-group identifiers,
   credential formats, deep-link aliases, and update channels stable unless an
   explicit migration exists and has upgrade tests.
4. Preserve `LICENSE`, `NOTICE`, `LICENSING.md`, authorship, and upstream links.

## Rename window

1. Rename in GitHub settings only after approval. Do not delete or recreate the
   repository.
2. Update local remotes and first-party links. GitHub redirects are a bridge, not
   the final configuration.
3. Re-check Actions permissions, environments, webhooks, Pages, deployments,
   security settings, branch rules, Dependabot, release assets, and package
   publishing before unfreezing.
4. Run clean clones, install/build/test, release-update dry runs, deep links, and
   mobile/desktop upgrade tests from the last released version.

## Rollback and follow-up

If release/update, credentials, permissions, or consumers break, restore the old
name while the redirect is still controlled, then repair and repeat. Monitor
redirect traffic and external references. Retire aliases only with evidence
that supported clients and consumers have migrated.

### Release asset aliases for this product migration

Before a release is published, update the release workflow with a credential
that has workflow scope so it emits the canonical `Squadbots.*` assets and
byte-identical legacy `Softbots.*` aliases during the supported upgrade window.
The review branch intentionally does not mutate workflow files through a GitHub
OAuth token that lacks that scope.

# Squadbots customization coverage

This repository builds the Squadbots product on the OpenMaus runtime. OpenMaus is upstream provenance and a compatibility layer, not the user-facing product identity.

## Canonical Squadbots surfaces

| Surface | Canonical identity | Evidence in this repository |
| --- | --- | --- |
| Desktop app | Squadbots | Electron product name, protocol, icons, installer and release assets |
| Web/runtime UI | Squadbots | Page title, navigation, onboarding, settings, policy and approval copy |
| iOS/iPadOS | Squadbots | Target and scheme names, display names, assets, pairing UI, notifications and share extension |
| Android | Squadbots | Namespace, launcher label, assets, pairing UI and companion copy |
| Runtime and CLI | Squadbots | Package name, executable-facing copy, logs, service names and setup docs |
| Documentation | Squadbots | README, docs site, install/release links and contributor guidance |

## Retained compatibility aliases

These names remain intentionally machine-facing. Removing them would strand an installed app, stored credential, pairing route, update path or integration. They must not be used as product copy.

| Retained alias | Why it remains | Retirement gate |
| --- | --- | --- |
| `com.openmausbot.*` bundle/application IDs | Existing mobile installs, app groups and Keychain access depend on them | Signed migration with upgrade tests and store continuity |
| `group.com.openmausbot.shared` | iOS app, widgets and share extension share data and credentials through this group | Versioned data/keychain migration across all targets |
| `openmausbot://` | Previously generated pairing links must continue to open | Supported-client telemetry or an explicit end-of-support window |
| `_openmausbot._tcp` | Older desktop/mobile peers discover one another over Bonjour | Dual-version pairing coverage no longer includes older clients |
| `openmausbot-phone-credential-v1` / `OpenMausBot phone credential v1` | Credential derivation input is cryptographic compatibility data | Versioned credential rotation and paired-device migration |
| `OPENMAUS_*` environment variables and protocol markers | Existing deployments, harnesses and provider adapters configure the runtime with them | Deprecation period plus canonical replacements and fixture coverage |
| `aos.openmausbot_status.v1` and existing cache path | External bridge and stored status receipts use the schema/path | Versioned schema and cache migration with rollback |
| `OpenMausBot_Grok` GitHub repository/update feed | Repository rename and release cutover are outside this milestone | Separately approved repository rename runbook and updater dry run |
| OpenMaus names in `NOTICE`, `LICENSING.md`, vendor records and upstream links | Apache attribution, source provenance and third-party artifact integrity | Never remove required attribution; links change only with verified artifact provenance |

## Merge gate

Before merge, searches for `OpenMaus`, `openmaus` and `OPENMAUS` must classify every remaining match into the compatibility or provenance rows above. New user-visible product copy, product links, artwork titles, release instructions and policy text must say Squadbots. Desktop packaging, mobile pairing, docs builds, upgrade aliases, credential vectors and release metadata must pass without publishing or changing production.

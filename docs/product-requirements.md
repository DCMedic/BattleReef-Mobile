# BattleReef Mobile Product Requirements

Status: Approved baseline  
Foundation release: 0.1.0  
Last updated: 2026-09-02

## Product promise

BattleReef Mobile gives aquarium keepers one dependable place to understand and maintain their systems. It combines structured records, maintenance planning, trend interpretation, and timely guidance in a polished standalone mobile application.

The launch application does not discover, pair with, command, automate, or directly control external devices. This boundary keeps the software useful immediately and prevents premature coupling to unfinished BattleReef hardware.

## Primary users

1. New aquarium keepers who need guidance and repeatable routines.
2. Experienced reef and freshwater keepers who need reliable logs and trends.
3. Multi-tank hobbyists who need organized records across systems.
4. Future professional, research, and institutional users, addressed after the consumer product is stable.

## Basic and Pro boundary

| Capability | Basic | Pro |
|---|---:|---:|
| Aquarium profiles | 1 | Multiple |
| Manual parameter logging | Included | Included |
| Maintenance tasks | Included | Included |
| Livestock and equipment records | Included | Included |
| Local offline data | Included | Included |
| Standard parameter history | 90 days | Unlimited |
| Standard reminders | Included | Included |
| Advanced trends and correlations | — | Included |
| Custom parameter types and target ranges | — | Included |
| Exportable PDF/CSV reports | — | Included |
| Optional encrypted cloud backup and multi-device sync | — | Included |
| Household/team collaboration | — | Included |
| Voice, shortcut, and routine integrations | Limited shortcuts | Full supported integrations |
| Direct external-device control | Not offered | Not offered before BRMC production |

The current foundation temporarily permits multiple local aquariums so the data model and navigation can be validated during development. Entitlement enforcement begins in the subscriptions milestone and must not delete or strand development data.

## MVP scope

MVP is complete when a user can:

1. Complete onboarding and create one aquarium profile.
2. Record, edit, and delete manual water-test readings.
3. View parameter history, target ranges, and understandable status indicators.
4. Create recurring and one-time maintenance tasks with local notifications.
5. Maintain livestock and equipment records with notes and photos.
6. Record aquarium events and observations in a unified timeline.
7. Export and restore a local encrypted backup.
8. Use all core functions without an internet connection or account.
9. Understand the Basic/Pro boundary before purchase.
10. Use the app with VoiceOver/TalkBack, scalable text, sufficient contrast, and non-color status cues.

## Post-launch scope

- Advanced analytics, correlations, and anomaly guidance
- Optional accounts, encrypted cloud backup, and multi-device sync
- Household and team collaboration
- Siri Shortcuts/App Intents, Alexa skills, and Google ecosystem actions for information, logging, routines, and reminders
- Expanded professional and institutional workflows
- BRMC connectivity only after hardware enters active production
- Matter-compatible BRMC integration when the hardware and certification path are ready

## Explicit non-goals for MVP

- Controlling pumps, heaters, lights, dosers, feeders, outlets, or other hardware
- Generic HomeKit, Alexa, or Google device control
- Matter commissioning or fabric management
- Safety-critical automation or life-support decisions
- Medical, veterinary, or guaranteed livestock-survival claims
- Requiring a cloud account for core operation

## Initial navigation

| Area | Purpose | Foundation status |
|---|---|---|
| Home | Aquarium status, latest readings, open tasks, quick actions | Implemented |
| Logbook | Chronological water tests and observations | Water tests implemented |
| Tasks | Maintenance planning and completion | One-time local tasks implemented |
| More | Aquariums, plan, data, settings, integrations, and product information | Initial shell implemented |
| Add aquarium | Create a local aquarium profile | Implemented |
| Log water test | Save a manual parameter reading | Implemented |
| Add task | Save a maintenance task | Implemented |

## MVP quality gates

- No silent data loss across app restarts or schema upgrades.
- All write operations show a success or actionable failure state.
- Core screens function in airplane mode.
- No control-plane code or ambiguous control language ships in the standalone app.
- Accessibility and keyboard behavior are tested on representative iOS and Android devices.
- Crash-free sessions and local database migration success are release-blocking metrics.

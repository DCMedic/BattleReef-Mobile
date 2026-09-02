# BattleReef Mobile Privacy and Data Practices

## Beta position

BattleReef Mobile is designed local-first. Core aquarium records, maintenance data, inventory, photo history, analyses, reminders, backups, and restores operate without a BattleReef cloud account.

## Data stored on the device

Depending on user activity, BattleReef may store:

- aquarium identity and system volume
- water-test measurements and notes
- custom parameter targets
- maintenance tasks and completion history
- husbandry events
- livestock records
- equipment records and service history
- aquarium photographs and capture metadata
- locally generated advisory/trend results derived from those records

## Device permissions

Camera access is used only when the user chooses to capture an aquarium photo.

Photo-library access is used only when the user chooses to import a photo.

Notification permission is used for local care reminders.

Microphone permission is not requested by BattleReef's image-picker configuration.

## Network and tracking

The beta architecture does not require BattleReef cloud services for core use and does not intentionally implement advertising tracking or cross-app tracking.

Any future account, subscription, analytics, crash-reporting, or cloud-sync capability must receive a separate privacy review before enablement.

## User data control

Users can export a versioned BattleReef backup and a CSV water-test history. Full schema-v2 backups can include readable BattleReef-managed photo files.

Restore operations validate the archive before database modification and import restored data as a separate aquarium rather than overwriting existing aquariums.

## Release review requirement

This document describes the repository's intended beta behavior. Store privacy disclosures must be verified against the actual generated iOS/Android production binaries and any services enabled at distribution time.

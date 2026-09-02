# BattleReef Mobile Beta Release Checklist

## Candidate identity

- Product: BattleReef Mobile
- Marketing version: 0.9.0
- Initial beta build: 1
- iOS bundle identifier: com.battlereef.mobile
- Android package: com.battlereef.mobile
- URI scheme: battlereef
- Distribution target: TestFlight and Google Play internal testing before wider beta

## Repository-enforced checks

Before any beta build:

```bash
npm ci
npm run beta:check
```

The CI pipeline independently verifies:

- TypeScript
- Expo lint
- Expo Doctor
- public Expo configuration generation
- production web export

## EAS profiles

`preview`
- Internal distribution
- Android APK for direct tester installation
- iOS Release configuration

`production`
- Store-compatible iOS Release build
- Android App Bundle
- automatic native build-number/version-code increment

`submit.production`
- Android defaults to the Google Play internal track in draft state
- iOS intentionally contains no App Store Connect identifiers until the authorized account provides them

## Privacy and permissions

Current beta functionality is local-first and does not include advertising, analytics tracking, account telemetry, or cloud synchronization.

Declared user-facing permissions:

- Camera: aquarium photo capture
- Photo library: aquarium visual-history import
- Notifications: local aquarium-care reminders

Microphone access is explicitly disabled for image picking.

The iOS privacy manifest declares no tracking and no app-level collected-data categories. Third-party/native dependency privacy manifests remain the responsibility of their respective packages and must still be verified in the generated production archive before TestFlight submission.

## Required account-side setup

These values are deliberately not committed to the repository because they belong to authorized service accounts:

1. Link the project to the BattleReef Expo/EAS organization and persist the generated EAS project ID.
2. Confirm Apple Developer team ownership of `com.battlereef.mobile`.
3. Create the BattleReef app in App Store Connect and record its Apple/ASC app ID.
4. Create `com.battlereef.mobile` in Google Play Console.
5. Configure Google Play service-account credentials for automated submission only if desired.
6. Generate and review the first production iOS and Android binaries.
7. Submit iOS to TestFlight and Android to the Play internal testing track.
8. Review store-generated privacy/permission warnings before external testing.

## First beta acceptance criteria

The first distributed beta should not advance beyond internal testing until:

- clean install succeeds on supported iPhone/iPad and Android hardware
- SQLite migrations pass from a fresh install and from at least one previous Alpha database
- create/select multiple aquariums works
- readings, targets, trends, advisories, and husbandry timeline operate offline
- recurring tasks survive app relaunch and local reminders fire correctly
- photo capture/import and managed storage work
- full backup with photo media restores into a separate aquarium
- malformed backup is rejected without database changes
- VoiceOver/TalkBack can identify primary navigation and task completion state
- no external-device control path is exposed
- no unexpected network dependency blocks core operation

## Post-beta gates

Before public store release, complete:

- external privacy-policy publication
- support URL and customer-support contact
- App Store and Google Play screenshots
- store descriptions and keywords
- age/content ratings
- accessibility statement
- beta crash/defect review
- final security and dependency audit
- final Basic/Pro entitlement implementation and store billing configuration

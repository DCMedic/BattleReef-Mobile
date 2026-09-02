# BattleReef Mobile

BattleReef Mobile is an offline-first aquarium management application for iOS and Android. The initial product is intentionally standalone: it records aquarium data, helps owners maintain consistent care, and produces useful insights without controlling external hardware.

Direct device control is outside the launch product. A future BattleReef Marine Controller integration will be introduced only when BRMC enters active production and will be designed around Matter compatibility and an explicit capability boundary.

## Current foundation

- Expo SDK 57, React Native 0.86, React 19.2, and strict TypeScript
- Expo Router navigation for iOS, Android, and web development
- Offline SQLite storage with versioned migrations and foreign keys
- Multiple aquarium profiles
- Manual water-parameter logging
- Local maintenance tasks and completion tracking
- BattleReef-branded responsive dashboard
- No external-device discovery, pairing, commands, or control paths

## Local development

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run start
```

Useful checks:

```bash
npm run typecheck
npm run lint
npm run doctor
npm run export:web
```

## Product documentation

- [Product requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [Delivery roadmap](docs/roadmap.md)

## Status

Beta candidate `0.9.0` (build 1). Core MVP development is complete and the repository includes preview/production EAS build profiles, local-first backup/restore, release configuration validation, and pre-beta QA hardening.

Store distribution still requires the project to be linked to the authorized Expo/EAS account and the corresponding Apple Developer/App Store Connect and Google Play Console applications.

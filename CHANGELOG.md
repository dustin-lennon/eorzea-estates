# Changelog

All notable changes to Eorzea Estates are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.6.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.5.0...v1.6.0) (2026-03-11)

### ✨ Features

* add estate moderation with flag system and moderator access ([d0505c2](https://github.com/dustin-lennon/eorzea-estates/commit/d0505c2875548f6973ec9bd45c0b19410447bb31))

### 🐛 Bug Fixes

* replace hardcoded back link with router.back() on legal pages ([f058e3b](https://github.com/dustin-lennon/eorzea-estates/commit/f058e3b3c5d6148c48d75a5349b8a6d1a4efce1a)), closes [#80](https://github.com/dustin-lennon/eorzea-estates/issues/80)

## [1.5.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.4.0...v1.5.0) (2026-03-11)

### ✨ Features

* add admin panel with role system, moderator management, and legal CMS ([503c3ed](https://github.com/dustin-lennon/eorzea-estates/commit/503c3ed7a48522a6bd5271007a2310d57185a29a)), closes [#62](https://github.com/dustin-lennon/eorzea-estates/issues/62)
* add legal pages, settings section, and brand-link utility ([1683eb2](https://github.com/dustin-lennon/eorzea-estates/commit/1683eb29a01838d2ccec6904da5ea3de7a23c33f)), closes [#56](https://github.com/dustin-lennon/eorzea-estates/issues/56)

### 🐛 Bug Fixes

* fix rendering of sign out button when logged in as Admin ([0ff8f36](https://github.com/dustin-lennon/eorzea-estates/commit/0ff8f36fb9e6f3dfad8b77f41a676be41747df17))
* replace placeholder privacy email with real address ([bfaf273](https://github.com/dustin-lennon/eorzea-estates/commit/bfaf27351f1e512aeff177b42a030710f7606ee6)), closes [#60](https://github.com/dustin-lennon/eorzea-estates/issues/60)
* Resolve image loading error and clean up unwanted fields and display in user page ([2d30523](https://github.com/dustin-lennon/eorzea-estates/commit/2d3052371cf1814c4ae1715124a69aafc0a02d7b))
* update privacy policy for US compliance ([c228f0d](https://github.com/dustin-lennon/eorzea-estates/commit/c228f0d454b95686f744b43f12b1810a8aad940d)), closes [#58](https://github.com/dustin-lennon/eorzea-estates/issues/58)

## [1.4.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.3.0...v1.4.0) (2026-03-08)

### ✨ Features

* add character profile pages and link staff/dashboard to them ([ad4c010](https://github.com/dustin-lennon/eorzea-estates/commit/ad4c01060c3f5f62fdf140e34f502b4f4c2d3e24))
* add FC estate ownership transfer and cron verification ([c4dacc5](https://github.com/dustin-lennon/eorzea-estates/commit/c4dacc577dafc4c96fb39fdb138d8a735a66cc46)), closes [#50](https://github.com/dustin-lennon/eorzea-estates/issues/50)
* display app version in footer ([ca43a4b](https://github.com/dustin-lennon/eorzea-estates/commit/ca43a4bf4807dbdfcb8292363648c4946d6f8108)), closes [#52](https://github.com/dustin-lennon/eorzea-estates/issues/52)

### 🐛 Bug Fixes

* add @semantic-release/npm to update package.json version on release ([0a6cc8c](https://github.com/dustin-lennon/eorzea-estates/commit/0a6cc8c74ee728c5f5da60f144b1ecbabd9eeb91))
* lazily initialize Resend client to avoid build-time crash ([03a3f48](https://github.com/dustin-lennon/eorzea-estates/commit/03a3f48da0e10da0bac2259ab9070f401266c9f6))

## [1.3.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.2.0...v1.3.0) (2026-03-07)

### ✨ Features

* derive location from character and add room number fields ([d7197d5](https://github.com/dustin-lennon/eorzea-estates/commit/d7197d5be38603de18263f3757c7e8ba49941f32)), closes [#45](https://github.com/dustin-lennon/eorzea-estates/issues/45)

## [1.2.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.1.2...v1.2.0) (2026-03-07)

### ✨ Features

* add screenshots for steps 1-5 to how-to modal ([d71ff9d](https://github.com/dustin-lennon/eorzea-estates/commit/d71ff9d711b47ec2b11ee944f4e94f09f26cc134))
* add screenshots for steps 7-9 to how-to modal ([6a8a26f](https://github.com/dustin-lennon/eorzea-estates/commit/6a8a26f522c50448f28f650f1df5679c5b37d331))
* add site footer with legal, attribution, and support link ([8b16b77](https://github.com/dustin-lennon/eorzea-estates/commit/8b16b7710ed3d690e2995d67a18c1b625621b09e)), closes [#31](https://github.com/dustin-lennon/eorzea-estates/issues/31)
* add step 1 screenshot to how-to modal ([86f3704](https://github.com/dustin-lennon/eorzea-estates/commit/86f3704fce6a93ca82106ee225bcdfd65650fa9f))
* add step 10 screenshot to how-to modal ([94f60a2](https://github.com/dustin-lennon/eorzea-estates/commit/94f60a2ba71f2d553208fc2f098c548e1583226e))
* add step 2 screenshot to how-to modal ([07e5c3e](https://github.com/dustin-lennon/eorzea-estates/commit/07e5c3e29c7432c25b8a9ea74ce1e37930c3cd61))
* add step 3 screenshot to how-to modal ([aea60e0](https://github.com/dustin-lennon/eorzea-estates/commit/aea60e0620da29510e3f6e4f716fce9e6eb067bc))
* add step 4 screenshot to how-to modal ([bd0ce4d](https://github.com/dustin-lennon/eorzea-estates/commit/bd0ce4d97cbda04a688613f03225bf17f9f8c80e))
* add step 5 screenshot to how-to modal ([a82d0d8](https://github.com/dustin-lennon/eorzea-estates/commit/a82d0d8e982fa2a2979e250a74a889550f452505))
* add step 6 screenshot to how-to modal ([f74018e](https://github.com/dustin-lennon/eorzea-estates/commit/f74018e766059ae116fc358b278de2b6c38b1a48))
* group homeworld selector by data center in character verify form ([2269fb9](https://github.com/dustin-lennon/eorzea-estates/commit/2269fb95e6c4823c8c0219a331b679040d48e4c4))
* redesign character verification flow with avatar cards and UUID codes ([b8cd1b6](https://github.com/dustin-lennon/eorzea-estates/commit/b8cd1b69e884d5c025bb8bbeda0e4b79fe387e50))
* support multiple FFXIV characters per user with per-character housing limits ([8796598](https://github.com/dustin-lennon/eorzea-estates/commit/879659826b259910a936681910734e7f98c8ad7f)), closes [#33](https://github.com/dustin-lennon/eorzea-estates/issues/33)

### 🐛 Bug Fixes

* mark nodestone as server external package to avoid turbopack bundling issue ([c7970f8](https://github.com/dustin-lennon/eorzea-estates/commit/c7970f8f9fefbf2f55181551fb5e7b3793e1faa8))
* replace xivapi with nodestone for lodestone character lookup ([f99f597](https://github.com/dustin-lennon/eorzea-estates/commit/f99f5976980d1cabf2858a7d0073b01d88ed429b))
* resolve eslint errors in lodestone and prisma lib files ([1dc8e8e](https://github.com/dustin-lennon/eorzea-estates/commit/1dc8e8e90b921dfe2fb468d32338238c77aa93eb))
* update FFXIV copyright notice to match Square Enix materials usage policy ([a865de0](https://github.com/dustin-lennon/eorzea-estates/commit/a865de0829a3d6eb5a856f0a24512894d659c6db))

## [1.1.2](https://github.com/dustin-lennon/eorzea-estates/compare/v1.1.1...v1.1.2) (2026-03-07)

### 🐛 Bug Fixes

* commit CHANGELOG.md back to main after release ([6560383](https://github.com/dustin-lennon/eorzea-estates/commit/65603834f7bf2123f3e567bf3026a9c39d828e24))

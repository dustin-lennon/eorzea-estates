# Changelog

All notable changes to Eorzea Estates are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.24.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.23.1...v1.24.0) (2026-03-25)

### ✨ Features

* add comprehensive SEO for organic search discoverability ([4f9a7a6](https://github.com/dustin-lennon/eorzea-estates/commit/4f9a7a63e4a493f64f04614a737d8afbe10cc9ae)), closes [#217](https://github.com/dustin-lennon/eorzea-estates/issues/217)

## [1.23.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.23.0...v1.23.1) (2026-03-23)

### 🐛 Bug Fixes

* sync Discord avatar on sign-in and add broken image fallback ([ef7c16f](https://github.com/dustin-lennon/eorzea-estates/commit/ef7c16fc6184383e60f822f7350034c9cecc9b92)), closes [#209](https://github.com/dustin-lennon/eorzea-estates/issues/209)

## [1.23.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.22.0...v1.23.0) (2026-03-23)

### ✨ Features

* add Google OAuth and email/password auth with account linking ([eaefcad](https://github.com/dustin-lennon/eorzea-estates/commit/eaefcad0a8c83ae34ce7601414bfd29a11cf0429)), closes [#206](https://github.com/dustin-lennon/eorzea-estates/issues/206)
* gate profile behind verified FFXIV character and sync Lodestone avatar ([82db7f0](https://github.com/dustin-lennon/eorzea-estates/commit/82db7f0a31850e5fed2e4f3bbb32596a27d3d9c4))
* refresh session immediately after Lodestone verify; update admin users table ([0a09092](https://github.com/dustin-lennon/eorzea-estates/commit/0a09092adbfc5cdfc5895c24bda05d30d18f0d02))

### 🐛 Bug Fixes

* improve signup and auth UX ([9f4c3dc](https://github.com/dustin-lennon/eorzea-estates/commit/9f4c3dcf00b51a004eb7d796d1d1a59452885aaa))
* stamp emailVerified on OAuth sign-in for Google and Discord users ([281f195](https://github.com/dustin-lennon/eorzea-estates/commit/281f1955766a29500326ec72a5054f748b13b7d1))

## [1.22.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.21.1...v1.22.0) (2026-03-21)

### ✨ Features

* add designer commission inquiry and messaging platform ([7f95b02](https://github.com/dustin-lennon/eorzea-estates/commit/7f95b02ed47d31b474af366c916fedd450f46f1c)), closes [#203](https://github.com/dustin-lennon/eorzea-estates/issues/203)
* add FC membership note for venue commission inquiries ([3abbb6e](https://github.com/dustin-lennon/eorzea-estates/commit/3abbb6eaa6181e5af9a68fc9ccba995fce80df61))
* add online presence indicator to messaging ([22c036a](https://github.com/dustin-lennon/eorzea-estates/commit/22c036a02992ebddc3d951a0834c449cf03619e7))
* restrict commission inquiries to private estates and venues ([6ddb5bc](https://github.com/dustin-lennon/eorzea-estates/commit/6ddb5bc7810c524e0f6e7cc625356ef797bdc2a7))
* swap message composer keyboard shortcuts ([862623f](https://github.com/dustin-lennon/eorzea-estates/commit/862623fa671a9ff361aab4037064d9c4f3266465))

### 🐛 Bug Fixes

* lazily initialize VAPID details to prevent build failure when keys are absent ([209bff6](https://github.com/dustin-lennon/eorzea-estates/commit/209bff67230e92c882f725aaf5e7f6c0dc33f7ff))
* prevent scroll jump when reading message history and show last seen in inbox ([f36bce2](https://github.com/dustin-lennon/eorzea-estates/commit/f36bce21ce0a358a901896ce3f08b1723a40abde))
* replace Date.now() calls with useState(Date.now) to satisfy React Compiler purity rules ([18073bb](https://github.com/dustin-lennon/eorzea-estates/commit/18073bbfb24866dcf519fc8687991661c474ee0c))
* use useMemo for Date.now() in PresenceIndicator to satisfy React Compiler purity rules ([59a14c7](https://github.com/dustin-lennon/eorzea-estates/commit/59a14c70c79746d61fb265b088657e29283ea61f))

## [1.21.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.21.0...v1.21.1) (2026-03-20)

### 🐛 Bug Fixes

* compress verification screenshot client-side before upload ([4d98a54](https://github.com/dustin-lennon/eorzea-estates/commit/4d98a546c54374c02075106f512e47df2da6fe81))
* suppress hydration warning on comment timestamps ([60ebb7e](https://github.com/dustin-lennon/eorzea-estates/commit/60ebb7e0600dd8da6439b4c50480dbeba9e8f962))

## [1.21.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.20.1...v1.21.0) (2026-03-16)

### ✨ Features

* stale listing indicator with owner confirm-active flow ([667dba1](https://github.com/dustin-lennon/eorzea-estates/commit/667dba1b1113de52619860032442d5583d200fdf)), closes [#190](https://github.com/dustin-lennon/eorzea-estates/issues/190)

## [1.20.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.20.0...v1.20.1) (2026-03-16)

### 🐛 Bug Fixes

* prevent designer flag from bypassing verification on standard estate submission ([dd18839](https://github.com/dustin-lennon/eorzea-estates/commit/dd18839dd748e3039243816a9b8fa946ef5473d6)), closes [#187](https://github.com/dustin-lennon/eorzea-estates/issues/187)

## [1.20.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.19.0...v1.20.0) (2026-03-16)

### ✨ Features

* add subdivision field for apartments and derived subdivision for private estates ([b0779da](https://github.com/dustin-lennon/eorzea-estates/commit/b0779dac7277f7c9fa2fa0148cdacf79e1ac91e3)), closes [#184](https://github.com/dustin-lennon/eorzea-estates/issues/184)

## [1.19.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.5...v1.19.0) (2026-03-16)

### ✨ Features

* add last updated date to estate cards and updated-within filter ([0b440d4](https://github.com/dustin-lennon/eorzea-estates/commit/0b440d499a8cbe2775ced706778c33958fcd10d8)), closes [#172](https://github.com/dustin-lennon/eorzea-estates/issues/172)
* show last updated timestamp on estate cards across all pages ([afe56a8](https://github.com/dustin-lennon/eorzea-estates/commit/afe56a8b72e1fe6b1b31047c0d58b326cc846d95))

## [1.18.5](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.4...v1.18.5) (2026-03-16)

### 🐛 Bug Fixes

* convert remaining Promise.all prisma queries to \$transaction ([be1d045](https://github.com/dustin-lennon/eorzea-estates/commit/be1d045b5230479af9a3aec292371ac439f79039))

## [1.18.4](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.3...v1.18.4) (2026-03-16)

### 🐛 Bug Fixes

* bypass Vercel payload limit with presigned Supabase upload ([cafbaee](https://github.com/dustin-lennon/eorzea-estates/commit/cafbaee12e143c150ced39fed362c70044652ea3)), closes [#179](https://github.com/dustin-lennon/eorzea-estates/issues/179)

## [1.18.3](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.2...v1.18.3) (2026-03-15)

### 🐛 Bug Fixes

* use origin/ refs in sync-develop rev-list comparison ([f3ce12e](https://github.com/dustin-lennon/eorzea-estates/commit/f3ce12ef6398f32fd476ebbee829d3ba0fc12893))

## [1.18.2](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.1...v1.18.2) (2026-03-15)

### 🐛 Bug Fixes

* limit pg.Pool to max:1 to prevent serverless connection exhaustion ([a39c7b1](https://github.com/dustin-lennon/eorzea-estates/commit/a39c7b1c3d9409b885f0de420b5d3c0250687a87)), closes [#177](https://github.com/dustin-lennon/eorzea-estates/issues/177)

## [1.18.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.18.0...v1.18.1) (2026-03-15)

### 🐛 Bug Fixes

* replace Promise.all with prisma.$transaction to avoid MaxClientsInSessionMode ([2b77ecf](https://github.com/dustin-lennon/eorzea-estates/commit/2b77ecf226976350cb4dbfd902b1174aaffd735d))

## [1.18.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.17.0...v1.18.0) (2026-03-15)

### ✨ Features

* add admin sentry test page for verifying error capture ([ec9703b](https://github.com/dustin-lennon/eorzea-estates/commit/ec9703b341d75b1c9a597f9eb7f742c7c445ad5b))
* add designer attribution conflict resolution and profile nav link ([1e8d051](https://github.com/dustin-lennon/eorzea-estates/commit/1e8d051fea4407998db1056684b6725f38cf9878))
* add designer showcase features ([7620094](https://github.com/dustin-lennon/eorzea-estates/commit/762009488173feebdd2c2895775173a01a3cd331)), closes [#164](https://github.com/dustin-lennon/eorzea-estates/issues/164)
* designer-submitted estates with owner claim flow ([7b82140](https://github.com/dustin-lennon/eorzea-estates/commit/7b8214036fd96521c2b59fcc4f1eae1237207956)), closes [#166](https://github.com/dustin-lennon/eorzea-estates/issues/166)
* integrate Sentry for error monitoring and logging ([63f4042](https://github.com/dustin-lennon/eorzea-estates/commit/63f4042af083abc74fd0096dffeffe7749f50a10)), closes [#168](https://github.com/dustin-lennon/eorzea-estates/issues/168)

### 🐛 Bug Fixes

* correct Sentry Next.js App Router setup ([e1983ab](https://github.com/dustin-lennon/eorzea-estates/commit/e1983ab2c5fe365df7b782255ada84143b505983))
* make designer flag self-service via settings page ([891909e](https://github.com/dustin-lennon/eorzea-estates/commit/891909e66afb5f2cc7642e7b8fcc35fabae4f8fa))

## [1.17.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.6...v1.17.0) (2026-03-15)

### ✨ Features

* make admin user names links to their profiles ([c1356bf](https://github.com/dustin-lennon/eorzea-estates/commit/c1356bf58c4fb1f8c003ac7885b11b83f4b9cc5c)), closes [#161](https://github.com/dustin-lennon/eorzea-estates/issues/161)

## [1.16.6](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.5...v1.16.6) (2026-03-15)

### 🐛 Bug Fixes

* remove redundant verified text and move profile badges left of name ([b489887](https://github.com/dustin-lennon/eorzea-estates/commit/b4898877d55e119890e934a34a153d5a69640677))

## [1.16.5](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.4...v1.16.5) (2026-03-15)

### 🐛 Bug Fixes

* correct FC room verification how-to image paths ([ecfee88](https://github.com/dustin-lennon/eorzea-estates/commit/ecfee881b085d1c831fc26c41d680d57caef2c89))

## [1.16.4](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.3...v1.16.4) (2026-03-15)

### 🐛 Bug Fixes

* fetch OIDC token at runtime via getVercelOidcToken() ([ab2a280](https://github.com/dustin-lennon/eorzea-estates/commit/ab2a280730a07f791f089a3fd83ca53560c4f658))

### ⏪ Reverts

* remove AI_GATEWAY_API_KEY fallback — gateway only accepts OIDC ([c526f83](https://github.com/dustin-lennon/eorzea-estates/commit/c526f83f00197789ca8dfae24acd7d81b7e01f52))

## [1.16.3](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.2...v1.16.3) (2026-03-15)

### 🐛 Bug Fixes

* use AI_GATEWAY_API_KEY for Vercel AI Gateway auth fallback ([6f7e87f](https://github.com/dustin-lennon/eorzea-estates/commit/6f7e87fa772577a017fedc1fa759152c21d18fb6))

## [1.16.2](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.1...v1.16.2) (2026-03-15)

### 🐛 Bug Fixes

* log AI verification errors to aid production debugging ([a4fb1c8](https://github.com/dustin-lennon/eorzea-estates/commit/a4fb1c8653311122a3d584f5697016dbdae327cc))

## [1.16.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.16.0...v1.16.1) (2026-03-15)

### 🐛 Bug Fixes

* redirect to dashboard after editing an estate ([986b0e7](https://github.com/dustin-lennon/eorzea-estates/commit/986b0e7033dea4fa6fc6281a64ad98a46d23074f)), closes [#144](https://github.com/dustin-lennon/eorzea-estates/issues/144)

## [1.16.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.15.0...v1.16.0) (2026-03-15)

### ✨ Features

* increase estate image upload limit from 10 to 50 ([c46fd75](https://github.com/dustin-lennon/eorzea-estates/commit/c46fd75a7d63b07d72a0e5b64a71765e9443aaa8)), closes [#141](https://github.com/dustin-lennon/eorzea-estates/issues/141)

## [1.15.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.14.0...v1.15.0) (2026-03-15)

### ✨ Features

* add Discord icon link to footer ([8a0c68b](https://github.com/dustin-lennon/eorzea-estates/commit/8a0c68b7d33dfd399fcab40807a5ce63530e7d35)), closes [#138](https://github.com/dustin-lennon/eorzea-estates/issues/138)

## [1.14.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.13.0...v1.14.0) (2026-03-15)

### ✨ Features

* add contact & feedback section to settings ([6deda53](https://github.com/dustin-lennon/eorzea-estates/commit/6deda5352ac1bad33d4cca83e165617e01be7cfb))
* add delete account option to settings ([9dff643](https://github.com/dustin-lennon/eorzea-estates/commit/9dff643399c02119da4da95a4435b51dc5a5a90f)), closes [#136](https://github.com/dustin-lennon/eorzea-estates/issues/136)
* add estate ownership verified badge to icon guide ([548ff81](https://github.com/dustin-lennon/eorzea-estates/commit/548ff81d932ea430b62f076c4807b0f3c0f38029))
* add icon guide section to settings ([d069e5d](https://github.com/dustin-lennon/eorzea-estates/commit/d069e5d0bf92bee0264edec6809c8e7fe468a7a0))
* add support eorzea estates section to settings ([0f53e91](https://github.com/dustin-lennon/eorzea-estates/commit/0f53e91ab59bc9e0877e083c73f91b06040bc246))

## [1.13.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.12.0...v1.13.0) (2026-03-15)

### ✨ Features

* auto-grant Pathfinder badge when conditions are met ([8d85140](https://github.com/dustin-lennon/eorzea-estates/commit/8d85140624d6a9a236dfa45c5389667bad3c1a3c))
* Pathfinder badge for beta testers ([#134](https://github.com/dustin-lennon/eorzea-estates/issues/134)) ([94ad4de](https://github.com/dustin-lennon/eorzea-estates/commit/94ad4deeaa7fcb993df674e89af1606609329ae5))

## [1.12.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.11.0...v1.12.0) (2026-03-14)

### ✨ Features

* add changelog page to settings ([#132](https://github.com/dustin-lennon/eorzea-estates/issues/132)) ([2bd3845](https://github.com/dustin-lennon/eorzea-estates/commit/2bd38454cdee2b590119b7dc4924c9d4f6d603a1))

## [1.11.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.10.0...v1.11.0) (2026-03-14)

### ✨ Features

* estate ownership verification system ([#98](https://github.com/dustin-lennon/eorzea-estates/issues/98)) ([2055174](https://github.com/dustin-lennon/eorzea-estates/commit/205517449e2289333146be72b6d7772ddbd10c0d))

### 🐛 Bug Fixes

* liked estates show unavailable card instead of linking to 404 ([#129](https://github.com/dustin-lennon/eorzea-estates/issues/129)) ([be82862](https://github.com/dustin-lennon/eorzea-estates/commit/be82862a7f3e042bf4b9585e9984ed8a2c614d5b))

## [1.10.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.9.1...v1.10.0) (2026-03-14)

### ✨ Features

* add message book tag to predefined estate tags ([13592ff](https://github.com/dustin-lennon/eorzea-estates/commit/13592ff53b64fa7c0c499a4e79dc7b8bda3e45c0))
* add user data export on settings page ([d40e4e7](https://github.com/dustin-lennon/eorzea-estates/commit/d40e4e764a4a21c52aedacbef256a3aabb2775b8)), closes [#96](https://github.com/dustin-lennon/eorzea-estates/issues/96)
* extend FC estate type filtering to unverified characters ([d3b6b21](https://github.com/dustin-lennon/eorzea-estates/commit/d3b6b214d8ac3fed345c719961ba15ab31ad0af7))
* link comments to user profiles with role badges ([d5585d1](https://github.com/dustin-lennon/eorzea-estates/commit/d5585d1c04eac4539d3f4cd10095dfadf4347a7f))
* link comments to user profiles with role badges ([24ce482](https://github.com/dustin-lennon/eorzea-estates/commit/24ce482d79bf2d6a1c4e0204b141f025888a58ab))
* restrict FC estate types based on character FC status ([aa89b04](https://github.com/dustin-lennon/eorzea-estates/commit/aa89b04f0ff456fb90c31bb6f463af97277e67e3))

### 🐛 Bug Fixes

* align schema and code with actual DB column names for Image model ([e9e92cc](https://github.com/dustin-lennon/eorzea-estates/commit/e9e92cccc6aeafbe5e1cd7400105b848f35862ca))
* allow Supabase storage hostname for next/image ([0ceee23](https://github.com/dustin-lennon/eorzea-estates/commit/0ceee2347ccde50d24d5e1c579320038a56ed1a2))
* remove duplicate model definitions from schema and add FC enrichment to edit page ([4f50ab8](https://github.com/dustin-lennon/eorzea-estates/commit/4f50ab8ad41d6bc052e249549233650d9e23893b))
* use deleteMany to avoid P2025 when saving non-venue estate ([181a858](https://github.com/dustin-lennon/eorzea-estates/commit/181a858daf129b0c7aefa88f569507b38953ae53))

## [1.9.1](https://github.com/dustin-lennon/eorzea-estates/compare/v1.9.0...v1.9.1) (2026-03-12)

### 🐛 Bug Fixes

* revert email logo to eorzea-estates-navbar.svg ([eb860e9](https://github.com/dustin-lennon/eorzea-estates/commit/eb860e994641442905e3ce39ca90a8c39e3eb618))

## [1.9.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.8.0...v1.9.0) (2026-03-12)

### ✨ Features

* migrate image storage from Cloudinary to Supabase Storage ([6cdfffa](https://github.com/dustin-lennon/eorzea-estates/commit/6cdfffa1ff4e12f84e75bdf6f6029d4887545bea)), closes [#112](https://github.com/dustin-lennon/eorzea-estates/issues/112)
* move estate images in storage when location changes on edit ([0f8d9c5](https://github.com/dustin-lennon/eorzea-estates/commit/0f8d9c54d26411ac583a0a1873bb0b8dd4302e97))

### 🐛 Bug Fixes

* bypass maintenance mode check for /images paths in root layout ([35d0917](https://github.com/dustin-lennon/eorzea-estates/commit/35d09178ed14360519b0f77773f762a795e37d0b)), closes [#114](https://github.com/dustin-lennon/eorzea-estates/issues/114)
* correct prisma import path and use tsx runner in migration script ([7e2b95f](https://github.com/dustin-lennon/eorzea-estates/commit/7e2b95f1f2f303ea7a8dcd75e12eafa50441c15a))

## [1.8.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.7.0...v1.8.0) (2026-03-12)

### ✨ Features

* add estate edit page for estate owners ([e321ba6](https://github.com/dustin-lennon/eorzea-estates/commit/e321ba6741dacfbac0d6d7ee3a12529ea377ccf8)), closes [#93](https://github.com/dustin-lennon/eorzea-estates/issues/93)
* moderation emails, soft deletes, dispute email setting ([2280557](https://github.com/dustin-lennon/eorzea-estates/commit/2280557038ed0d0bdfcf737367922d17a42a2d75)), closes [#109](https://github.com/dustin-lennon/eorzea-estates/issues/109)

### 🐛 Bug Fixes

* clarify moderation action button labels ([6c1e79a](https://github.com/dustin-lennon/eorzea-estates/commit/6c1e79a16533af95532394b9f45029824291bcf4)), closes [#107](https://github.com/dustin-lennon/eorzea-estates/issues/107)
* commit generated prisma client to resolve moderation page error ([c943517](https://github.com/dustin-lennon/eorzea-estates/commit/c943517c683f1b1032464f90d36d1cbac5551c92)), closes [#105](https://github.com/dustin-lennon/eorzea-estates/issues/105)
* db maintenance mode not shown to first-time visitors ([aa37d7b](https://github.com/dustin-lennon/eorzea-estates/commit/aa37d7b91a2295612c36013aa9a02a6fef8ee4ed)), closes [#100](https://github.com/dustin-lennon/eorzea-estates/issues/100)
* hide View button for unpublished estates on dashboard ([51e086f](https://github.com/dustin-lennon/eorzea-estates/commit/51e086f3250d0543058763137c247f0fbfcc6da0)), closes [#91](https://github.com/dustin-lennon/eorzea-estates/issues/91)
* redirect was swallowed by try/catch in root layout ([25b238a](https://github.com/dustin-lennon/eorzea-estates/commit/25b238ab3f361be05dc036b50bf8d465cdb576ea))
* region and data center filters not updating URL correctly ([67fca22](https://github.com/dustin-lennon/eorzea-estates/commit/67fca2231333eab4e8ba0b1ebbe81ee5357f6038)), closes [#92](https://github.com/dustin-lennon/eorzea-estates/issues/92)
* resolve type error from session variable initialization ([ba53d94](https://github.com/dustin-lennon/eorzea-estates/commit/ba53d94095b00c92b3fa2750449a98b3adec5758))
* run sync-develop after release workflow completes ([3926de2](https://github.com/dustin-lennon/eorzea-estates/commit/3926de2dc13edd790fc246f05f85df688b10e798))
* use navbar logo image in moderation email header ([202d878](https://github.com/dustin-lennon/eorzea-estates/commit/202d878805cff9616d582a68dcdae2340f392d94))
* use PNG logo in email header instead of SVG ([a4c5a70](https://github.com/dustin-lennon/eorzea-estates/commit/a4c5a7032c4dee65c9e1c42426fa685319f0bb93))

## [1.7.0](https://github.com/dustin-lennon/eorzea-estates/compare/v1.6.0...v1.7.0) (2026-03-11)

### ✨ Features

* add maintenance mode with admin toggle and bypass ([2261524](https://github.com/dustin-lennon/eorzea-estates/commit/2261524a8ae2fc4a447aeb39a6f83086ce9c5329)), closes [#86](https://github.com/dustin-lennon/eorzea-estates/issues/86)

### 🐛 Bug Fixes

* skip maintenance db check gracefully when db is unavailable ([b5b3d89](https://github.com/dustin-lennon/eorzea-estates/commit/b5b3d89911eb611e0ee5520a3ef5bec399347dfe))

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

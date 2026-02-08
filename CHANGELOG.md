# Changelog

All notable changes to Dots and Boxes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Online multiplayer with friend codes
- Mobile app (iOS/Android)
- Achievement system
- Leaderboards
- Custom board sizes (up to 10x10)
- Tournament mode

---

## [1.0.0] - 2026-02-07

### Added
- ✅ Complete game logic with move validation
- ✅ Three AI difficulty levels (Easy, Medium, Hard)
- ✅ Advanced strategy detection (chains, loops, sacrifices)
- ✅ Classroom management system
  - Teacher dashboard
  - Student pairing
  - Real-time game monitoring
  - 6-digit class codes
- ✅ WebSocket real-time multiplayer
- ✅ Database persistence (PostgreSQL)
  - Game state saving
  - Move history for replay
  - User management
  - Classroom sessions
- ✅ JWT authentication with role-based access
  - Guest, Student, Teacher, Parent roles
  - Secure token management
- ✅ Comprehensive testing
  - 10 rule engine unit tests
  - 5 strategy unit tests
  - 8 bot simulation tests
  - API integration test framework
- ✅ Tutorial system design
  - Age 4-6 content
  - Grades 1-2 content
  - Grades 3-4 advanced strategy
- ✅ Analytics & dashboard queries
  - Event logging
  - Game statistics
  - User activity tracking
  - Classroom metrics
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Complete documentation
  - Developer README
  - UX/UI specifications
  - Tutorial content scripts
  - FAQ & Help docs

### Technical
- NestJS 11 backend
- PostgreSQL 15 database
- Prisma ORM 6
- Socket.IO for real-time communication
- Passport JWT authentication
- Jest testing framework

---

## [0.5.0] - 2026-01-XX (Beta)

### Added
- Initial game prototype
- Basic multiplayer support
- Simple AI opponent

### Fixed
- Various bug fixes from alpha testing

---

## [0.1.0] - 2025-12-XX (Alpha)

### Added
- First playable version
- Core game mechanics
- Local 2-player mode

---

## Release Process

### Version Number Format
`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, major features
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, minor improvements

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run all tests (`npm test`)
- [ ] Build production bundle (`npm run build`)
- [ ] Tag release in git (`git tag v1.0.0`)
- [ ] Deploy to production
- [ ] Announce release

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on submitting changes.

## Support

For issues or questions:
- 📧 Email: support@dotsandboxes.example.com
- 🐛 Bugs: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Join our community](https://discord.gg/your-invite)

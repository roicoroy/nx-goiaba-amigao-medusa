# Changelog

## [1.4.1] - 2025-09-19

### Fixed
- **CRITICAL FIX**: Removed `window.location.reload()` from status update mutation that was causing full page refresh
- Implemented optimistic updates for instant status change feedback
- Status updates now use local state management with error rollback

### Changed
- Status updates now provide instant visual feedback without page refresh
- Added proper error handling with automatic rollback on failed updates

## [1.4.0] - 2025-09-19

### Changed
- Status is now clickable in the Status column - click to cycle through approved/pending/flagged
- Removed redundant status display from Actions column
- Actions column now only shows view details and add response buttons
- Fixed page refresh issue when changing status - now uses proper mutation callbacks

### Removed
- Removed StatusToggle component as it's no longer needed
- Simplified status management to single-click cycling

### Fixed
- Fixed unnecessary page refresh when updating review status
- Status updates now use proper React Query mutations for seamless updates

## [1.3.1] - 2025-09-19

### Changed
- Removed redundant status column from default table view
- Status is now only shown in the actions column to avoid duplication

## [1.3.0] - 2025-09-19

### Added
- New StatusToggle component for intuitive status switching
- Inline button group for switching between Approved/Pending/Flagged states
- Visual status indicators with icons (CheckCircle, Clock, XCircle)
- Tooltips for better UX
- Compact and full display modes

### Changed
- Replaced dropdown menu with cleaner inline status toggle
- Improved accessibility with clear visual states
- Better user experience for status management

### Removed
- Removed problematic dropdown menu implementation
- Removed ActionMenu component in favor of StatusToggle

## [1.2.0] - 2025-09-19

### Added
- Built-in duplicate review prevention middleware
- The plugin now handles duplicate review prevention internally
- No longer requires external middleware for duplicate checks

### Changed
- Duplicate prevention logic moved from backend to plugin
- POST /store/product-reviews now includes built-in duplicate validation

## [1.1.9] - 2025-09-19

### Fixed
- Fixed rating filter to properly handle string-to-number conversion using `z.coerce.number()`
- Ensures rating filter works correctly when receiving URL parameters

## [1.1.8] - 2025-09-19

### Fixed
- Implemented proper filter handling in admin API route
- Fixed date range filters by converting `created_at_gte/lte` to MikroORM operators
- Fixed search functionality to search across content, name, and email fields
- Added `$or` operator support for multi-field searching

## [1.1.7] - 2025-09-19

### Added
- Added official Medusa JS SDK integration alongside MedusaPluginsSDK
- Products are now fetched using official SDK for better compatibility

### Fixed
- Fixed product dropdown filter by using official Medusa SDK
- Fixed theme adaptation to use Medusa UI design tokens
- Updated all UI components to use proper dark theme tokens

### Changed
- SDK architecture now uses dual SDK approach:
  - MedusaPluginsSDK for review operations
  - Official Medusa SDK for product operations

## [1.1.6] - 1.1.0] - 2025-09-19

### Added
- Enhanced admin UI with advanced filtering capabilities:
  - Product filter dropdown
  - Status filter (Pending/Approved/Flagged)
  - Rating filter (1-5 stars)
  - Date range filters (From/To)
  - Search functionality
- Pagination system with 10 items per page
- Page number input for direct navigation
- Clear filters button

### Changed
- Redesigned admin review table with improved layout
- Migrated to Medusa UI components for consistency
- Improved table styling with proper theme integration

### Fixed
- Fixed admin module export structure
- Fixed widgets undefined error by properly compiling TypeScript to JavaScript
- Fixed module resolution issues in admin extensions

## Initial Features

- Product review management system
- Admin dashboard integration
- Review moderation (approve/flag/pending)
- Customer review submission
- Review response from merchants
- Image upload support for reviews
- Review statistics tracking
- Order verification for reviews
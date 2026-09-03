# Admin UI Widgets

React widgets for managing user profiles, avatars, and roles in the Medusa Admin UI.

## Available Widgets

### 1. User Avatar Widget
**File:** `user-avatar-widget.tsx`  
**Zone:** `user.details.before`  
**Location:** Settings → Team → [User Details]

Displays and manages user avatar:
- Upload profile picture (max 5MB)
- Preview current avatar
- Delete avatar
- Uploads to Cloudinary automatically

### 2. User Profile Widget
**File:** `user-profile-widget.tsx`  
**Zone:** `user.details.after`  
**Location:** Settings → Team → [User Details]

Edit user profile fields:
- First Name
- Last Name
- Phone Number
- Role (admin, manager, warehouse-staff, driver)

### 3. Team Member Role Badge
**File:** `team-member-role-badge.tsx`  
**Zone:** `user.details.after`  
**Location:** Settings → Team → [User Details]

Displays user information:
- Role badge with color coding
- Phone number
- Avatar thumbnail

## How Widgets Work

Medusa v2 admin uses a zone-based widget system. Widgets are automatically injected into specific zones in the admin UI.

### Widget Zones

```
user.details.before  → Before user details
user.details.after   → After user details
order.details.before → Before order details
order.details.after  → After order details
...and many more
```

### Widget Structure

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading } from "@medusajs/ui"

const MyWidget = () => {
  return (
    <Container>
      <Heading>My Widget</Heading>
      {/* Your React component */}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "user.details.after",
})

export default MyWidget
```

## Using the Widgets

### 1. Start the Admin UI

```bash
yarn dev
```

The admin UI will be available at: http://localhost:9000/app

### 2. Navigate to Team Settings

1. Go to **Settings** (gear icon in sidebar)
2. Click **Team**
3. Click on any team member

You'll see:
- **Avatar widget** at the top (upload/manage profile picture)
- **Profile widget** below (edit name, phone, role)
- **Role badge** showing current role and info

### 3. Edit Your Own Profile

1. Go to **Settings** → **Team**
2. Find your user and click on it
3. Use the widgets to:
   - Upload your avatar
   - Update your name and phone
   - Change your role (if admin)

## API Endpoints Used

The widgets call these backend endpoints:

```typescript
// Get current user profile
GET /admin/users/me

// Update user profile
PATCH /admin/users/me
Body: { first_name, last_name, phone, role }

// Get avatar
GET /admin/users/me/avatar

// Upload avatar
PUT /admin/users/me/avatar
Body: FormData with 'avatar' file

// Delete avatar
DELETE /admin/users/me/avatar
```

## Customization

### Change Widget Position

Edit the `zone` in the widget config:

```typescript
export const config = defineWidgetConfig({
  zone: "user.details.before", // Change this
})
```

### Add More Fields

Edit the widget component to add more form fields:

```typescript
// In user-profile-widget.tsx
<div>
  <Label>Department</Label>
  <Input
    value={formData.department}
    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
  />
</div>
```

### Style Changes

Widgets use Medusa UI components. Customize with Tailwind classes:

```typescript
<Container className="bg-blue-50 border-2 border-blue-200">
  {/* Your content */}
</Container>
```

## Role Badge Colors

The role badge uses different colors for each role:

| Role | Color | Badge |
|------|-------|-------|
| admin | Purple | 🟣 Administrator |
| manager | Blue | 🔵 Manager |
| warehouse-staff | Green | 🟢 Warehouse Staff |
| driver | Orange | 🟠 Driver |

## Troubleshooting

### Widgets not showing
- Ensure server is running: `yarn dev`
- Check browser console for errors
- Verify widget files are in `src/admin/widgets/`
- Restart the dev server

### Avatar upload fails
- Check Cloudinary credentials in `.env`
- Verify file size < 5MB
- Ensure file is an image type
- Check backend logs

### Profile update fails
- Verify migration ran: `npx medusa migrations run`
- Check user table has new columns
- Review backend API logs

## Development

### Hot Reload

The admin UI supports hot reload. Changes to widget files will automatically refresh the admin panel.

### Testing

1. Start server: `yarn dev`
2. Open admin: http://localhost:9000/app
3. Navigate to Settings → Team
4. Test each widget functionality

### Adding New Widgets

1. Create new file in `src/admin/widgets/`
2. Export widget component and config
3. Restart dev server
4. Widget will appear in specified zone

## Examples

### Minimal Widget

```typescript
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Text } from "@medusajs/ui"

const SimpleWidget = () => {
  return (
    <Container>
      <Text>Hello from widget!</Text>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "user.details.after",
})

export default SimpleWidget
```

### Widget with Data Fetching

```typescript
import { useState, useEffect } from "react"
import { Container, Text } from "@medusajs/ui"

const DataWidget = () => {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch("/admin/custom-endpoint")
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <Container>
      <Text>{data ? JSON.stringify(data) : "Loading..."}</Text>
    </Container>
  )
}
```

## Resources

- [Medusa Admin SDK Docs](https://docs.medusajs.com/resources/admin-sdk)
- [Medusa UI Components](https://docs.medusajs.com/ui)
- [Widget Zones Reference](https://docs.medusajs.com/resources/admin-sdk/widgets)

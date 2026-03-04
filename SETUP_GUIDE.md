# LabTime - Equipment Booking System

A modern Next.js application for managing equipment bookings with QR code check-in/out functionality.

## 🎯 Features Implemented

### User Features
- ✅ **User Authentication**: Signup and login with email/password
- ✅ **Dashboard**: Browse available equipment with search and filtering
- ✅ **Equipment Booking**: Select equipment, choose date/time slots, and create bookings
- ✅ **My Bookings**: View all bookings with status tracking
- ✅ **QR Code**: Each booking gets a unique QR code for check-in/out
- ✅ **Profile Management**: Edit user profile information
- ✅ **Responsive Design**: Mobile-friendly interface

### Admin Features
- ✅ **Admin Dashboard**: Overview of equipment, bookings, and statistics
- ✅ **Equipment Management**: Add, edit, and delete equipment
- ✅ **Slot Management**: Create and manage time slots for each equipment
- ✅ **Booking Management**: View all bookings with user and equipment details
- ✅ **Check-In/Out Scanner**: QR code scanner for marking check-ins and check-outs
- ✅ **Role-Based Access**: Automatic routing based on user role

## 📁 Project Structure

```
app/
├── auth/
│   ├── signup/page.tsx          # User registration
│   └── login/page.tsx           # User login
├── dashboard/
│   ├── page.tsx                 # Main dashboard (equipment listing)
│   ├── profile/page.tsx         # User profile
│   ├── book/[id]/page.tsx       # Equipment booking page
│   ├── my-bookings/
│   │   ├── page.tsx             # All bookings list
│   │   └── [id]/page.tsx        # Booking details with QR code
│   └── ...
├── admin/
│   ├── dashboard/page.tsx       # Admin overview
│   ├── equipment/
│   │   ├── page.tsx             # Equipment management
│   │   └── [id]/slots/page.tsx  # Slot management
│   ├── bookings/page.tsx        # Booking management
│   ├── checkin/page.tsx         # Check-in/out scanner
│   └── ...
├── layout.tsx                   # Root layout
├── page.tsx                     # Home/root redirect
└── globals.css                  # Global styles

components/
├── Navbar.tsx                   # User navbar
└── AdminNavbar.tsx              # Admin navbar

lib/supabase/
├── client.ts                    # Browser client
└── proxy.ts                     # Middleware

main/
├── Schema.sql                   # Database schema
├── indexes.sql                  # Database indexes
└── policies.sql                 # Row-level security policies
```

## 🗄️ Database Schema

### Tables Created:
1. **profiles** - User profiles linked to auth.users
2. **equipment** - Physical equipment items
3. **equipment_slots** - Time slots for booking
4. **bookings** - Equipment bookings with QR codes
5. **notifications** - System notifications

### Key Features:
- Row-Level Security (RLS) policies
- Proper indexes for performance
- Foreign key relationships
- Status tracking for equipment and bookings

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
yarn install
```

### 2. Set Up Supabase

1. Create a Supabase project
2. Get your API keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. Create `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

4. Run SQL migrations:
   - Execute `main/Schema.sql`
   - Execute `main/indexes.sql`
   - Execute `main/policies.sql`

### 3. Create Admin User

After setting up the database, manually update a user's role to 'admin' in the profiles table:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔐 Authentication Flow

1. **New User**: Sign up → Email verification → Create profile
2. **Login**: Check email/password → Verify role → Redirect to appropriate dashboard
   - Admin → `/admin/dashboard`
   - User → `/dashboard`

## 📋 Booking Flow (Users)

1. **Browse Equipment** → Click equipment
2. **Select Date & Time** → Choose available slots
3. **Create Booking** → Gets unique QR code
4. **View Booking** → See QR code, download if needed
5. **Check In/Out** → Admin scans QR code

## 🔧 Admin Operations

### Equipment Management
- Add new equipment with name, description, location, category
- Set equipment status (available, maintenance, retired)
- Delete equipment (soft delete)

### Slot Management
- Create time slots for specific dates
- Set start and end times
- Admin can view and manage all slots

### Booking Management
- View all bookings with user and equipment details
- Filter by status (pending, checked_in, checked_out)
- See check-in/out times

### Check-In/Out
- Use camera or manual input for QR codes
- See full booking details
- Mark as checked in or checked out with timestamp

## 🎨 UI/UX Features

- **Dark admin dashboard** for comfort during operations
- **Light user interface** for accessibility
- **Responsive design** - Mobile, tablet, and desktop
- **Status badges** with color coding
- **Real-time QR code generation** using QR Server API
- **Profile dropdown** for easy navigation

## 🔐 Security Features

- **Row-Level Security (RLS)** on all tables
- **Role-based access control** (user vs admin)
- **Authentication guards** on all protected routes
- **Session management** with Supabase Auth

## 📦 Dependencies

Already installed in your project:
- `next` - React framework
- `react` - UI library
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - SSR support
- `tailwindcss` - CSS framework

## 🎯 Next Steps / Future Enhancements

1. **QR Code Scanning Library**: Add `jsqr` or `html5-qrcode` for in-browser scanning
2. **Email Notifications**: Send confirmation emails for bookings
3. **Equipment Images**: Upload and display equipment images
4. **Analytics Dashboard**: Booking statistics and usage trends
5. **Recurring Slots**: Auto-generate recurring time slots
6. **User Ratings**: Rate equipment after checkout
7. **Waitlist**: Queue users for unavailable time slots
8. **API Rate Limiting**: Protect admin endpoints
9. **Audit Logging**: Track all admin operations
10. **Export Bookings**: Export booking history as CSV/PDF

## 🐛 Troubleshooting

### "User not authenticated" message
- Check browser console for Supabase errors
- Verify environment variables are set correctly
- Clear browser storage and login again

### QR code not scanning
- Ensure good lighting
- Try manual input instead
- Check QR code data is properly stored

### Bookings not showing
- Verify user is logged in
- Check database RLS policies
- Ensure booking_date is not in the past

## 📞 Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Check Next.js documentation: https://nextjs.org/docs
3. Review the code comments for specific features

---

**Project created with ❤️ using Next.js, Supabase, and Tailwind CSS**

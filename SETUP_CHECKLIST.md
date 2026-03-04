# LabTime - Setup Checklist

## ✅ What's Already Built

### Database & Backend
- [x] Complete database schema with 5 main tables
- [x] Row-level security policies for data protection
- [x] Database indexes for performance optimization
- [x] Authentication integration with Supabase Auth

### User Features
- [x] Authentication (signup/login)
- [x] Equipment browsing and search
- [x] Booking system with date/time selection
- [x] QR code generation for each booking
- [x] My Bookings page with status tracking
- [x] Profile management page
- [x] Responsive navbar with dropdown menu

### Admin Features
- [x] Admin dashboard with statistics
- [x] Equipment management (CRUD operations)
- [x] Time slot management per equipment
- [x] Booking management and history view
- [x] QR code scanner for check-in/out
- [x] Admin navbar with navigation

### Design & UX
- [x] Tailwind CSS styling
- [x] Dark mode admin interface
- [x] Light user interface
- [x] Mobile-responsive design
- [x] Status badges and color coding
- [x] Loading states and animations

---

## 📋 Next Steps (What You Need to Do)

### 1. **Set Up Supabase Project** (First Priority)
- [ ] Create account at https://supabase.com
- [ ] Create a new project
- [ ] Get your API credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 2. **Create Environment File**
- [ ] Create `.env.local` in project root
- [ ] Add your Supabase credentials:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_url_here
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_here
  ```

### 3. **Set Up Database**
- [ ] Go to Supabase dashboard → SQL Editor
- [ ] Copy and run the SQL from `main/Schema.sql`
- [ ] Copy and run the SQL from `main/indexes.sql`
- [ ] Copy and run the SQL from `main/policies.sql`

### 4. **Create Admin User**
- [ ] Sign up as a regular user first
- [ ] In Supabase, go to profiles table
- [ ] Update your user's role: `user → admin`
- [ ] SQL command:
  ```sql
  UPDATE profiles 
  SET role = 'admin' 
  WHERE email = 'your_email@example.com';
  ```

### 5. **Install & Run**
- [ ] Run `npm install` to install dependencies (if not done)
- [ ] Run `npm run dev` to start development server
- [ ] Visit `http://localhost:3000`

### 6. **Test the Application**
- [ ] [ ] Sign up a new user account
- [ ] [ ] Login with the account
- [ ] [ ] Add equipment as admin
- [ ] [ ] Create time slots for equipment
- [ ] [ ] Book equipment as user
- [ ] [ ] View QR code
- [ ] [ ] Test check-in/out as admin

---

## 🎮 How to Use

### As a Regular User:
1. Sign up with email and password
2. Browse equipment on the dashboard
3. Search or filter by category
4. Click "Book Now" on equipment
5. Select date and time slot
6. Confirm booking to get QR code
7. View booking details anytime in "My Bookings"
8. Show QR code to admin for check-in/out

### As an Admin:
1. Sign up, then change role to 'admin'
2. Go to `/admin/dashboard`
3. **Manage Equipment**: Add, edit, delete equipment
4. **Manage Slots**: Click "Slots" on equipment → Add time slots
5. **View Bookings**: See all bookings and their status
6. **Check In/Out**: Use QR code scanner to process check-ins/outs

---

## 🚀 Deployment (When Ready)

When you want to deploy to production:

### Vercel Deployment:
1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables Needed:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

---

## 💡 Important Notes

1. **QR Code Display**: Uses QR Server API (free, no setup needed)
2. **Email Verification**: Supabase handles this automatically
3. **Database Backups**: Check Supabase settings for auto-backups
4. **SSL Certificates**: Vercel provides free SSL by default
5. **Custom Domain**: Add custom domain in Vercel settings

---

## 🐛 Common Issues & Solutions

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### "Environment variables not loading"
- Restart dev server after adding `.env.local`
- Use `NEXT_PUBLIC_` prefix for client-side variables

### "Supabase connection error"
- Check URL and key are correct
- Ensure `.env.local` is in root directory
- Verify Supabase project is active

### "Login not working"
- Check if email is verified in Supabase
- Try signing up again
- Check browser console for errors

---

## 📞 Quick References

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **QR Code API**: https://qrserver.com

---

## ✨ Features You Can Easily Add Later

1. **Equipment Images**: File upload to Supabase storage
2. **Email Notifications**: Use Supabase functions + SendGrid
3. **User Ratings**: Add new table for ratings
4. **Recurring Slots**: Generate slots programmatically
5. **CSV Export**: Use library like `papaparse`
6. **Analytics**: Add chart library like `recharts`

---

**Happy booking! 🎉**

Once you complete the setup steps above, your equipment booking system will be live and ready to use!

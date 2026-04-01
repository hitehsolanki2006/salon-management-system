# 📚 SalonFlow - Quick Reference Guide

## 🎯 Documentation Index

### Main Documentation Files

1. **PROJECT_DOCUMENTATION.md** (28 KB)
   - Complete project overview
   - Technology stack
   - Project structure
   - Component breakdown
   - Styling system
   - Routing & navigation
   - State management

2. **DATABASE_DOCUMENTATION.md** (28 KB)
   - Complete database schema
   - All 7 tables with columns
   - Relationships & foreign keys
   - RLS policies (35+ policies)
   - Triggers & functions
   - Constraints & indexes
   - Sample data overview

3. **WORKFLOW_DOCUMENTATION.md** (29 KB)
   - User roles & permissions
   - Customer workflows (8 workflows)
   - Staff workflows (4 workflows)
   - Receptionist workflows (7 workflows)
   - Admin workflows (3 workflows)
   - Appointment lifecycle
   - Payment processing
   - Rating & feedback system

4. **DATABASE_SCHEMA_QUERIES.sql** (11 KB)
   - 18 sections of SQL queries
   - Extract complete database info
   - Run in Supabase SQL Editor

---

## 🗄️ Database Quick Reference

### Tables (7)
1. **users** - User profiles (32 users)
2. **appointments** - Bookings (50 appointments)
3. **services** - Service catalog (7 services)
4. **appointment_services** - Junction table
5. **payments** - Payment records (27 payments)
6. **feedback** - Ratings & reviews (35 feedback)
7. **notifications** - System notifications

### Key Relationships
```
users (customer) → appointments ← users (staff)
appointments → appointment_services → services
appointments → payments
appointments → feedback → users (staff)
```

---

## 👥 User Roles Quick Reference

### Customer 👤
- Browse services
- Book appointments
- Request reschedules
- Rate staff
- View own data only

### Staff 👨‍💼
- View assigned appointments
- Start/complete services
- View performance metrics
- Cannot assign themselves

### Receptionist 📋
- View all appointments
- Approve/assign appointments
- Collect payments
- Handle reschedules
- Cannot manage services

### Admin 👑
- Full system access
- Manage users & services
- View analytics
- Generate reports
- No restrictions

---

## 🔄 Appointment Status Flow

```
PENDING → APPROVED → IN_PROGRESS → SERVICE_DONE → COMPLETED
   ↓          ↓                                        ↑
CANCELLED  RESCHEDULE_REQUESTED ────────────────────┘
```

---

## 💡 Key Features

### Automatic Rating System
- Database trigger: `update_staff_rating()`
- Fires on INSERT/UPDATE/DELETE of feedback
- Calculates average rating automatically
- Updates staff profile in real-time

### Payment Processing
- Cash & Online methods
- Unique receipt numbers (RCT-{timestamp})
- Automatic status update to 'completed'
- Celebration animation on success

### Service Management
- Add/remove services from appointments
- Automatic total recalculation
- Real-time UI updates
- Discount support

### Reschedule System
- Customer requests new time
- Receptionist approves/rejects
- Can reassign staff during approval
- Status tracking

---

## 🎨 UI Components

### Modals
- Success (green, auto-dismiss)
- Error (red, manual dismiss)
- Info (blue, manual dismiss)
- Confirm (yes/no buttons)

### Filters
- Status filter (8 options)
- Date filter (5 options)
- Search (name/service)
- Combinable filters

### Date Picker
- React DatePicker library
- Purple & gold theme
- 30-minute intervals
- Today highlighted

---

## 🔐 Security

### Authentication
- Supabase Auth
- JWT tokens
- Email verification
- Password reset

### Authorization
- Row-Level Security (RLS)
- 35+ RLS policies
- Role-based access
- Protected routes

---

## 📊 Analytics Available

### Admin Analytics
1. **Overview**
   - Total revenue
   - Total appointments
   - Active users
   - Popular services

2. **User Analytics**
   - Top customers
   - Acquisition chart
   - Engagement metrics

3. **Staff Analytics**
   - Performance comparison
   - Appointments per staff
   - Average ratings
   - Revenue per staff

4. **Service Analytics**
   - Most popular services
   - Revenue breakdown
   - Booking frequency

5. **Appointment Analytics**
   - Status distribution
   - Completion rate
   - Peak booking times
   - Business insights

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Important File Locations

### Frontend
- Components: `src/components/`
- Pages: `src/pages/`
- Roles: `src/roles/`
- Admin: `src/admin/`
- Features: `src/features/`
- Styles: `src/style/`

### Backend
- Supabase config: `src/lib/supabase.js`
- Edge functions: `supabase/functions/`

### Documentation
- Project: `PROJECT_DOCUMENTATION.md`
- Database: `DATABASE_DOCUMENTATION.md`
- Workflows: `WORKFLOW_DOCUMENTATION.md`
- SQL Queries: `DATABASE_SCHEMA_QUERIES.sql`

---

## 🔧 Configuration Files

- **package.json** - Dependencies
- **vite.config.js** - Vite configuration
- **eslint.config.js** - ESLint rules
- **.env** - Environment variables
- **supabase/config.toml** - Supabase config

---

## 🎯 Common Tasks

### Add New Service
1. Admin Dashboard → Services tab
2. Click "Add Service"
3. Fill form (name, price, duration, image)
4. Submit

### Approve Appointment
1. Receptionist Dashboard
2. View pending appointments
3. Assign staff
4. Click "Approve"

### Collect Payment
1. Receptionist Dashboard
2. View service_done appointments
3. Click "Collect Payment"
4. Select method
5. Confirm

### Rate Service
1. Customer → My Appointments
2. View completed appointment
3. Click "Rate Service"
4. Select stars & add comment
5. Submit

---

## 📞 Support Information

### Database Issues
- Check RLS policies
- Verify foreign keys
- Review triggers
- Check constraints

### Authentication Issues
- Verify Supabase credentials
- Check user role in database
- Clear browser cache
- Check .env file

### UI Issues
- Check CSS import order
- Verify class names
- Check responsive breakpoints
- Clear browser cache

---

## 🚀 Deployment

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment Platforms
- Netlify (recommended)
- Vercel
- GitHub Pages
- Any static hosting

---

## 📈 Statistics

- **Total Users:** 32
- **Total Appointments:** 50
- **Total Services:** 7
- **Total Payments:** 27
- **Total Feedback:** 35
- **Average Rating:** 4.36
- **Completion Rate:** 62%

---

## 🎓 Learning Resources

### Technologies Used
- React 18
- Supabase (PostgreSQL)
- React Router DOM
- Recharts
- React DatePicker
- jsPDF

### Key Concepts
- Row-Level Security (RLS)
- JWT Authentication
- Database Triggers
- Foreign Keys
- Real-time Updates
- Role-Based Access Control

---

*Quick Reference Guide*  
*Last Updated: February 15, 2026*  
*Version: 1.0.0*

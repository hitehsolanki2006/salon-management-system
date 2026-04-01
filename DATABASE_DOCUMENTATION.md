# 🗄️ SalonFlow - Complete Database Documentation

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Database Statistics](#database-statistics)
3. [Tables Schema](#tables-schema)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Indexes](#indexes)
6. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
7. [Triggers & Functions](#triggers--functions)
8. [Constraints](#constraints)
9. [Sample Data Overview](#sample-data-overview)

---

## 🎯 Database Overview

SalonFlow uses **PostgreSQL** database hosted on **Supabase** with the following architecture:

- **Total Tables:** 7
- **Total Users:** 32 (1 Admin, 4 Receptionists, 8 Staff, 19 Customers)
- **Total Appointments:** 50
- **Total Services:** 7
- **Total Payments:** 27
- **Total Feedback:** 35
- **Authentication:** Supabase Auth with JWT tokens
- **Security:** Row-Level Security (RLS) enabled on all tables

---

## 📊 Database Statistics

### User Distribution
| Role         | Count |
|--------------|-------|
| Admin        | 1     |
| Receptionist | 4     |
| Staff        | 8     |
| Customer     | 19    |
| **Total**    | **32** |

### Appointment Status Distribution
| Status              | Count |
|---------------------|-------|
| Approved            | 16    |
| Cancelled           | 2     |
| Completed           | 31    |
| In Progress         | 1     |
| **Total**           | **50** |

### System Statistics
- **Active Services:** 7
- **Total Payments Processed:** 27
- **Total Feedback Submitted:** 35
- **Average Staff Rating:** 4.36 (from 35 reviews)

### Table Sizes
| Table                | Size   |
|----------------------|--------|
| users                | 176 kB |
| appointments         | 72 kB  |
| payments             | 48 kB  |
| feedback             | 32 kB  |
| services             | 32 kB  |
| appointment_services | 24 kB  |
| notifications        | 16 kB  |

---

## 📑 Tables Schema

### 1. **users** Table

Stores all user information including customers, staff, receptionists, and admins.

| Column Name       | Data Type                | Nullable | Default          | Description                                    |
|-------------------|--------------------------|----------|------------------|------------------------------------------------|
| id                | uuid                     | NO       | null             | Primary key (matches Supabase Auth user ID)   |
| full_name         | text                     | YES      | null             | User's full name                               |
| role              | text                     | YES      | 'customer'       | User role: admin, receptionist, staff, customer|
| avatar_url        | text                     | YES      | null             | Profile picture URL                            |
| blocked           | boolean                  | YES      | false            | Whether user is blocked                        |
| created_at        | timestamp with time zone | YES      | now()            | Account creation timestamp                     |
| avg_rating        | numeric                  | YES      | 0                | Average rating (for staff only)                |
| rating_count      | integer                  | YES      | 0                | Total number of ratings (for staff only)       |
| email             | text                     | YES      | null             | User's email address                           |
| phone             | text                     | YES      | null             | User's phone number                            |
| address           | text                     | YES      | null             | User's address                                 |
| profile_completed | boolean                  | YES      | false            | Whether profile is complete                    |
| telegram_chat_id  | text                     | YES      | null             | Telegram chat ID for notifications             |
| telegram_enabled  | boolean                  | YES      | false            | Whether Telegram notifications are enabled     |
| admin_mode        | boolean                  | YES      | false            | Admin mode flag                                |
| admin_mode_until  | timestamp with time zone | YES      | null             | Admin mode expiration time                     |
| status            | text                     | YES      | 'active'         | User status: active, blocked                   |

**Constraints:**
- Primary Key: `id`
- Check: `role IN ('admin', 'receptionist', 'staff', 'customer')`

---

### 2. **appointments** Table

Stores all appointment bookings.

| Column Name      | Data Type                | Nullable | Default           | Description                                    |
|------------------|--------------------------|----------|-------------------|------------------------------------------------|
| id               | uuid                     | NO       | gen_random_uuid() | Primary key                                    |
| customer_id      | uuid                     | YES      | null              | Foreign key to users table (customer)          |
| staff_id         | uuid                     | YES      | null              | Foreign key to users table (staff)             |
| appointment_time | timestamp with time zone | NO       | null              | Scheduled appointment date and time            |
| status           | text                     | YES      | 'pending'         | Appointment status                             |
| total_amount     | numeric                  | YES      | null              | Total cost of all services                     |
| created_at       | timestamp with time zone | YES      | now()             | Appointment creation timestamp                 |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `customer_id` → `users.id`
  - `staff_id` → `users.id`
- Check: `status IN ('pending', 'approved', 'in_progress', 'service_done', 'completed', 'cancelled', 'reschedule_requested')`

**Status Flow:**
```
pending → approved → in_progress → service_done → completed
                                                ↓
                                           cancelled
                                                ↓
                                      reschedule_requested
```

---

### 3. **services** Table

Stores all available salon services.

| Column Name      | Data Type                | Nullable | Default           | Description                                    |
|------------------|--------------------------|----------|-------------------|------------------------------------------------|
| id               | uuid                     | NO       | gen_random_uuid() | Primary key                                    |
| name             | text                     | NO       | null              | Service name                                   |
| description      | text                     | YES      | null              | Service description                            |
| price            | numeric                  | NO       | null              | Service price                                  |
| duration         | integer                  | NO       | null              | Service duration in minutes                    |
| discount_allowed | boolean                  | YES      | true              | Whether discount can be applied                |
| is_active        | boolean                  | YES      | true              | Whether service is currently available         |
| created_at       | timestamp with time zone | YES      | now()             | Service creation timestamp                     |
| image_url        | text                     | YES      | null              | Service image URL (Supabase Storage)           |
| discount_percent | integer                  | YES      | 0                 | Discount percentage (0-100)                    |

**Constraints:**
- Primary Key: `id`
- Check: `duration > 0`

**Available Services:**
1. Hair Coloring - ₹2,500 (120 min)
2. Beard Trim - ₹200 (20 min)
3. Hair Spa - ₹1,200 (60 min)
4. Facial - ₹800 (45 min)
5. Heello - ₹100 (15 min)

---

### 4. **appointment_services** Table

Junction table linking appointments to services (many-to-many relationship).

| Column Name    | Data Type | Nullable | Default           | Description                                    |
|----------------|-----------|----------|-------------------|------------------------------------------------|
| id             | uuid      | NO       | gen_random_uuid() | Primary key                                    |
| appointment_id | uuid      | YES      | null              | Foreign key to appointments table              |
| service_id     | uuid      | YES      | null              | Foreign key to services table                  |
| price          | numeric   | NO       | null              | Service price at time of booking               |
| quantity       | integer   | NO       | 1                 | Quantity of service                            |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `appointment_id` → `appointments.id`
  - `service_id` → `services.id`

---

### 5. **payments** Table

Stores payment records for completed appointments.

| Column Name    | Data Type                | Nullable | Default           | Description                                    |
|----------------|--------------------------|----------|-------------------|------------------------------------------------|
| id             | uuid                     | NO       | gen_random_uuid() | Primary key                                    |
| appointment_id | uuid                     | YES      | null              | Foreign key to appointments table              |
| amount         | numeric                  | NO       | null              | Payment amount                                 |
| payment_mode   | text                     | YES      | null              | Payment method: cash, online                   |
| receipt_no     | text                     | YES      | null              | Unique receipt number                          |
| created_at     | timestamp with time zone | YES      | now()             | Payment timestamp                              |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `appointment_id` → `appointments.id`
- Unique: `receipt_no`
- Check: `payment_mode IN ('cash', 'online')`

**Receipt Number Format:** `RCT-{timestamp}`

---

### 6. **feedback** Table

Stores customer feedback and ratings for staff members.

| Column Name    | Data Type                | Nullable | Default           | Description                                    |
|----------------|--------------------------|----------|-------------------|------------------------------------------------|
| id             | uuid                     | NO       | gen_random_uuid() | Primary key                                    |
| appointment_id | uuid                     | YES      | null              | Foreign key to appointments table              |
| staff_id       | uuid                     | YES      | null              | Foreign key to users table (staff)             |
| rating         | integer                  | YES      | null              | Rating value (1-5 stars)                       |
| comment        | text                     | YES      | null              | Optional feedback comment                      |
| created_at     | timestamp with time zone | YES      | now()             | Feedback submission timestamp                  |

**Constraints:**
- Primary Key: `id`
- Foreign Keys:
  - `appointment_id` → `appointments.id`
  - `staff_id` → `users.id`
- Check: `rating >= 1 AND rating <= 5`

---

### 7. **notifications** Table

Stores user notifications (for future Telegram integration).

| Column Name | Data Type                | Nullable | Default           | Description                                    |
|-------------|--------------------------|----------|-------------------|------------------------------------------------|
| id          | uuid                     | NO       | gen_random_uuid() | Primary key                                    |
| user_id     | uuid                     | YES      | null              | Foreign key to users table                     |
| message     | text                     | YES      | null              | Notification message                           |
| type        | text                     | YES      | null              | Notification type                              |
| read        | boolean                  | YES      | false             | Whether notification has been read             |
| created_at  | timestamp with time zone | YES      | now()             | Notification creation timestamp                |

**Constraints:**
- Primary Key: `id`
- Foreign Key: `user_id` → `users.id`

---

## 🔗 Relationships & Foreign Keys

### Entity Relationship Diagram (ERD)

```
users (customer)
    ↓ (1:N)
appointments ← (N:1) users (staff)
    ↓ (1:N)
    ├── appointment_services → (N:1) services
    ├── payments (1:1)
    └── feedback (1:N)
            ↓ (N:1)
        users (staff)
```

### Foreign Key Relationships

| From Table           | From Column    | To Table     | To Column | Constraint Name                          |
|----------------------|----------------|--------------|-----------|------------------------------------------|
| appointment_services | appointment_id | appointments | id        | appointment_services_appointment_id_fkey |
| appointment_services | service_id     | services     | id        | appointment_services_service_id_fkey     |
| appointments         | customer_id    | users        | id        | appointments_customer_id_fkey            |
| appointments         | staff_id       | users        | id        | appointments_staff_id_fkey               |
| feedback             | appointment_id | appointments | id        | feedback_appointment_id_fkey             |
| feedback             | staff_id       | users        | id        | feedback_staff_id_fkey                   |
| notifications        | user_id        | users        | id        | notifications_user_id_fkey               |
| payments             | appointment_id | appointments | id        | payments_appointment_id_fkey             |

---

## 🔍 Indexes

All tables have primary key indexes for fast lookups.

| Table                | Index Name                | Type   | Column(s)  |
|----------------------|---------------------------|--------|------------|
| users                | users_pkey                | UNIQUE | id         |
| appointments         | appointments_pkey         | UNIQUE | id         |
| services             | services_pkey             | UNIQUE | id         |
| appointment_services | appointment_services_pkey | UNIQUE | id         |
| payments             | payments_pkey             | UNIQUE | id         |
| payments             | payments_receipt_no_key   | UNIQUE | receipt_no |
| feedback             | feedback_pkey             | UNIQUE | id         |
| notifications        | notifications_pkey        | UNIQUE | id         |

---

## 🔒 Row-Level Security (RLS) Policies

All tables have RLS enabled with role-based access control.

### **users** Table Policies

| Policy Name            | Command | Description                                                |
|------------------------|---------|-----------------------------------------------------------|
| profiles_are_public    | SELECT  | All authenticated users can view user profiles            |
| users_insert_self      | INSERT  | Users can only insert their own profile                   |
| users_update_own       | UPDATE  | Users can only update their own profile                   |
| admin_update_all_users | UPDATE  | Admins can update any user                                |
| admins_delete_any      | DELETE  | Admins can delete any user                                |
| unified_select_users   | SELECT  | Users can view themselves, admins/receptionists/staff can view all |

### **appointments** Table Policies

| Policy Name                          | Command | Description                                                |
|--------------------------------------|---------|-----------------------------------------------------------|
| customer_create_appointment          | INSERT  | Customers can create their own appointments               |
| customer_read_appointments           | SELECT  | Customers can view their own appointments                 |
| customer_update_appointments         | UPDATE  | Customers can update their own appointments               |
| Customers can cancel their own appointments | UPDATE  | Customers can cancel (status = 'cancelled')               |
| staff_read_assigned_appointments     | SELECT  | Staff can view appointments assigned to them              |
| staff_update_assigned                | UPDATE  | Staff can update their assigned appointments              |
| receptionist_view_all_appointments   | SELECT  | Receptionists can view all appointments                   |
| receptionist_update_all              | UPDATE  | Receptionists can update any appointment                  |
| receptionist_full_access_appointments| ALL     | Receptionists have full access to appointments            |
| admin_manage_appointments            | ALL     | Admins have full access to appointments                   |

### **services** Table Policies

| Policy Name              | Command | Description                                                |
|--------------------------|---------|-----------------------------------------------------------|
| Public view active services | SELECT  | Public can view active services                           |
| public_read_services     | SELECT  | Public can read active services                           |
| anyone_read_services     | SELECT  | Authenticated users can read services                     |
| services_are_readable    | SELECT  | All authenticated users can read services                 |
| Admin full access services | ALL     | Admins have full CRUD access to services                  |

### **appointment_services** Table Policies

| Policy Name                                      | Command | Description                                                |
|--------------------------------------------------|---------|-----------------------------------------------------------|
| view_own_appt_items                              | SELECT  | Customers can view services in their appointments         |
| Users can insert their own appointment services  | INSERT  | Customers can add services to their appointments          |
| staff_read_appointment_services                  | SELECT  | Staff can view services in their assigned appointments    |
| receptionist_view_all_services                   | SELECT  | Receptionists can view all appointment services           |
| receptionist_admin_manage_services               | ALL     | Receptionists and admins can manage appointment services  |

### **payments** Table Policies

| Policy Name                      | Command | Description                                                |
|----------------------------------|---------|-----------------------------------------------------------|
| Admin view payments              | SELECT  | Admins can view all payments                              |
| admin_read_payments              | SELECT  | Admins can read all payments                              |
| receptionist_view_all_payments   | SELECT  | Receptionists can view all payments                       |
| receptionist_manage_payments     | ALL     | Receptionists have full access to payments                |

### **feedback** Table Policies

| Policy Name                    | Command | Description                                                |
|--------------------------------|---------|-----------------------------------------------------------|
| allow_read_feedback            | SELECT  | All authenticated users can read feedback                 |
| allow_customer_insert_feedback | INSERT  | Customers can submit feedback for their appointments      |
| allow_admin_all_feedback       | ALL     | Admins have full access to feedback                       |

---

## ⚙️ Triggers & Functions

### Triggers

| Trigger Name                    | Event  | Table    | Function                 | Timing | Description                                    |
|---------------------------------|--------|----------|--------------------------|--------|------------------------------------------------|
| trigger_update_rating_on_insert | INSERT | feedback | update_staff_rating()    | AFTER  | Updates staff rating when new feedback is added|
| trigger_update_rating_on_update | UPDATE | feedback | update_staff_rating()    | AFTER  | Updates staff rating when feedback is modified |
| trigger_update_rating_on_delete | DELETE | feedback | update_staff_rating()    | AFTER  | Updates staff rating when feedback is deleted  |
| sync_role_trigger               | INSERT | users    | sync_user_role_to_jwt()  | AFTER  | Syncs user role to JWT claims on user creation |
| sync_role_trigger               | UPDATE | users    | sync_user_role_to_jwt()  | AFTER  | Syncs user role to JWT claims on role change   |
| on_user_role_change             | UPDATE | users    | sync_user_role_to_jwt()  | AFTER  | Syncs user role to JWT on role update          |

### Functions

#### 1. **update_staff_rating()**

**Type:** Trigger Function  
**Returns:** trigger

**Purpose:** Automatically calculates and updates staff average rating and rating count whenever feedback is added, updated, or deleted.

**Logic:**
```sql
1. Determine target staff_id (from NEW or OLD record)
2. Skip if staff_id is NULL
3. Calculate new average rating from all feedback for that staff
4. Count total number of ratings
5. Update users table with new avg_rating and rating_count
```

**Example:**
- Staff has 5 ratings: [5, 4, 5, 3, 4]
- Average: (5+4+5+3+4)/5 = 4.20
- Rating count: 5
- Updates: `users.avg_rating = 4.20`, `users.rating_count = 5`

#### 2. **sync_user_role_to_jwt()**

**Type:** Trigger Function  
**Returns:** trigger

**Purpose:** Synchronizes user role from the users table to Supabase Auth JWT claims for role-based access control.

#### 3. **custom_jwt_claims()**

**Type:** Function  
**Returns:** jsonb

**Purpose:** Adds custom claims to JWT tokens for enhanced authentication.

#### 4. **handle_new_user()**

**Type:** Trigger Function  
**Returns:** trigger

**Purpose:** Handles new user creation and initialization.

---

## ✅ Constraints

### Check Constraints

| Table                | Constraint Name             | Check Clause                                                                                                                                      |
|----------------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| users                | users_role_check            | role IN ('admin', 'receptionist', 'staff', 'customer')                                                                                            |
| appointments         | appointments_status_check   | status IN ('pending', 'approved', 'in_progress', 'service_done', 'completed', 'cancelled', 'reschedule_requested')                                |
| services             | duration_positive           | duration > 0                                                                                                                                      |
| payments             | payments_payment_mode_check | payment_mode IN ('cash', 'online')                                                                                                                |
| feedback             | feedback_rating_check       | rating >= 1 AND rating <= 5                                                                                                                       |

### Unique Constraints

| Table    | Column      | Description                                    |
|----------|-------------|------------------------------------------------|
| payments | receipt_no  | Each payment must have a unique receipt number |

### NOT NULL Constraints

All primary keys and essential fields have NOT NULL constraints to ensure data integrity.

---

## 📊 Sample Data Overview

### Top Rated Staff

| Staff Name   | Average Rating | Total Ratings | Status        |
|--------------|----------------|---------------|---------------|
| Babita       | 4.30           | 20            | ⭐ Has ratings |
| Staff Janan  | 4.17           | 6             | ⭐ Has ratings |
| Chaman       | 0              | 0             | 📝 No ratings |
| Prashant     | 0              | 0             | 📝 No ratings |

### Recent Appointments

- 50 total appointments
- 31 completed (62%)
- 16 approved (32%)
- 2 cancelled (4%)
- 1 in progress (2%)

### Payment Methods

- Cash payments: Available
- Online payments: Available
- Receipt generation: Automatic with unique receipt numbers

### Service Popularity

All 7 services are active and available for booking with prices ranging from ₹100 to ₹2,500.

---

## 🔐 Security Features

### 1. **Row-Level Security (RLS)**
- Enabled on all tables
- Role-based access control
- Users can only access their own data unless they have elevated permissions

### 2. **Authentication**
- Supabase Auth integration
- JWT token-based authentication
- Email verification
- Password reset functionality

### 3. **Data Validation**
- Check constraints on critical fields
- Foreign key constraints for referential integrity
- Unique constraints on sensitive fields (receipt numbers)

### 4. **Automatic Updates**
- Triggers for rating calculations
- Automatic timestamp management
- JWT claims synchronization

---

## 📝 Database Best Practices

### 1. **Indexing**
- Primary keys are automatically indexed
- Consider adding indexes on frequently queried columns (customer_id, staff_id, appointment_time)

### 2. **Data Integrity**
- Foreign keys ensure referential integrity
- Check constraints validate data before insertion
- Triggers maintain calculated fields automatically

### 3. **Performance**
- Use RLS policies efficiently
- Avoid N+1 queries by using joins
- Cache frequently accessed data (services)

### 4. **Backup & Recovery**
- Supabase provides automatic backups
- Point-in-time recovery available
- Regular database exports recommended

---

## 🚀 Future Enhancements

### Planned Database Features

1. **Notifications System**
   - Telegram integration
   - Email notifications
   - SMS reminders

2. **Analytics Tables**
   - Revenue tracking
   - Customer behavior analysis
   - Staff performance metrics

3. **Inventory Management**
   - Product tracking
   - Stock levels
   - Reorder alerts

4. **Loyalty Program**
   - Points system
   - Rewards tracking
   - Tier management

5. **Advanced Scheduling**
   - Staff availability
   - Break times
   - Holiday management

---

*Last Updated: February 15, 2026*  
*Database Version: PostgreSQL 15 (Supabase)*  
*Total Records: 151 (across all tables)*

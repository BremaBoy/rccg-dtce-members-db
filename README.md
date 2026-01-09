# DTCE Member Portal

A comprehensive web portal for DTCE (Directorate of Teens and Children Education) members to register, manage their profiles, and enable automated birthday notifications for admins.

![DTCE Logo](public/images/dtce-logo.png)

## Features

### Member Portal
- **Registration**: Complete member registration with personal information
  - Full name, email, password
  - Address, state of residence, phone number (WhatsApp)
  - Province, region (text inputs)
  - Date of birth
  - Profile picture upload
- **Login**: Secure member authentication
- **Profile Management**: View all information and update:
  - Profile picture
  - Province
  - Region

### Admin Portal
- **Separate Admin Login**: Independent authentication system for administrators
- **Member Management**:
  - View all registered members with full details
  - Search and filter members by name, email, or phone
  - Delete members with confirmation
- **Birthday Features**:
  - Birthday calendar showing upcoming birthdays (next 30 days)
  - Post birthday congratulations for members
  - View recent birthday posts
- **Settings**:
  - Configure notification email address
  - Default email: brematech27@gmail.com

### Automated Birthday Notifications
- **Midnight Notification**: Sent at 00:00 AM on member's birthday
- **Day-Before Reminder**: Sent at 00:00 AM the day before birthday
- Emails sent to configured admin email address

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and App Router
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Styling**: Tailwind CSS with custom design system
- **Email**: Supabase Edge Functions with Resend

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for email notifications)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "rccg member db"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL commands in `supabase-setup.sql` to create tables and policies
3. Create a storage bucket named `member-profiles` with public access
4. Get your Supabase URL and anon key from Project Settings > API

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
DEFAULT_ADMIN_EMAIL=brematech27@gmail.com
RESEND_API_KEY=your_resend_api_key_here
```

### 5. Create Admin Account

After setting up the database, create an admin account:

1. Sign up through Supabase Auth
2. Insert a record in the `admins` table with the user_id

```sql
INSERT INTO admins (user_id, email, full_name)
VALUES ('your-user-id', 'admin@dtce.org', 'Admin Name');
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **members**: Stores member information
- **admins**: Stores admin accounts
- **admin_settings**: Stores admin configuration (notification email)
- **birthday_posts**: Stores birthday congratulation posts

### Storage

- **member-profiles**: Stores member profile pictures

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Set Up Edge Functions

1. Deploy the birthday notification Edge Functions to Supabase
2. Configure cron jobs in Supabase dashboard:
   - Midnight notification: `0 0 * * *`
   - Day-before reminder: `0 0 * * *`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin portal pages
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── login/         # Admin login
│   │   └── settings/      # Admin settings
│   ├── login/             # Member login
│   ├── profile/           # Member profile
│   ├── register/          # Member registration
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # Reusable components
├── lib/                   # Utility functions
│   ├── supabase/          # Supabase clients
│   └── constants.ts       # Constants (Nigerian states)
├── public/                # Static assets
│   └── images/            # Images (DTCE logo)
├── .env.local             # Environment variables
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Usage

### For Members

1. Visit the portal homepage
2. Click "Register Now" to create an account
3. Fill in all required information
4. Upload a profile picture
5. Login to view and update your profile

### For Admins

1. Visit the portal homepage
2. Click "Admin Login"
3. Sign in with admin credentials
4. Access the dashboard to:
   - View all members
   - Check upcoming birthdays
   - Post birthday congratulations
   - Delete members
   - Configure notification email

## Support

For issues or questions, please contact the DTCE technical team.

## License

© 2026 DTCE - Directorate of Teens and Children Education. All rights reserved.

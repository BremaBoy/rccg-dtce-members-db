# Supabase Edge Functions Deployment Guide

## Birthday Notifications Function

This Edge Function sends automated birthday notifications to the admin email.

### Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

### Deploy the Function

```bash
supabase functions deploy birthday-notifications
```

### Set Environment Variables

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### Set Up Cron Jobs

In your Supabase Dashboard:

1. Go to Database > Cron Jobs
2. Create two cron jobs:

**Midnight Birthday Notification:**
- Name: `birthday-notification-midnight`
- Schedule: `0 0 * * *` (runs at 00:00 AM daily)
- Command:
```sql
SELECT
  net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/birthday-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "today"}'::jsonb
  ) as request_id;
```

**Day-Before Birthday Reminder:**
- Name: `birthday-reminder-day-before`
- Schedule: `0 0 * * *` (runs at 00:00 AM daily)
- Command:
```sql
SELECT
  net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/birthday-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{"type": "tomorrow"}'::jsonb
  ) as request_id;
```

### Test the Function

Test manually using curl:

```bash
# Test today's birthdays
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/birthday-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type": "today"}'

# Test tomorrow's birthdays
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/birthday-notifications' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type": "tomorrow"}'
```

### Email Service Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use their testing domain
3. Get your API key from the dashboard
4. Add the API key to Supabase secrets (see above)

### Monitoring

- Check function logs in Supabase Dashboard > Edge Functions
- Monitor email delivery in Resend Dashboard
- Check cron job execution in Supabase Dashboard > Database > Cron Jobs

### Troubleshooting

**Function not triggering:**
- Verify cron job is enabled
- Check cron job syntax
- Ensure function is deployed

**Emails not sending:**
- Verify Resend API key is set correctly
- Check Resend dashboard for errors
- Ensure sender email is verified in Resend

**No birthdays found:**
- Verify members have correct date_of_birth in database
- Check helper functions are working: `SELECT * FROM get_todays_birthdays();`

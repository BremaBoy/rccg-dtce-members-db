// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!
// Supabase provides these automatically
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Member {
  id: string
  email: string
  full_name: string
  date_of_birth: string
}
const sendBirthdayEmail = async (member: Member) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Happy Birthday!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🎉 Happy Birthday! 🎂</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Dear ${member.full_name},</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      On behalf of the <strong>DTCE ICT Department</strong>, we are delighted to celebrate you today. Your presence and engagement with our platform mean a lot to us, and we truly appreciate your interest in what we are building.
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      As you mark another year, we wish you <strong>good health, growth, success</strong>, and many reasons to smile. May this new chapter bring fresh opportunities, exciting ideas, and great achievements in all you do.
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      Thank you for being part of our community. We look forward to continuing this journey with you and delivering even better digital solutions and experiences.
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                      Enjoy your special day and have a wonderful year ahead! 🎈
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 5px 0; color: #666666; font-size: 14px; font-weight: bold; text-align: center;">
                      Warm regards,
                    </p>
                    <p style="margin: 5px 0; color: #667eea; font-size: 16px; font-weight: bold; text-align: center;">
                      DTCE ICT Department
                    </p>
                    <p style="margin: 5px 0 0 0; color: #999999; font-size: 13px; text-align: center;">
                      Directorate of Teens & Children Education
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 13px; text-align: center;">
                      Redeemed Christian Church of God (RCCG)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'DTCE ICT Department', email: 'brematech27@gmail.com' },
      to: [{ email: member.email, name: member.full_name }],
      subject: 'Happy Birthday from the DTCE ICT DEPARTMENT',
      htmlContent: emailHtml,
    }),
  })

  const data = await res.json()
  return data
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    console.log(`Checking birthdays for ${todayMonth}/${todayDay}`)

    const { data: members, error } = await supabase
      .from('members')
      .select('id, email, full_name, date_of_birth')

    if (error) {
      console.error('Error fetching members:', error)
      throw error
    }

    const birthdayMembers = members?.filter((member: Member) => {
      const birthDate = new Date(member.date_of_birth)
      return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay
    }) || []

    console.log(`Found ${birthdayMembers.length} members with birthdays today`)

    const emailResults = []
    for (const member of birthdayMembers) {
      try {
        console.log(`Sending birthday email to ${member.full_name} (${member.email})`)
        const result = await sendBirthdayEmail(member)
        emailResults.push({
          member: member.full_name,
          email: member.email,
          success: true,
          result
        })

        await supabase
          .from('birthday_posts')
          .insert({
            member_id: member.id,
            post_content: `Happy Birthday! 🎉 Automated birthday wishes sent via email.`,
            posted_by_admin_id: null,
          })
      } catch (emailError: any) {
        console.error(`Failed to send email to ${member.full_name}:`, emailError)
        emailResults.push({
          member: member.full_name,
          email: member.email,
          success: false,
          error: emailError.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: `${todayMonth}/${todayDay}`,
        totalBirthdays: birthdayMembers.length,
        emailResults
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Error in birthday notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

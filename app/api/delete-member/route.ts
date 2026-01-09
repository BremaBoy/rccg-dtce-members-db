import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting member with ID:', userId);

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete from members table first (will cascade to birthday_posts)
    console.log('Deleting from members table...');
    const { error: memberError } = await supabaseAdmin
      .from('members')
      .delete()
      .eq('id', userId);

    if (memberError) {
      console.error('Error deleting member:', memberError);
      return NextResponse.json(
        { error: `Failed to delete member: ${memberError.message}` },
        { status: 500 }
      );
    }

    console.log('Member deleted from database, now checking auth...');

    // Check if user exists in auth before attempting deletion
    try {
      const { data: authUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (getUserError || !authUser) {
        console.log('User does not exist in auth, skipping auth deletion');
        return NextResponse.json({ success: true });
      }

      // User exists in auth, proceed with deletion
      console.log('User found in auth, deleting...');
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        return NextResponse.json(
          { error: `Member deleted from database, but failed to delete auth user: ${authError.message}` },
          { status: 500 }
        );
      }
    } catch (authErr: any) {
      console.error('Auth operation exception:', authErr);
      // If we can't check/delete auth, still consider it success since DB is cleaned
      return NextResponse.json({ success: true });
    }

    console.log('Member and auth user deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete-member API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

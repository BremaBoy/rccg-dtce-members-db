'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Member {
  id: string;
  email: string;
  full_name: string;
  address: string;
  state_of_residence: string;
  phone_number: string;
  province: string;
  region: string;
  date_of_birth: string;
  profile_picture_url: string | null;
  created_at: string;
}

interface BirthdayPost {
  id: string;
  member_id: string;
  post_content: string;
  posted_at: string;
  members: {
    full_name: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [birthdayPosts, setBirthdayPosts] = useState<BirthdayPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [postContent, setPostContent] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});
  const [activeTab, setActiveTab] = useState<'members' | 'birthdays' | 'posts'>('members');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' }>({ title: '', message: '', type: 'success' });
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = members.filter(member =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone_number.includes(searchTerm)
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members);
    }
  }, [searchTerm, members]);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: adminData, error } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !adminData) {
        router.push('/admin/login');
        return;
      }

      loadMembers();
      loadBirthdayPosts();
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembers(data);
      setFilteredMembers(data);
    }
  };

  const loadBirthdayPosts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('birthday_posts')
      .select(`
        *,
        members (full_name)
      `)
      .order('posted_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setBirthdayPosts(data as any);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      // Call API route to delete member (uses service role key)
      const response = await fetch('/api/delete-member', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberToDelete.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete member');
      }

      loadMembers();
      setShowDeleteModal(false);
      setMemberToDelete(null);
      setMessageModal({ title: 'Success', message: 'Member account completely deleted!', type: 'success' });
      setShowMessageModal(true);
    } catch (err: any) {
      setMessageModal({ title: 'Error', message: `Error deleting member: ${err.message}`, type: 'error' });
      setShowMessageModal(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostBirthday = async () => {
    if (!selectedMember) return;

    // Check if today is the member's birthday
    const today = new Date();
    const birthDate = new Date(selectedMember.date_of_birth);
    const isBirthdayToday = 
      birthDate.getMonth() === today.getMonth() && 
      birthDate.getDate() === today.getDate();

    // If not birthday today, show confirmation
    if (!isBirthdayToday) {
      const confirmed = window.confirm(
        `Today is not ${selectedMember.full_name}'s birthday. Are you sure you want to send a birthday message?`
      );
      if (!confirmed) {
        return;
      }
    }

    setIsPosting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      // Standard birthday message
      const standardMessage = `Dear ${selectedMember.full_name},

Happy Birthday! 🎉🎂

On behalf of the DTCE ICT Department, we are delighted to celebrate you today. Your presence and engagement with our platform mean a lot to us, and we truly appreciate your interest in what we are building.

As you mark another year, we wish you good health, growth, success, and many reasons to smile. May this new chapter bring fresh opportunities, exciting ideas, and great achievements in all you do.

Thank you for being part of our community. We look forward to continuing this journey with you and delivering even better digital solutions and experiences.

Enjoy your special day and have a wonderful year ahead! 🎈

Warm regards,
DTCE ICT Department
Directorate of Teens & Children Education
Redeemed Christian Church of God (RCCG)`;

      const { error } = await supabase
        .from('birthday_posts')
        .insert({
          member_id: selectedMember.id,
          post_content: standardMessage,
          posted_by_admin_id: adminData!.id,
        });

      if (error) throw error;

      // Send birthday email
      let emailSuccess = false;
      let emailError = null;
      
      try {
        const emailResponse = await fetch('/api/send-birthday-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: selectedMember.email,
            name: selectedMember.full_name,
            message: standardMessage,
          }),
        });

        if (emailResponse.ok) {
          emailSuccess = true;
        } else {
          const errorData = await emailResponse.json();
          emailError = errorData.error || 'Failed to send email';
        }
      } catch (err: any) {
        emailError = err.message || 'Network error sending email';
      }

      setSelectedMember(null);
      setShowPostModal(false);
      loadBirthdayPosts();

      // Show result based on email status
      if (isBirthdayToday) {
        if (emailSuccess) {
          setMessageModal({ title: 'Success', message: `Birthday email sent successfully to ${selectedMember.full_name}! 🎉`, type: 'success' });
        } else {
          setMessageModal({ title: 'Error', message: `Birthday post created, but email failed to send.\n\nError: ${emailError}`, type: 'error' });
        }
      } else {
        setMessageModal({ title: 'Info', message: `Birthday message posted for ${selectedMember.full_name}.`, type: 'info' });
      }
      setShowMessageModal(true);
    } catch (err: any) {
      setMessageModal({ title: 'Error', message: `Error posting birthday message: ${err.message}`, type: 'error' });
      setShowMessageModal(true);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditMember = async () => {
    if (!memberToEdit || !editFormData) return;

    setIsEditing(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('members')
        .update({
          full_name: editFormData.full_name,
          email: editFormData.email,
          address: editFormData.address,
          state_of_residence: editFormData.state_of_residence,
          phone_number: editFormData.phone_number,
          province: editFormData.province,
          region: editFormData.region,
          date_of_birth: editFormData.date_of_birth,
        })
        .eq('id', memberToEdit.id);

      if (error) throw error;

      loadMembers();
      setShowEditModal(false);
      setMemberToEdit(null);
      setEditFormData({});
      setMessageModal({ title: 'Success', message: 'Member information updated successfully!', type: 'success' });
      setShowMessageModal(true);
    } catch (err: any) {
      setMessageModal({ title: 'Error', message: `Error updating member: ${err.message}`, type: 'error' });
      setShowMessageModal(true);
    } finally {
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    return members.filter(member => {
      const birthday = new Date(member.date_of_birth);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      return thisYearBirthday >= today && thisYearBirthday <= next30Days;
    }).sort((a, b) => {
      const dateA = new Date(a.date_of_birth);
      const dateB = new Date(b.date_of_birth);
      const thisYearA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
      const thisYearB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
      return thisYearA.getTime() - thisYearB.getTime();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingBirthdays = getUpcomingBirthdays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Image
                src="/images/login-logo.png"
                alt="DTCE Logo"
                width={600}
                height={300}
                className="h-20 w-auto"
              />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/settings"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage members and birthday celebrations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming Birthdays</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBirthdays.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Birthday Posts</p>
                <p className="text-2xl font-bold text-gray-900">{birthdayPosts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'members'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Members
              </button>
              <button
                onClick={() => setActiveTab('birthdays')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'birthdays'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Birthday Calendar
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Birthday Posts
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search members by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birthday</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {member.profile_picture_url ? (
                                  <img src={member.profile_picture_url} alt={member.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-gray-500 font-medium">{member.full_name.charAt(0)}</span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.phone_number}</div>
                            <div className="text-sm text-gray-500">{member.state_of_residence}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.province}</div>
                            <div className="text-sm text-gray-500">{member.region}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(member.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setMemberToEdit(member);
                                setEditFormData(member);
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowPostModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Post
                            </button>
                            <button
                              onClick={() => {
                                setMemberToDelete(member);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Birthdays Tab */}
            {activeTab === 'birthdays' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Birthdays (Next 30 Days)</h3>
                {upcomingBirthdays.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No upcoming birthdays in the next 30 days</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingBirthdays.map((member) => {
                      const birthday = new Date(member.date_of_birth);
                      const thisYearBirthday = new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate());
                      const daysUntil = Math.ceil((thisYearBirthday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={member.id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
                              {member.profile_picture_url ? (
                                <img src={member.profile_picture_url} alt={member.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-purple-600 font-medium">{member.full_name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="ml-3">
                              <h4 className="font-semibold text-gray-900">{member.full_name}</h4>
                              <p className="text-sm text-gray-600">
                                {thisYearBirthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-600 font-medium">
                              {daysUntil === 0 ? 'Today! 🎉' : `In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowPostModal(true);
                              }}
                              className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Birthday Posts</h3>
                {birthdayPosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No birthday posts yet</p>
                ) : (
                  <div className="space-y-4">
                    {birthdayPosts.map((post) => (
                      <div key={post.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{post.members.full_name}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-gray-700">{post.post_content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Post Birthday Modal */}
      {showPostModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Send Birthday Message
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                <strong>Member:</strong> {selectedMember.full_name}
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Email:</strong> {selectedMember.email}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> A standard birthday email will be sent automatically with the DTCE ICT Department template.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePostBirthday}
                disabled={isPosting}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isPosting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Birthday Email'
                )}
              </button>
              <button
                onClick={() => {
                  setShowPostModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{memberToDelete.full_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteMember}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Member'
                )}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && memberToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Edit Member: {memberToEdit.full_name}
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editFormData.phone_number || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* State of Residence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State of Residence</label>
                <input
                  type="text"
                  value={editFormData.state_of_residence || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, state_of_residence: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Province and Region */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                  <input
                    type="text"
                    value={editFormData.province || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <input
                    type="text"
                    value={editFormData.region || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.date_of_birth || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditMember}
                disabled={isEditing}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isEditing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setMemberToEdit(null);
                  setEditFormData({});
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal (Success/Error/Info) */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4">
                {messageModal.type === 'success' && (
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {messageModal.type === 'error' && (
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {messageModal.type === 'info' && (
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-2xl font-bold mb-3 ${
                messageModal.type === 'success' ? 'text-green-600' :
                messageModal.type === 'error' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {messageModal.title}
              </h3>

              {/* Message */}
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {messageModal.message}
              </p>

              {/* OK Button */}
              <button
                onClick={() => setShowMessageModal(false)}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                  messageModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  messageModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

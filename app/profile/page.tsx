'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface MemberData {
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
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  
  const [editableData, setEditableData] = useState({
    province: '',
    region: '',
  });

  useEffect(() => {
    loadMemberData();
  }, []);

  const loadMemberData = async () => {
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setMemberData(data);
      setEditableData({
        province: data.province,
        region: data.region,
      });
      setImagePreview(data.profile_picture_url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let profilePictureUrl = memberData?.profile_picture_url;

      // Upload new image if provided
      if (newImage) {
        const fileExt = newImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('member-profiles')
          .upload(fileName, newImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('member-profiles')
          .getPublicUrl(fileName);
        
        profilePictureUrl = urlData.publicUrl;
      }

      // Update member data
      const { error: updateError } = await supabase
        .from('members')
        .update({
          province: editableData.province,
          region: editableData.region,
          profile_picture_url: profilePictureUrl,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      loadMemberData();
      setNewImage(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
          <Link href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-0 pb-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center pt-8 mb-12">
          <Image
            src="/images/login-logo.png"
            alt="DTCE Logo"
            width={600}
            height={300}
            className="w-auto h-20"
          />
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{memberData.full_name}</h1>
                <p className="text-blue-100 mt-1">{memberData.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Read-Only Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                  <p className="text-gray-900 font-medium">{memberData.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900 font-medium">{memberData.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900 font-medium">{memberData.phone_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                  <p className="text-gray-900 font-medium">
                    {new Date(memberData.date_of_birth).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900 font-medium">{memberData.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">State of Residence</label>
                  <p className="text-gray-900 font-medium">{memberData.state_of_residence}</p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <form onSubmit={handleUpdate}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Editable Information</h2>
              
              {/* Profile Picture */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-blue-50 text-blue-600 py-2 px-4 border border-blue-300 rounded-lg shadow-sm text-sm font-medium hover:bg-blue-100">
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  {newImage && (
                    <span className="text-sm text-green-600">New image selected</span>
                  )}
                </div>
              </div>

              {/* Province and Region */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <input
                    type="text"
                    id="province"
                    required
                    value={editableData.province}
                    onChange={(e) => setEditableData({ ...editableData, province: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <input
                    type="text"
                    id="region"
                    required
                    value={editableData.region}
                    onChange={(e) => setEditableData({ ...editableData, region: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Update Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

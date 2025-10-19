import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI } from '../lib/api';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    location: '',
    website: ''
  });
  const [errors, setErrors] = useState({});

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await profileAPI.get();
        return response.data;
      } catch (err) {
        if (err.response?.status === 404) {
          return null; 
        }
        throw err;
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (profile) {
        return profileAPI.update(data);
      } else {
        return profileAPI.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setIsEditing(false);
      setErrors({});
    },
    onError: (err) => {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => profileAPI.delete(),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        title: profile.title || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || ''
      });
    }
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete your profile?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;

  return (
    <div>
      <nav>
        <Link to="/">← Back to Dashboard</Link>
      </nav>

      <h1>My Profile</h1>

      {!profile && !isEditing ? (
        <div>
          <p>You haven't created a profile yet.</p>
          <button onClick={() => setIsEditing(true)}>Create Profile</button>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
          </div>

          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            {errors.title && <span style={{ color: 'red' }}>{errors.title}</span>}
          </div>

          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows="4"
            />
            {errors.bio && <span style={{ color: 'red' }}>{errors.bio}</span>}
          </div>

          <div>
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            {errors.location && <span style={{ color: 'red' }}>{errors.location}</span>}
          </div>

          <div>
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            {errors.website && <span style={{ color: 'red' }}>{errors.website}</span>}
          </div>

          <button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <h2>{profile.name}</h2>
          {profile.title && <p><strong>Title:</strong> {profile.title}</p>}
          {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
          {profile.location && <p><strong>Location:</strong> {profile.location}</p>}
          {profile.website && <p><strong>Website:</strong> <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a></p>}
          
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          <button onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Profile'}
          </button>
        </div>
      )}
    </div>
  );
};
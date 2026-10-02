import React, { useEffect, useState } from 'react';
import { Camera, Loader, X } from 'lucide-react';
import { getAvatarUrl, updateProfile } from '../services/authService';

const compressImageToDataUrl = (file, maxWidth = 320, maxHeight = 320, quality = 0.88) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = readerEvent.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

const EditProfileModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarBase64, setAvatarBase64] = useState('');
  const [previewUrl, setPreviewUrl] = useState(getAvatarUrl(user.avatar));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Profile photos must be smaller than 8 MB.');
      return;
    }
    setError('');
    setAvatarFile(file);

    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      setAvatarBase64(compressedDataUrl);
      setPreviewUrl(compressedDataUrl);
    } catch (compressionErr) {
      console.warn('Canvas compression fallback to object URL:', compressionErr);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updatedUser = await updateProfile(name, avatarFile, avatarBase64);
      onSave(updatedUser);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onMouseDown={onClose}>
      <section
        className="profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h2 id="profile-modal-title">Edit Profile</h2>
            <p>Update your account name and photo.</p>
          </div>
          <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Close edit profile">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="profile-photo-picker">
            {previewUrl ? (
              <img
                className="profile-photo-preview"
                src={previewUrl}
                alt="Profile preview"
                onError={() => setPreviewUrl('')}
              />
            ) : (
              <div className="profile-photo-preview profile-photo-fallback">
                {(name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <label className="btn btn-secondary profile-photo-button" htmlFor="profile-photo-input">
              <Camera size={16} />
              <span>Choose photo</span>
            </label>
            <input
              id="profile-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              hidden
            />
            <span className="profile-photo-hint">JPEG, PNG, or WebP, up to 5 MB</span>
          </div>

          <label className="form-label" htmlFor="profile-name">Full name</label>
          <input
            className="form-input profile-name-input"
            id="profile-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoComplete="name"
            required
          />

          {error && <p className="profile-form-error" role="alert">{error}</p>}

          <div className="profile-modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader className="spin" size={16} /> : null}
              <span>{saving ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default EditProfileModal;
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useModal } from "../context/ModalContext";
import "../style/Profile.css";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { openConfirm, openSuccess, openError, openInfo } = useModal();

  const loadProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        openError("No user session found. Please login again.", "Session Error");
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        openError(`Failed to load profile: ${error.message}`, "Database Error");
        return;
      }

      setUserData(data);
      setFormData(data || {});
      if (data?.avatar_url) {
        setImagePreview(data.avatar_url);
      }
    } catch (error) {
      openError(`Unexpected error: ${error.message}`, "Error Loading Profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const calculateCompletion = () => {
    if (!userData) return 0;
    const fields = ["full_name", "email", "phone", "address"];
    const completed = fields.filter((field) => userData[field]).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      openError("Image size should be less than 5MB. Please choose a smaller image.", "File Too Large");
      return;
    }

    if (!file.type.startsWith('image/')) {
      openError("Please select a valid image file (JPG, PNG, etc.)", "Invalid File Type");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData({ ...formData, avatar_url: reader.result });
      openSuccess("Image uploaded successfully! Don't forget to save your changes.", "Image Uploaded");
    };
    reader.onerror = () => {
      openError("Failed to read the image file. Please try again.", "File Read Error");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    openConfirm(
      "Are you sure you want to remove your profile picture? This change will be saved when you click 'Save Changes'.",
      () => {
        setImagePreview(null);
        setFormData({ ...formData, avatar_url: null });
        openInfo("Profile picture removed. Remember to save your changes.", "Image Removed");
      },
      "Remove Profile Picture"
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name?.trim()) {
      newErrors.full_name = "Name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number should be exactly 10 digits";
    }

    if (formData.address && formData.address.trim().length < 10) {
      newErrors.address = "Address should be at least 10 characters for accuracy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      openError("Please fix the validation errors in the form before saving.", "Validation Error");
      return;
    }

    openConfirm(
      "Are you sure you want to save these changes to your profile?",
      async () => {
        try {
          setSaving(true);

          const isComplete = !!(
            formData.full_name?.trim() && 
            formData.email?.trim() && 
            formData.phone?.trim() && 
            formData.address?.trim()
          );

          const { error: updateError } = await supabase
            .from("users")
            .update({
              full_name: formData.full_name,
              phone: formData.phone,
              address: formData.address,
              avatar_url: formData.avatar_url,
              profile_completed: isComplete,
            })
            .eq("id", userData.id);

          if (updateError) {
            openError(`Failed to update profile: ${updateError.message}`, "Update Failed");
            return;
          }

          // Handle email change separately
          if (formData.email !== userData.email) {
            const { error: emailError } = await supabase.auth.updateUser({
              email: formData.email,
            });

            if (emailError) {
              openError(`Failed to update email: ${emailError.message}`, "Email Update Failed");
              return;
            }
            
            openInfo(
              "A verification email has been sent to your new email address. Please verify to complete the email change. Your other profile changes have been saved.",
              "📧 Email Verification Required"
            );
          } else {
            openSuccess("Your profile has been updated successfully! All changes have been saved.", "Profile Updated");
          }

          setEdit(false);
          await loadProfile();
        } catch (error) {
          openError(`Unexpected error: ${error.message}`, "Save Failed");
        } finally {
          setSaving(false);
        }
      },
      "💾 Confirm Save Changes"
    );
  };

  const handlePasswordChange = () => {
    openConfirm(
      "You will be asked to enter a new password in the next step. Make sure it's at least 6 characters long and contains a mix of letters and numbers for security.",
      () => {
        // Show password input dialog
        setTimeout(() => {
          const newPassword = window.prompt("Enter your new password (minimum 6 characters):");
          
          if (!newPassword) {
            openInfo("Password change cancelled.", "Cancelled");
            return;
          }

          if (newPassword.length < 6) {
            openError("Password must be at least 6 characters long. Please try again.", "Invalid Password");
            return;
          }

          // Confirm password change
          openConfirm(
            "Are you absolutely sure you want to change your password? You will need to use the new password for future logins.",
            async () => {
              try {
                const { error } = await supabase.auth.updateUser({
                  password: newPassword,
                });

                if (error) {
                  openError(`Failed to update password: ${error.message}`, "Password Update Failed");
                  return;
                }
                
                openSuccess("Your password has been updated successfully! Please use your new password for future logins.", "Password Changed");
              } catch (error) {
                openError(`Unexpected error: ${error.message}`, "Password Update Failed");
              }
            },
            "🔐 Confirm Password Change"
          );
        }, 300);
      },
      "🔑 Change Password"
    );
  };

  const handleLogout = () => {
    openConfirm(
      "Are you sure you want to logout from your account? You will need to login again to access your profile.",
      async () => {
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            openError(`Logout failed: ${error.message}`, "Logout Error");
            return;
          }
          
          openSuccess("You have been logged out successfully! Redirecting to login page...", "Logged Out");
          
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        } catch (error) {
          openError(`Unexpected error during logout: ${error.message}`, "Logout Failed");
        }
      },
      "🚪 Confirm Logout"
    );
  };

  const handleDeleteAccount = () => {
    openInfo(
      "Account deletion feature is currently under development. This feature will be available soon with enhanced security measures, data backup options, and account recovery period. Thank you for your patience!",
      "🚀 Feature Coming Soon"
    );
  };

  const handleCancelEdit = () => {
    if (JSON.stringify(formData) !== JSON.stringify(userData)) {
      openConfirm(
        "You have unsaved changes. Are you sure you want to cancel? All your changes will be lost.",
        () => {
          setEdit(false);
          setFormData(userData);
          setImagePreview(userData?.avatar_url);
          setErrors({});
          openInfo("Edit mode cancelled. All changes have been discarded.", "Changes Discarded");
        },
        "⚠️ Discard Changes?"
      );
    } else {
      setEdit(false);
      setFormData(userData);
      setImagePreview(userData?.avatar_url);
      setErrors({});
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "linear-gradient(135deg, #E74C3C, #C0392B)",
      receptionist: "linear-gradient(135deg, #3498DB, #2980B9)",
      staff: "linear-gradient(135deg, #27AE60, #229954)",
      customer: "linear-gradient(135deg, #9B59B6, #8E44AD)",
    };
    return colors[role] || colors.customer;
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-loading">
        <p>❌ Failed to load profile data</p>
        <button className="btn btn-primary" onClick={loadProfile}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2 className="profile-title">My Profile</h2>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" />
                ) : (
                  <span>{userData?.full_name?.charAt(0) || "U"}</span>
                )}
              </div>
              {edit && (
                <>
                  <label className="avatar-upload-overlay">
                    📷 Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="avatar-upload-input"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      className="remove-image-btn"
                      onClick={removeImage}
                      title="Remove image"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
            <h3 className="profile-name">{userData?.full_name || "User"}</h3>
            <p className="profile-email">{userData?.email || "No email"}</p>
            <div
              className="status-badge"
              style={{
                background: getRoleBadgeColor(userData?.role),
                marginTop: "0.5rem",
              }}
            >
              {userData?.role || "customer"}
            </div>
          </div>

          <div className="profile-completion">
            <div className="completion-header">
              <span className="completion-label">Profile Completion</span>
              <span className="completion-percentage">
                {calculateCompletion()}%
              </span>
            </div>
            <div className="completion-bar">
              <div
                className="completion-progress"
                style={{ width: `${calculateCompletion()}%` }}
              ></div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">
                {userData?.avg_rating?.toFixed(1) || "0.0"}
              </div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{userData?.rating_count || 0}</div>
              <div className="stat-label">Reviews</div>
            </div>
          </div>

          {userData?.blocked && (
            <div
              className="status-badge status-incomplete"
              style={{
                marginTop: "1rem",
                width: "100%",
                justifyContent: "center",
              }}
            >
              ⚠️ Account Blocked
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="details-header">
            <h3 className="details-title">
              {edit ? (
                <>
                  <span>Edit Profile</span>
                  <span className="edit-mode-badge">Edit Mode</span>
                </>
              ) : (
                "Profile Information"
              )}
            </h3>
            {!edit && (
              <button className="profile-edit-btn" onClick={() => setEdit(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {!edit && (
            <div className="profile-tabs">
              <button
                className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}
                onClick={() => setActiveTab("personal")}
              >
                👤 Personal Info
              </button>
              <button
                className={`tab-btn ${activeTab === "account" ? "active" : ""}`}
                onClick={() => setActiveTab("account")}
              >
                🔐 Account
              </button>
              <button
                className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                ⚙️ Settings
              </button>
            </div>
          )}

          {!edit && activeTab === "personal" && (
            <div className="profile-fields">
              <div className="profile-field">
                <div className="profile-field-label">👤 Full Name</div>
                <div className="profile-field-value">
                  {userData?.full_name || (
                    <span className="profile-field-empty">Not provided</span>
                  )}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">📧 Email</div>
                <div className="profile-field-value">
                  {userData?.email || (
                    <span className="profile-field-empty">Not provided</span>
                  )}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">📱 Phone</div>
                <div className="profile-field-value">
                  {userData?.phone || (
                    <span className="profile-field-empty">Not provided</span>
                  )}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">🏠 Address</div>
                <div className="profile-field-value">
                  {userData?.address || (
                    <span className="profile-field-empty">Not provided</span>
                  )}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">👔 Role</div>
                <div className="profile-field-value">
                  {userData?.role || "customer"}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">📅 Member Since</div>
                <div className="profile-field-value">
                  {userData?.created_at
                    ? new Date(userData.created_at).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>
          )}

          {!edit && activeTab === "account" && (
            <div className="profile-fields">
              <div className="profile-field">
                <div className="profile-field-label">🆔 User ID</div>
                <div className="profile-field-value" style={{ fontSize: "0.9rem" }}>
                  {userData?.id}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">📊 Account Status</div>
                <div className="profile-field-value">
                  <span
                    className={
                      userData?.status === "active"
                        ? "status-badge status-complete"
                        : "status-badge status-incomplete"
                    }
                  >
                    {userData?.status || "active"}
                  </span>
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">✅ Profile Completed</div>
                <div className="profile-field-value">
                  {userData?.profile_completed ? "Yes ✓" : "No ✗"}
                </div>
              </div>

              <div className="profile-field">
                <div className="profile-field-label">🔔 Telegram Notifications</div>
                <div className="profile-field-value">
                  {userData?.telegram_enabled ? "Enabled ✓" : "Disabled ✗"}
                </div>
              </div>

              {userData?.admin_mode && (
                <div className="profile-field">
                  <div className="profile-field-label">👨‍💼 Admin Mode</div>
                  <div className="profile-field-value">
                    Active until{" "}
                    {userData?.admin_mode_until
                      ? new Date(userData.admin_mode_until).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              )}
            </div>
          )}

          {!edit && activeTab === "settings" && (
            <div className="security-section">
              <h4>🔐 Security & Privacy</h4>
              <div className="security-actions">
                <button
                  className="action-btn action-btn-info"
                  onClick={handlePasswordChange}
                >
                  🔑 Change Password
                </button>
                <button className="action-btn action-btn-warning" onClick={handleLogout}>
                  🚪 Logout
                </button>
                <button
                  className="action-btn action-btn-danger"
                  onClick={handleDeleteAccount}
                >
                  🗑️ Delete Account
                </button>
              </div>
            </div>
          )}

          {edit && (
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    👤 Full Name <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && (
                    <span className="form-error">⚠️ {errors.full_name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    📧 Email <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <span className="form-error">⚠️ {errors.email}</span>
                  )}
                  <span className="form-helper-text">
                    Changing email requires verification
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📱 Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                  />
                  {errors.phone && (
                    <span className="form-error">⚠️ {errors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>👔 Role</label>
                  <input
                    type="text"
                    value={userData?.role || "customer"}
                    readOnly
                    disabled
                  />
                  <span className="form-helper-text">Role is managed by admin</span>
                </div>
              </div>

              <div className="form-group full-width">
                <label>🏠 Address</label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  rows={3}
                ></textarea>
                {errors.address && (
                  <span className="form-error">⚠️ {errors.address}</span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  ✖️ Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "💾 Saving..." : "💾 Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!edit && (
        <div className="profile-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn action-btn-info" onClick={handlePasswordChange}>
              🔑 Change Password
            </button>
            <button className="action-btn action-btn-warning" onClick={handleLogout}>
              🚪 Logout from Account
            </button>
            <button className="action-btn action-btn-danger" onClick={handleDeleteAccount}>
              🗑️ Delete Account Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
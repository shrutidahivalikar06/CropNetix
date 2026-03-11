import "./App.css";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    farm_location: "",
    phone: ""
  });
  
  // Profile edit state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    farm_location: "",
    profile_picture: null
  });
  
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setProfileData({
          name: parsedUser.name || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          farm_location: parsedUser.farm_location || "",
          profile_picture: parsedUser.profile_picture || null
        });
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const LanguageSwitcher = ({ compact = false }) => (
    <div className={`lang-switcher ${compact ? "compact" : ""}`}>
      <span className="lang-label">{t("language")}</span>
      <select
        className="lang-select"
        value={i18n.resolvedLanguage || "en"}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label={t("language")}
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
        <option value="mr">मराठी</option>
      </select>
    </div>
  );

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
      setResult(null);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"]
    }
  });

  const analyzeImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (user) {
          // Update user data with response from server if needed
          const updatedUser = {
            ...user,
            totalScans: (user?.totalScans || 0) + 1,
            lastActive: new Date().toISOString()
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } else {
        setResult({ error: data.detail || t("errors.predictionFailed") });
      }
    } catch (error) {
      console.error(error);
      setResult({ error: t("errors.serverConnectionFailed") });
    }
    setLoading(false);
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({
          ...profileData,
          profile_picture: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setApiLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.token);

        // Normalize user data from backend (support different field names)
        const rawUser = data.user || {};
        const userData = {
          email: rawUser.email || loginData.email,
          name: rawUser.name || loginData.email.split('@')[0],
          phone: rawUser.phone || rawUser.phone_number || "",
          farm_location: rawUser.farm_location || rawUser.farmLocation || "",
          totalScans: rawUser.totalScans ?? rawUser.total_scans ?? 0,
          memberSince: rawUser.memberSince || rawUser.member_since || new Date().toISOString(),
          lastActive: rawUser.lastActive || rawUser.last_active || new Date().toISOString(),
          profile_picture: rawUser.profile_picture || null
        };
        
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          farm_location: userData.farm_location || "",
          profile_picture: userData.profile_picture || null
        });
        setIsLoggedIn(true);
        setLoginData({ email: "", password: "" });
      } else {
        setLoginError(data.detail || t("errors.invalidLogin"));
      }
    } catch (error) {
      setLoginError(t("errors.serverConnectionFailed"));
    } finally {
      setApiLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setApiLoading(true);

    if (!registerData.name || !registerData.email || !registerData.password) {
      setRegisterError(t("errors.fillRequired"));
      setApiLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError(t("errors.passwordsDontMatch"));
      setApiLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError(t("errors.passwordTooShort"));
      setApiLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = registerData;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterSuccess(t("errors.registrationSuccess"));
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          farm_location: "",
          phone: ""
        });
        setTimeout(() => {
          setShowLogin(true);
          setRegisterSuccess("");
        }, 2000);
      } else {
        setRegisterError(data.detail || t("errors.registrationFailed"));
      }
    } catch (error) {
      setRegisterError(t("errors.serverConnectionFailed"));
    } finally {
      setApiLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setApiLoading(true);
    setProfileUpdateSuccess("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          farm_location: profileData.farm_location,
          profile_picture: profileData.profile_picture
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Use the updated user data from response
        const updatedUser = data.user || {
          ...user,
          name: profileData.name,
          phone: profileData.phone,
          farm_location: profileData.farm_location,
          profile_picture: profileData.profile_picture
        };
        
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileUpdateSuccess(t("errors.profileUpdated"));
        setEditingProfile(false);
        setShowProfileDropdown(false);
        
        setTimeout(() => {
          setProfileUpdateSuccess("");
        }, 3000);
      } else {
        setProfileUpdateSuccess(data.detail || t("errors.failedToUpdateProfile"));
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileUpdateSuccess(t("errors.failedToConnect"));
    } finally {
      setApiLoading(false);
    }
  };

  const logout = () => {
    // Optional: Call logout endpoint
    fetch("http://127.0.0.1:8000/api/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    }).catch(err => console.log("Logout error:", err));
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setImage(null);
    setResult(null);
    setShowProfile(false);
    setEditingProfile(false);
    setShowProfileDropdown(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Profile View Component
  const ProfileView = () => (
    <div className="profile-full-view">
      <div className="profile-header">
        <h2>{t("profile.title")}</h2>
        <button className="close-profile" onClick={() => setShowProfile(false)}>✕</button>
      </div>

      {profileUpdateSuccess && (
        <div className={`profile-message ${profileUpdateSuccess.includes("Failed") ? "error" : "success"}`}>
          {profileUpdateSuccess}
        </div>
      )}

      <div className="profile-content-full">
        <div className="profile-left">
          <div className="profile-picture-large">
            {profileData.profile_picture ? (
              <img src={profileData.profile_picture} alt="Profile" />
            ) : (
              <div className="profile-initials-large">
                {user?.name?.charAt(0).toUpperCase() || "F"}
              </div>
            )}
          </div>
          
          {editingProfile && (
            <div className="profile-picture-upload-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                id="profile-pic-input-full"
              />
              <label htmlFor="profile-pic-input-full">{t("profile.changePhoto")}</label>
            </div>
          )}
        </div>

        <div className="profile-right">
          {editingProfile ? (
            <form className="profile-edit-form-full" onSubmit={handleProfileUpdate}>
              <div className="form-row">
                <div className="form-group-full">
                  <label>{t("profile.fullName")}</label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                    disabled={apiLoading}
                  />
                </div>

                <div className="form-group-full">
                  <label>{t("profile.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-full">
                  <label>{t("profile.phoneNumber")}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder={t("auth.placeholders.phone")}
                    disabled={apiLoading}
                  />
                </div>

                <div className="form-group-full">
                  <label>{t("profile.farmLocation")}</label>
                  <input
                    type="text"
                    name="farm_location"
                    value={profileData.farm_location}
                    onChange={handleProfileChange}
                    placeholder={t("auth.placeholders.farmLocation")}
                    disabled={apiLoading}
                  />
                </div>
              </div>

              <div className="profile-edit-actions-full">
                <button type="submit" className="save-profile-btn-full" disabled={apiLoading}>
                  {apiLoading ? t("profile.saving") : t("profile.saveChanges")}
                </button>
                <button 
                  type="button" 
                  className="cancel-profile-btn-full"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileData({
                      name: user?.name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      farm_location: user?.farm_location || "",
                      profile_picture: user?.profile_picture || null
                    });
                  }}
                  disabled={apiLoading}
                >
                  {t("profile.cancel")}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-full">
              <div className="info-section">
                <h3>{t("profile.personalInfo")}</h3>
                <div className="info-grid-full">
                  <div className="info-item-full">
                    <span className="info-label">{t("profile.fullName")}</span>
                    <span className="info-value">{user?.name || t("profile.notSet")}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">{t("profile.email")}</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">{t("profile.phone")}</span>
                    <span className="info-value">{user?.phone || t("profile.notProvided")}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">{t("profile.farm_Location")}</span>
                    <span className="info-value">{user?.farm_location || t("profile.notProvided")}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>{t("profile.farmStats")}</h3>
                <div className="stats-grid-full">
                  <div className="stat-card">
                    <span className="stat-value-large">{user?.totalScans || 0}</span>
                    <span className="stat-label">{t("profile.totalScans")}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value-large">{formatDate(user?.memberSince).split(',')[0]}</span>
                    <span className="stat-label">{t("profile.memberSince")}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value-large">{formatDate(user?.lastActive).split(',')[0]}</span>
                    <span className="stat-label">{t("profile.lastActive")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="gradient-bg">
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
        </div>

        <div className="login-wrapper">
          <div className="login-card">
            <div className="login-header">
              <div className="logo-icon">🌾</div>
              <h1 className="login-title">{t("app.name")}</h1>
              <p className="login-subtitle">{t("app.tagline")}</p>
              <LanguageSwitcher compact />
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(true)}
              >
                {t("auth.login")}
              </button>
              <button 
                className={`auth-tab ${!showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(false)}
              >
                {t("auth.createAccount")}
              </button>
            </div>

            {showLogin ? (
              <div className="login-form-container">
                <h2>{t("auth.welcomeBack")}</h2>
                <p className="form-subtitle">{t("auth.signInSubtitle")}</p>

                {loginError && (
                  <div className="error-alert">
                    <span className="error-icon">⚠️</span>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                  <div className="input-group">
                    <label>{t("auth.emailAddress")}</label>
                    <input
                      type="email"
                      name="email"
                      placeholder={t("auth.placeholders.email")}
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.password")}</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={t("auth.placeholders.password")}
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={apiLoading}>
                    {apiLoading ? t("auth.signingIn") : t("auth.signIn")}
                    <span className="btn-arrow">→</span>
                  </button>
                </form>

                <div className="login-footer">
                  <p>
                    {t("auth.dontHaveAccount")}{" "}
                    <span className="create-account-link" onClick={() => setShowLogin(false)}>{t("auth.createOneHere")}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="login-form-container">
                <h2>{t("auth.createAccountTitle")}</h2>
                <p className="form-subtitle">{t("auth.createAccountSubtitle")}</p>

                {registerError && (
                  <div className="error-alert">
                    <span className="error-icon">⚠️</span>
                    {registerError}
                  </div>
                )}

                {registerSuccess && (
                  <div className="success-alert">
                    <span className="success-icon">✅</span>
                    {registerSuccess}
                  </div>
                )}

                <form onSubmit={handleRegister} className="login-form">
                  <div className="input-group">
                    <label>{t("auth.fullNameRequired")}</label>
                    <input
                      type="text"
                      name="name"
                      placeholder={t("auth.placeholders.fullName")}
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.emailAddressRequired")}</label>
                    <input
                      type="email"
                      name="email"
                      placeholder={t("auth.placeholders.email")}
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.phoneNumber")}</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder={t("auth.placeholders.phone")}
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.farmLocation")}</label>
                    <input
                      type="text"
                      name="farm_location"
                      placeholder={t("auth.placeholders.farmLocation")}
                      value={registerData.farm_location}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.password")} *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={t("auth.placeholders.password")}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>{t("auth.confirmPasswordRequired")}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder={t("auth.placeholders.password")}
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={apiLoading}>
                    {apiLoading ? t("auth.creatingAccount") : t("auth.createAccountButton")}
                    <span className="btn-arrow">→</span>
                  </button>
                </form>

                <div className="login-footer">
                  <p>
                    {t("auth.alreadyHaveAccount")}{" "}
                    <span className="create-account-link" onClick={() => setShowLogin(true)}>{t("auth.signInHere")}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>{t("features.aiAnalysis")}</h3>
              <p>{t("features.aiAnalysisDesc")}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t("features.realTimeResults")}</h3>
              <p>{t("features.realTimeResultsDesc")}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>{t("features.smartFarming")}</h3>
              <p>{t("features.smartFarmingDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App with Profile Dropdown
  return (
    <div className="app">
      <div className="gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-with-text">
              <span className="logo-icon-large">🌾</span>
              <div>
                <h1 className="header-title">{t("app.name")}</h1>
                <p className="header-subtitle">{t("app.headerSubtitle")}</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <LanguageSwitcher />
            <div className="user-badge-wrapper">
              <div 
                className="user-badge clickable"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <span className="user-avatar">👨‍🌾</span>
                <span className="user-name">{user?.name || 'Farmer'}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-menu">
                    <button onClick={() => {
                      setShowProfile(true);
                      setShowProfileDropdown(false);
                    }}>
                      <span>👤</span> {t("dashboard.viewProfile")}
                    </button>
                    <button onClick={() => {
                      setEditingProfile(true);
                      setShowProfile(true);
                      setShowProfileDropdown(false);
                    }}>
                      <span>✏️</span> {t("dashboard.editProfile")}
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={logout} className="logout-dropdown">
                      <span>🚪</span> {t("dashboard.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          {showProfile ? (
            <ProfileView />
          ) : (
            <>
              <div className="welcome-section">
                <h2 className="welcome-title">{t("dashboard.welcomeTitle")}</h2>
                <p className="welcome-text">
                  {t("dashboard.welcomeText")}
                </p>
              </div>

              <div className="content-grid">
                <div className="upload-column">
                  <div className="upload-card">
                    <div className="card-header">
                      <h3>{t("upload.uploadImage")}</h3>
                      <span className="badge">{t("upload.required")}</span>
                    </div>
                    
                    <div {...getRootProps()} className="dropzone">
                      <input {...getInputProps()} />
                      <div className="dropzone-content">
                        <div className="upload-icon">📸</div>
                        <h4>{t("upload.dragDrop")}</h4>
                        <p>{t("upload.clickOrDrag")}</p>
                        <span className="file-types">{t("upload.supports")}</span>
                        <button className="browse-btn">{t("upload.browseFiles")}</button>
                      </div>
                    </div>

                    {image && (
                      <div className="preview-card">
                        <div className="preview-header">
                          <h4>{t("upload.preview")}</h4>
                          <span className="preview-badge">{t("upload.uploaded")}</span>
                        </div>
                        <div className="image-preview">
                          <img src={image} alt="preview" />
                        </div>
                        <button 
                          onClick={analyzeImage} 
                          disabled={loading}
                          className={`analyze-btn ${loading ? 'loading' : ''}`}
                        >
                          {loading ? (
                            <>
                              <span className="spinner"></span>
                              {t("upload.analyzing")}
                            </>
                          ) : (
                            <>
                              <span>{t("upload.analyzeImage")}</span>
                              <span className="btn-icon">→</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="results-column">
                  {loading && (
                    <div className="loading-card">
                      <div className="loading-spinner"></div>
                      <h3>{t("upload.processingImage")}</h3>
                      <p>{t("upload.processingSubtitle")}</p>
                    </div>
                  )}

                  {result && !result.error && (
                    <div className="results-card">
                      <div className="results-header">
                        <h3>{t("results.analysisResults")}</h3>
                        <span className="success-badge">{t("results.complete")}</span>
                      </div>

                      <div className="severity-meter">
                        <div className="meter-header">
                          <span>{t("results.severityLevel")}</span>
                          <span className="severity-value">{result.severity}</span>
                        </div>
                        <div className="meter-bar">
                          <div 
                            className={`meter-fill ${result.severity?.toLowerCase()}`}
                            style={{ width: `${result.confidence}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="stats-grid">
                        <div className="stat-item">
                          <span className="stat-label">{t("results.confidence")}</span>
                          <span className="stat-value">{result.confidence}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">{t("results.lodgedArea")}</span>
                          <span className="stat-value">{result.lodged_area_percent}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">{t("results.patches")}</span>
                          <span className="stat-value">{result.lodging_patches}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">{t("results.method")}</span>
                          <span className="stat-value">{result.method}</span>
                        </div>
                      </div>

                      <div className="recommendation-box">
                        <h4>{t("results.recommendation")}</h4>
                        <p>{result.recommendation}</p>
                      </div>

                      <details className="technical-details">
                        <summary>{t("results.technicalDetails")}</summary>
                        <div className="details-content">
                          <p><strong>{t("results.rawScore")}</strong> {result.raw_score}</p>
                          <p><strong>{t("results.threshold")}</strong> {result.threshold}</p>
                        </div>
                      </details>
                    </div>
                  )}

                  {result?.images && (
                    <div className="visual-analysis-card">
                      <h3>{t("visual.visualAnalysis")}</h3>
                      <div className="image-grid">
                        <div className="grid-item">
                          <span className="image-label">{t("visual.original")}</span>
                          <img src={result.images.original} alt="original" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">{t("visual.heatmap")}</span>
                          <img src={result.images.heatmap} alt="heatmap" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">{t("visual.mask")}</span>
                          <img src={result.images.mask} alt="mask" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">{t("visual.boundary")}</span>
                          <img src={result.images.boundary} alt="boundary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {result?.error && (
                    <div className="error-card">
                      <span className="error-icon-large">⚠️</span>
                      <h3>{t("errors.analysisFailed")}</h3>
                      <p>{result.error}</p>
                      <button onClick={() => setResult(null)} className="retry-btn">
                        {t("errors.tryAgain")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
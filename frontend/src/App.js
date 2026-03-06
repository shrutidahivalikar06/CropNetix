import "./App.css";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

function App() {
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
        setResult({ error: data.detail || "Prediction failed" });
      }
    } catch (error) {
      console.error(error);
      setResult({ error: "Server connection failed" });
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
        
        // Use user data from response if available
        const userData = data.user || {
          email: loginData.email,
          name: loginData.email.split('@')[0],
          phone: "",
          farm_location: "",
          totalScans: 0,
          memberSince: new Date().toISOString(),
          lastActive: new Date().toISOString()
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
        setLoginError(data.detail || "Invalid login credentials");
      }
    } catch (error) {
      setLoginError("Server connection failed");
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
      setRegisterError("Please fill in all required fields");
      setApiLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      setApiLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError("Password must be at least 6 characters");
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
        setRegisterSuccess("Registration successful! Please login.");
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
        setRegisterError(data.detail || "Registration failed");
      }
    } catch (error) {
      setRegisterError("Server connection failed");
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
        setProfileUpdateSuccess("Profile updated successfully!");
        setEditingProfile(false);
        setShowProfileDropdown(false);
        
        setTimeout(() => {
          setProfileUpdateSuccess("");
        }, 3000);
      } else {
        setProfileUpdateSuccess(data.detail || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileUpdateSuccess("Failed to connect to server");
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
        <h2>Farmer Profile</h2>
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
              <label htmlFor="profile-pic-input-full">Change Photo</label>
            </div>
          )}
        </div>

        <div className="profile-right">
          {editingProfile ? (
            <form className="profile-edit-form-full" onSubmit={handleProfileUpdate}>
              <div className="form-row">
                <div className="form-group-full">
                  <label>Full Name</label>
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
                  <label>Email</label>
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
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter phone number"
                    disabled={apiLoading}
                  />
                </div>

                <div className="form-group-full">
                  <label>Farm Location</label>
                  <input
                    type="text"
                    name="farm_location"
                    value={profileData.farm_location}
                    onChange={handleProfileChange}
                    placeholder="Enter farm location"
                    disabled={apiLoading}
                  />
                </div>
              </div>

              <div className="profile-edit-actions-full">
                <button type="submit" className="save-profile-btn-full" disabled={apiLoading}>
                  {apiLoading ? "Saving..." : "Save Changes"}
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
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-full">
              <div className="info-section">
                <h3>Personal Information</h3>
                <div className="info-grid-full">
                  <div className="info-item-full">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{user?.name || "Not set"}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{user?.phone || "Not provided"}</span>
                  </div>
                  <div className="info-item-full">
                    <span className="info-label">Farm Location</span>
                    <span className="info-value">{user?.farm_location || "Not provided"}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Farm Statistics</h3>
                <div className="stats-grid-full">
                  <div className="stat-card">
                    <span className="stat-value-large">{user?.totalScans || 0}</span>
                    <span className="stat-label">Total Scans</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value-large">{formatDate(user?.memberSince).split(',')[0]}</span>
                    <span className="stat-label">Member Since</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value-large">{formatDate(user?.lastActive).split(',')[0]}</span>
                    <span className="stat-label">Last Active</span>
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
              <h1 className="login-title">CropNetix</h1>
              <p className="login-subtitle">AI-Powered Crop Health Detection</p>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(true)}
              >
                Login
              </button>
              <button 
                className={`auth-tab ${!showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(false)}
              >
                Create Account
              </button>
            </div>

            {showLogin ? (
              <div className="login-form-container">
                <h2>Welcome Back</h2>
                <p className="form-subtitle">Sign in to continue to your dashboard</p>

                {loginError && (
                  <div className="error-alert">
                    <span className="error-icon">⚠️</span>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                  <div className="input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="farmer@example.com"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={apiLoading}>
                    {apiLoading ? "Signing in..." : "Sign In"}
                    <span className="btn-arrow">→</span>
                  </button>
                </form>

                <div className="login-footer">
                  <p>Don't have an account? <span className="create-account-link" onClick={() => setShowLogin(false)}>Create one here</span></p>
                </div>
              </div>
            ) : (
              <div className="login-form-container">
                <h2>Create Account</h2>
                <p className="form-subtitle">Join CropNetix for smart farming</p>

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
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Farmer"
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="farmer@example.com"
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Farm Location</label>
                    <input
                      type="text"
                      name="farm_location"
                      placeholder="District, State"
                      value={registerData.farm_location}
                      onChange={handleRegisterChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <button type="submit" className="login-submit-btn" disabled={apiLoading}>
                    {apiLoading ? "Creating Account..." : "Create Account"}
                    <span className="btn-arrow">→</span>
                  </button>
                </form>

                <div className="login-footer">
                  <p>Already have an account? <span className="create-account-link" onClick={() => setShowLogin(true)}>Sign in</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <h3>AI Analysis</h3>
              <p>Advanced deep learning models for accurate crop lodging detection</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Results</h3>
              <p>Get instant analysis with severity assessment and recommendations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌱</div>
              <h3>Smart Farming</h3>
              <p>Make data-driven decisions to protect your crops</p>
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
                <h1 className="header-title">CropNetix</h1>
                <p className="header-subtitle">Crop Health Intelligence</p>
              </div>
            </div>
          </div>
          <div className="header-right">
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
                      <span>👤</span> View Profile
                    </button>
                    <button onClick={() => {
                      setEditingProfile(true);
                      setShowProfile(true);
                      setShowProfileDropdown(false);
                    }}>
                      <span>✏️</span> Edit Profile
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={logout} className="logout-dropdown">
                      <span>🚪</span> Logout
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
                <h2 className="welcome-title">Crop Lodging Detection System</h2>
                <p className="welcome-text">
                  Upload a field image to analyze crop lodging severity using our advanced AI model
                </p>
              </div>

              <div className="content-grid">
                <div className="upload-column">
                  <div className="upload-card">
                    <div className="card-header">
                      <h3>Upload Image</h3>
                      <span className="badge">Required</span>
                    </div>
                    
                    <div {...getRootProps()} className="dropzone">
                      <input {...getInputProps()} />
                      <div className="dropzone-content">
                        <div className="upload-icon">📸</div>
                        <h4>Drag & Drop</h4>
                        <p>Click or drag image to upload</p>
                        <span className="file-types">Supports: JPG, PNG</span>
                        <button className="browse-btn">Browse Files</button>
                      </div>
                    </div>

                    {image && (
                      <div className="preview-card">
                        <div className="preview-header">
                          <h4>Preview</h4>
                          <span className="preview-badge">Uploaded</span>
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
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <span>Analyze Image</span>
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
                      <h3>Processing Image</h3>
                      <p>Our AI model is analyzing your crop image...</p>
                    </div>
                  )}

                  {result && !result.error && (
                    <div className="results-card">
                      <div className="results-header">
                        <h3>Analysis Results</h3>
                        <span className="success-badge">Complete</span>
                      </div>

                      <div className="severity-meter">
                        <div className="meter-header">
                          <span>Severity Level</span>
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
                          <span className="stat-label">Confidence</span>
                          <span className="stat-value">{result.confidence}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Lodged Area</span>
                          <span className="stat-value">{result.lodged_area_percent}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Patches</span>
                          <span className="stat-value">{result.lodging_patches}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Method</span>
                          <span className="stat-value">{result.method}</span>
                        </div>
                      </div>

                      <div className="recommendation-box">
                        <h4>Recommendation</h4>
                        <p>{result.recommendation}</p>
                      </div>

                      <details className="technical-details">
                        <summary>Technical Details</summary>
                        <div className="details-content">
                          <p><strong>Raw Score:</strong> {result.raw_score}</p>
                          <p><strong>Threshold:</strong> {result.threshold}</p>
                        </div>
                      </details>
                    </div>
                  )}

                  {result?.images && (
                    <div className="visual-analysis-card">
                      <h3>Visual Analysis</h3>
                      <div className="image-grid">
                        <div className="grid-item">
                          <span className="image-label">Original</span>
                          <img src={result.images.original} alt="original" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">Heatmap</span>
                          <img src={result.images.heatmap} alt="heatmap" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">Mask</span>
                          <img src={result.images.mask} alt="mask" />
                        </div>
                        <div className="grid-item">
                          <span className="image-label">Boundary</span>
                          <img src={result.images.boundary} alt="boundary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {result?.error && (
                    <div className="error-card">
                      <span className="error-icon-large">⚠️</span>
                      <h3>Analysis Failed</h3>
                      <p>{result.error}</p>
                      <button onClick={() => setResult(null)} className="retry-btn">
                        Try Again
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
import "./App.css";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";

// Language translations
const translations = {
  en: {
    brand: "🌾 CropNetix",
    tagline: "AI-powered crop health detection for farmers",
    welcome: "Welcome back",
    farmer: "Farmer",
    logout: "Logout",
    title: "Crop Lodging Detection System 🌾",
    subtitle: "Upload a field image to detect lodging severity using AI",
    selectImage: "Select Image Files",
    dragDrop: "⬆️ Or Drag & Drop an Image Here",
    uploadedImage: "Uploaded Image",
    analyze: "Analyze Image",
    analyzing: "Analyzing Image with AI...",
    detectionResult: "Detection Result",
    login: "Login",
    register: "Register",
    farmerLogin: "Farmer Login",
    farmerRegistration: "Farmer Registration",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    farmLocation: "Farm Location",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    registerHere: "Register here",
    loginHere: "Login here",
    loggingIn: "Logging in...",
    registering: "Registering...",
    profile: "Farmer Profile",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    personalInfo: "Personal Information",
    farmInfo: "Farm Information",
    memberSince: "Member Since",
    totalScans: "Total Scans",
    lastActive: "Last Active",
    language: "Language",
    selectLanguage: "Select Language",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी"
  },
  hi: {
    brand: "🌾 क्रॉपनेटिक्स",
    tagline: "किसानों के लिए AI-संचालित फसल स्वास्थ्य जांच",
    welcome: "वापसी पर स्वागत है",
    farmer: "किसान",
    logout: "लॉग आउट",
    title: "फसल लॉजिंग डिटेक्शन सिस्टम 🌾",
    subtitle: "AI का उपयोग करके फसल लॉजिंग की गंभीरता का पता लगाने के लिए फ़ील्ड छवि अपलोड करें",
    selectImage: "छवि फ़ाइलें चुनें",
    dragDrop: "⬆️ या छवि को यहाँ खींचें और छोड़ें",
    uploadedImage: "अपलोड की गई छवि",
    analyze: "छवि का विश्लेषण करें",
    analyzing: "AI के साथ छवि का विश्लेषण हो रहा है...",
    detectionResult: "पहचान परिणाम",
    login: "लॉग इन",
    register: "पंजीकरण",
    farmerLogin: "किसान लॉग इन",
    farmerRegistration: "किसान पंजीकरण",
    email: "ईमेल पता",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    fullName: "पूरा नाम",
    phoneNumber: "फ़ोन नंबर",
    farmLocation: "खेत का स्थान",
    dontHaveAccount: "खाता नहीं है?",
    alreadyHaveAccount: "पहले से ही खाता है?",
    registerHere: "यहाँ पंजीकरण करें",
    loginHere: "यहाँ लॉग इन करें",
    loggingIn: "लॉग इन हो रहा है...",
    registering: "पंजीकरण हो रहा है...",
    profile: "किसान प्रोफ़ाइल",
    editProfile: "प्रोफ़ाइल संपादित करें",
    saveChanges: "परिवर्तन सहेजें",
    cancel: "रद्द करें",
    personalInfo: "व्यक्तिगत जानकारी",
    farmInfo: "खेत की जानकारी",
    memberSince: "सदस्यता से",
    totalScans: "कुल स्कैन",
    lastActive: "पिछली गतिविधि",
    language: "भाषा",
    selectLanguage: "भाषा चुनें",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी"
  },
  mr: {
    brand: "🌾 क्रॉपनेटिक्स",
    tagline: "शेतकऱ्यांसाठी AI-चालित पीक आरोग्य तपासणी",
    welcome: "पुन्हा स्वागत आहे",
    farmer: "शेतकरी",
    logout: "लॉगआउट",
    title: "पीक लॉजिंग डिटेक्शन सिस्टम 🌾",
    subtitle: "AI वापरून पीक लॉजिंगची तीव्रता शोधण्यासाठी फील्ड प्रतिमा अपलोड करा",
    selectImage: "प्रतिमा फाइल्स निवडा",
    dragDrop: "⬆️ किंवा प्रतिमा येथे ड्रॅग आणि ड्रॉप करा",
    uploadedImage: "अपलोड केलेली प्रतिमा",
    analyze: "प्रतिमेचे विश्लेषण करा",
    analyzing: "AI सह प्रतिमेचे विश्लेषण होत आहे...",
    detectionResult: "शोध परिणाम",
    login: "लॉगिन",
    register: "नोंदणी",
    farmerLogin: "शेतकरी लॉगिन",
    farmerRegistration: "शेतकरी नोंदणी",
    email: "ईमेल पत्ता",
    password: "पासवर्ड",
    confirmPassword: "पासवर्डची पुष्टी करा",
    fullName: "पूर्ण नाव",
    phoneNumber: "फोन नंबर",
    farmLocation: "शेताचे स्थान",
    dontHaveAccount: "खाते नाही?",
    alreadyHaveAccount: "आधीपासून खाते आहे?",
    registerHere: "येथे नोंदणी करा",
    loginHere: "येथे लॉगिन करा",
    loggingIn: "लॉगिन होत आहे...",
    registering: "नोंदणी होत आहे...",
    profile: "शेतकरी प्रोफाइल",
    editProfile: "प्रोफाइल संपादित करा",
    saveChanges: "बदल जतन करा",
    cancel: "रद्द करा",
    personalInfo: "वैयक्तिक माहिती",
    farmInfo: "शेत माहिती",
    memberSince: "सदस्यत्वापासून",
    totalScans: "एकूण स्कॅन",
    lastActive: "शेवटचा सक्रिय",
    language: "भाषा",
    selectLanguage: "भाषा निवडा",
    english: "English",
    hindi: "हिन्दी",
    marathi: "मराठी"
  }
};

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Language state
  const [language, setLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
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

  // Get current language translations
  const t = translations[language];

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    const savedLanguage = localStorage.getItem("language") || "en";
    
    setLanguage(savedLanguage);
    
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
      "image/*": [".jpeg", ".jpg", ".png", ".tiff", ".bmp"]
    }
  });

  const analyzeImage = async () => {
    if (!imageFile) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);

        if (user) {
          const updatedUser = {
            ...user,
            totalScans: (user?.totalScans || 0) + 1,
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } else {
        setResult({
          error: data.detail 
            ? (typeof data.detail === "string" 
                ? data.detail 
                : JSON.stringify(data.detail))
            : "Error analyzing image",
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setResult({ error: "Failed to connect to server" });
    } finally {
      setLoading(false);
    }
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
    
    if (!loginData.email || !loginData.password) {
      setLoginError("Please fill in all fields");
      setApiLoading(false);
      return;
    }
    
    try {
      // Your backend expects JSON with email field
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token (your backend returns "token")
        localStorage.setItem("access_token", data.token);
        
        // Create user object from login response
        const userWithStats = {
          email: loginData.email,
          name: loginData.email.split('@')[0], // Temporary name from email
          phone: "",
          farm_location: "",
          totalScans: 0,
          memberSince: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        
        localStorage.setItem("user", JSON.stringify(userWithStats));
        setUser(userWithStats);
        setProfileData({
          name: userWithStats.name,
          email: userWithStats.email,
          phone: "",
          farm_location: "",
          profile_picture: null
        });
        setIsLoggedIn(true);
        setLoginData({ email: "", password: "" });
        
      } else {
        // Handle error with proper formatting
        setLoginError(
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.[0]?.msg || "Invalid email or password"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Failed to connect to server. Please try again.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    setApiLoading(true);
    
    // Validation
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.confirmPassword) {
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
      setRegisterError("Password must be at least 6 characters long");
      setApiLoading(false);
      return;
    }
    
    // Remove confirmPassword before sending
    const { confirmPassword, ...registrationData } = registerData;
    
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRegisterSuccess("Registration successful! Please login.");
        
        // Reset form
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          farm_location: "",
          phone: ""
        });
        
        // Switch to login after 2 seconds
        setTimeout(() => {
          setShowLogin(true);
          setRegisterSuccess("");
        }, 2000);
      } else {
        // Handle error with proper formatting
        setRegisterError(
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.[0]?.msg || "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegisterError("Failed to connect to server. Please try again.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setApiLoading(true);
    setProfileUpdateSuccess("");
    
    try {
      const response = await fetch("http://localhost:8000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          farm_location: profileData.farm_location
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileUpdateSuccess("Profile updated successfully!");
        setEditingProfile(false);
        
        setTimeout(() => {
          setProfileUpdateSuccess("");
        }, 3000);
      } else {
        setProfileUpdateSuccess(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to update profile"
        );
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileUpdateSuccess("Failed to connect to server");
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogout = () => {
    // Call logout endpoint
    fetch("http://localhost:8000/api/auth/logout", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    }).catch(err => console.log("Logout error:", err));
    
    // Clear local storage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    
    // Reset state
    setIsLoggedIn(false);
    setUser(null);
    setImage(null);
    setImageFile(null);
    setResult(null);
    setShowProfile(false);
    setEditingProfile(false);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    setShowLanguageDropdown(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(
        language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN'
      );
    } catch (e) {
      return "Invalid date";
    }
  };

  // Profile View Component
  const ProfileView = () => (
    <div className="profile-container">
      <div className="profile-header">
        <h2>{t.profile}</h2>
        {!editingProfile && (
          <button className="edit-profile-btn" onClick={() => setEditingProfile(true)}>
            {t.editProfile}
          </button>
        )}
      </div>

      {profileUpdateSuccess && (
        <div className={`profile-message ${profileUpdateSuccess.includes("Failed") ? "error" : "success"}`}>
          {profileUpdateSuccess}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-picture-section">
          <div className="profile-picture">
            {profileData.profile_picture ? (
              <img src={profileData.profile_picture} alt="Profile" />
            ) : (
              <div className="profile-initials">
                {user?.name?.charAt(0).toUpperCase() || "F"}
              </div>
            )}
          </div>
          {editingProfile && (
            <div className="profile-picture-upload">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                id="profile-pic-input"
              />
              <label htmlFor="profile-pic-input">Change Photo</label>
            </div>
          )}
        </div>

        {editingProfile ? (
          <form className="profile-edit-form" onSubmit={handleProfileUpdate}>
            <div className="form-group">
              <label>{t.fullName}</label>
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                required
                disabled={apiLoading}
              />
            </div>

            <div className="form-group">
              <label>{t.email}</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label>{t.phoneNumber}</label>
              <input
                type="tel"
                name="phone"
                value={profileData.phone}
                onChange={handleProfileChange}
                disabled={apiLoading}
              />
            </div>

            <div className="form-group">
              <label>{t.farmLocation}</label>
              <input
                type="text"
                name="farm_location"
                value={profileData.farm_location}
                onChange={handleProfileChange}
                disabled={apiLoading}
              />
            </div>

            <div className="profile-edit-actions">
              <button type="submit" className="save-profile-btn" disabled={apiLoading}>
                {apiLoading ? "Saving..." : t.saveChanges}
              </button>
              <button 
                type="button" 
                className="cancel-profile-btn"
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
                {t.cancel}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-info-section">
              <h3>{t.personalInfo}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t.fullName}:</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.email}:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.phoneNumber}:</span>
                  <span className="info-value">{user?.phone || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div className="profile-info-section">
              <h3>{t.farmInfo}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t.farmLocation}:</span>
                  <span className="info-value">{user?.farm_location || "Not provided"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.memberSince}:</span>
                  <span className="info-value">{formatDate(user?.memberSince)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.totalScans}:</span>
                  <span className="info-value">{user?.totalScans || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">{t.lastActive}:</span>
                  <span className="info-value">{formatDate(user?.lastActive)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If not logged in, show login/register page
  if (!isLoggedIn) {
    return (
      <div className="container">
        <div className="main-card">
          <div className="header-with-controls">
            <div>
              <h1 className="brand">{t.brand}</h1>
              <p className="tagline">{t.tagline}</p>
            </div>
            <div className="language-selector">
              <button 
                className="language-btn"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                🌐 {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
              {showLanguageDropdown && (
                <div className="language-dropdown">
                  <button onClick={() => changeLanguage('en')}>English</button>
                  <button onClick={() => changeLanguage('hi')}>हिन्दी</button>
                  <button onClick={() => changeLanguage('mr')}>मराठी</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="auth-container">
            <div className="auth-tabs">
              <button 
                className={`auth-tab ${showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(true)}
              >
                {t.login}
              </button>
              <button 
                className={`auth-tab ${!showLogin ? 'active' : ''}`}
                onClick={() => setShowLogin(false)}
              >
                {t.register}
              </button>
            </div>
            
            {showLogin ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <h2>{t.farmerLogin}</h2>
                
                {loginError && <div className="error-message">{loginError}</div>}
                
                <div className="form-group">
                  <label>{t.email}</label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    placeholder={t.email}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.password}</label>
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    placeholder={t.password}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <button type="submit" className="auth-btn" disabled={apiLoading}>
                  {apiLoading ? t.loggingIn : t.login}
                </button>
                
                <p className="auth-footer">
                  {t.dontHaveAccount}{" "}
                  <span onClick={() => setShowLogin(false)}>{t.registerHere}</span>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <h2>{t.farmerRegistration}</h2>
                
                {registerError && <div className="error-message">{registerError}</div>}
                {registerSuccess && <div className="success-message">{registerSuccess}</div>}
                
                <div className="form-group">
                  <label>{t.fullName} *</label>
                  <input
                    type="text"
                    name="name"
                    value={registerData.name}
                    onChange={handleRegisterChange}
                    placeholder={t.fullName}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.email} *</label>
                  <input
                    type="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    placeholder={t.email}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.phoneNumber}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    placeholder={t.phoneNumber}
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.farmLocation}</label>
                  <input
                    type="text"
                    name="farm_location"
                    value={registerData.farm_location}
                    onChange={handleRegisterChange}
                    placeholder={t.farmLocation}
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.password} *</label>
                  <input
                    type="password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    placeholder={t.password}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t.confirmPassword} *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerData.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder={t.confirmPassword}
                    required
                    disabled={apiLoading}
                  />
                </div>
                
                <button type="submit" className="auth-btn" disabled={apiLoading}>
                  {apiLoading ? t.registering : t.register}
                </button>
                
                <p className="auth-footer">
                  {t.alreadyHaveAccount}{" "}
                  <span onClick={() => setShowLogin(true)}>{t.loginHere}</span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main app content (when logged in)
  return (
    <div className="container">
      <div className="main-card">
        <div className="header-with-controls">
          <div>
            <h1 className="brand">{t.brand}</h1>
            <p className="tagline">{t.tagline}</p>
          </div>
          <div className="header-actions">
            <div className="language-selector">
              <button 
                className="language-btn"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                🌐 {language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
              {showLanguageDropdown && (
                <div className="language-dropdown">
                  <button onClick={() => changeLanguage('en')}>English</button>
                  <button onClick={() => changeLanguage('hi')}>हिन्दी</button>
                  <button onClick={() => changeLanguage('mr')}>मराठी</button>
                </div>
              )}
            </div>
            <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
              👤 {t.profile}
            </button>
            <button onClick={handleLogout} className="logout-btn" disabled={loading}>
              {t.logout}
            </button>
          </div>
        </div>

        {showProfile ? (
          <ProfileView />
        ) : (
          <>
            <h1 className="title">{t.title}</h1>
            <p className="subtitle">{t.subtitle}</p>

            <div {...getRootProps()} className="upload-box">
              <input {...getInputProps()} />
              <button className="upload-button" disabled={loading}>
                {t.selectImage}
              </button>
              <p>{t.dragDrop}</p>       
            </div>

            {image && (
              <div className="preview-section">
                <h3>{t.uploadedImage}</h3>
                <img src={image} alt="preview" />
                <button 
                  className="analyze-btn" 
                  onClick={analyzeImage}
                  disabled={loading}
                >
                  {loading ? t.analyzing : t.analyze}
                </button>

                {loading && <p className="loading-text">{t.analyzing}</p>}

                {result && !loading && !result.error && (
                  <div className="result-box">
                    <h2>{t.detectionResult}</h2>

                    <p className="result-text">
                      <strong>Severity:</strong> {result.severity}
                    </p>

                    <p className="result-text">
                      <strong>Recommendation:</strong> {result.recommendation}
                    </p>

                    <p className="result-text">
                      <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
                    </p>

                    <div className="severity-bar">
                      <div
                        className={`severity-fill ${
                          result.severity?.toLowerCase().includes("severe")
                            ? "severe"
                            : result.severity?.toLowerCase().includes("moderate")
                            ? "moderate"
                            : "healthy"
                        }`}
                        style={{ width: `${result.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Show prediction error if any */}
                {result?.error && (
                  <div className="error-message">
                    {result.error}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
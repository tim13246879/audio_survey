import { useEffect, useState } from "react";

const GoogleLogin = ({ onLogin }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Function to load the Google API script
    const loadGoogleScript = () => {
      // Check if script is already loaded
      if (typeof window.google !== 'undefined') {
        setScriptLoaded(true);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => {
        console.error('Error loading Google Sign-In script');
      };
      
      // Add the script to the document
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  useEffect(() => {
    // Only initialize and render button when script is loaded
    if (scriptLoaded && window.google) {
      /* Initialize Google Sign-In */
      window.google.accounts.id.initialize({
        client_id: "54334032968-615vpu1i2p5tilf0l35fgksign49jq4m.apps.googleusercontent.com",
        callback: handleCredentialResponse
      });

      /* Render Google Sign-In button */
      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        { theme: "outline", size: "large" }
      );
    }
  }, [scriptLoaded]);

  const handleCredentialResponse = (response) => {
    // Send token to backend
    onLogin(response.credential);
  };

  return <div id="google-login-button"></div>;
};

export default GoogleLogin;

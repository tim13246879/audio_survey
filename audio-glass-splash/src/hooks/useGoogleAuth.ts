import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";

// Define types for Google authentication
interface GoogleUser {
  user_id: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  user: GoogleUser;
  status: string;
  message?: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  // Load the Google API script on component mount
  useEffect(() => {
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
      script.onload = () => {
        console.log("Google Sign-In script loaded successfully");
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Error loading Google Sign-In script');
        toast({
          title: "Error",
          description: "Failed to load Google authentication service",
          variant: "destructive"
        });
      };
      
      // Add the script to the document
      document.body.appendChild(script);
    };

    loadGoogleScript();

    // Check if user is already logged in from localStorage
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize Google Sign-In and render button when script is loaded
  useEffect(() => {
    if (scriptLoaded && window.google && window.google.accounts) {
      try {
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: "54334032968-615vpu1i2p5tilf0l35fgksign49jq4m.apps.googleusercontent.com",
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        console.log("Google Auth initialized successfully");
        
        // Find and render the button in the container
        const buttonContainer = document.getElementById("google-login-button");
        if (buttonContainer) {
          window.google.accounts.id.renderButton(
            buttonContainer,
            { 
              theme: "outline", 
              size: "large",
              type: "standard",
              shape: "rectangular",
              text: "signin_with",
              logo_alignment: "left"
            }
          );
          console.log("Google button rendered successfully");
        } else {
          console.error("Google button container not found");
        }
      } catch (error) {
        console.error("Failed to initialize Google Auth:", error);
      }
    }
  }, [scriptLoaded]);

  // Handle the credential response from Google
  const handleCredentialResponse = async (response: any) => {
    console.log("Received credential response:", response);
    
    setIsLoading(true);
    
    try {
      if (!response || !response.credential) {
        throw new Error("Invalid credential response");
      }
      
      const token = response.credential;
      localStorage.setItem('authToken', token);
      console.log("Token set in localStorage:", token);
      
      // Send token to backend for verification and registration
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      const data: AuthResponse = await res.json();
      
      if (data.status === "success") {
        // Store authentication data
        setIsAuthenticated(true);
        // setUser(data.user);
        // localStorage.setItem('authUser', JSON.stringify(data.user));
        
        toast({
          title: "Authentication Successful",
          description: "You have been successfully signed in",
        });
      } else {
        throw new Error(data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Could not complete authentication",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
  };

  return {
    isLoading,
    isAuthenticated,
    token,
    handleSignOut
  };
};

// Type definition for window.google
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
} 
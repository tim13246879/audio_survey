import { useState } from "react";
import AudioSurveyLogo from "@/components/AudioSurveyLogo";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import BackgroundElements from "@/components/BackgroundElements";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { Navigate } from "react-router-dom";
const Index = () => {
  const [isHovering, setIsHovering] = useState(false);
  const { isLoading, isAuthenticated, handleSignOut } = useGoogleAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4">
      <BackgroundElements />
      
      {/* Main content container */}
      <div 
        className="max-w-lg w-full relative z-10"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Logo area */}
        <div className="mb-12 flex flex-col items-center">
          <AudioSurveyLogo className="mb-3" />
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-glass-border to-transparent my-3"></div>
          <p className="text-muted-foreground text-sm text-center max-w-sm">
            Capture audio feedback effortlessly.
          </p>
        </div>
        
        {/* Glass card */}
        <div 
          className={`glass-card rounded-2xl p-8 transition-all duration-500 ${
            isHovering ? 'shadow-lg scale-[1.02]' : 'shadow-md'
          }`}
        >
          {isAuthenticated ? (
            // Authenticated state
            <>
              <div className="flex flex-col items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary-purple/30">
                  {/* <AvatarImage src={user.picture} alt={user.name} /> */}
                  {/* <AvatarFallback>{user.name.charAt(0)}</AvatarFallback> */}
                </Avatar>
                
                <div className="text-center">
                  {/* <h2 className="text-xl font-medium">{user.name}</h2>
                  <p className="text-muted-foreground text-sm">{user.email}</p> */}
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Not authenticated state
            <>
              <h1 className="text-2xl font-medium text-center mb-8">
                Welcome to <span className="text-gradient font-semibold">Audio Survey</span>
              </h1>
              
              <div className="text-center text-muted-foreground text-sm mb-8">
                Please sign in to continue to your surveys
              </div>
              
              <div className="flex justify-center">
                <GoogleSignInButton isLoading={isLoading} />
              </div>

              {/* Add fallback message */}
              <div className="mt-4 text-xs text-center text-muted-foreground">
                <p>Having trouble signing in?</p>
                <button 
                  className="text-primary-purple hover:underline focus:outline-none" 
                  onClick={() => {
                    window.open("http://localhost:5000/api/auth/login", "_blank");
                  }}
                >
                  Try alternative login method
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Accent elements */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary-purple/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-secondary-purple/10 rounded-full blur-lg"></div>
      </div>
      
      {/* Attribution */}
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Audio Survey
      </div>
    </div>
  );
};

export default Index;


import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import AudioSurveyLogo from "@/components/AudioSurveyLogo";
import BackgroundElements from "@/components/BackgroundElements";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative p-4">
      <BackgroundElements />
      
      <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center relative z-10">
        <AudioSurveyLogo className="mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4 text-gradient">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page doesn't exist
        </p>
        <Button asChild className="btn-gradient text-white">
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;


import { cn } from "@/lib/utils";

interface AudioSurveyLogoProps {
  className?: string;
}

const AudioSurveyLogo = ({ className }: AudioSurveyLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        <div className="absolute w-10 h-10 bg-gradient-to-r from-primary-purple to-secondary-purple rounded-full opacity-70 animate-pulse-soft"></div>
        <svg
          className="w-6 h-6 text-white relative z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </div>
      <div className="font-medium text-xl tracking-tight">
        <span className="text-gradient">Audio</span>
        <span className="text-dark-text">Survey</span>
      </div>
    </div>
  );
};

export default AudioSurveyLogo;

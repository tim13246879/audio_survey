import { useEffect } from "react";

interface GoogleSignInButtonProps {
  isLoading?: boolean;
}

const GoogleSignInButton = ({ isLoading = false }: GoogleSignInButtonProps) => {
  return (
    <div className="flex items-center justify-center">
      {isLoading ? (
        <div className="flex items-center gap-2 bg-white text-dark-text font-medium px-6 py-4 rounded-xl shadow-md">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-purple border-t-transparent"></div>
          <span className="text-base">Signing in...</span>
        </div>
      ) : (
        <div id="google-login-button" className="min-h-[46px]"></div>
      )}
    </div>
  );
};

export default GoogleSignInButton;

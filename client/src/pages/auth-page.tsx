import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthForm from "@/components/auth-form";
import { useAuth } from "@/hooks/use-auth";

const AuthPage = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  // If still loading, show nothing to prevent flicker
  if (isLoading) {
    return null;
  }

  return <AuthForm />;
};

export default AuthPage;

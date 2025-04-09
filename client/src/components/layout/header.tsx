import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
  notifications?: number;
}

const Header = ({ title, notifications = 0 }: HeaderProps) => {
  const { user } = useAuth();
  
  // Get user initials
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  
  return (
    <header className="bg-white shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button className="p-2 text-neutral-700 hover:text-primary relative">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {notifications}
                </span>
              )}
            </button>
          </div>
          <div className="md:hidden flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span>{userInitials}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

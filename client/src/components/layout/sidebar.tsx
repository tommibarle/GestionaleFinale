import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  PackageOpen,
  ShoppingCart,
  Users,
  Menu,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  isMobile: boolean;
}

const Sidebar = ({ isMobile }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Get user initials
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const navLinks = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5" />,
      active: location === "/",
    },
    {
      href: "/articoli",
      label: "Articoli",
      icon: <Package className="w-5" />,
      active: location === "/articoli",
    },
    {
      href: "/prodotti",
      label: "Prodotti",
      icon: <PackageOpen className="w-5" />,
      active: location === "/prodotti",
    },
    {
      href: "/ordini",
      label: "Ordini",
      icon: <ShoppingCart className="w-5" />,
      active: location === "/ordini",
    },
    // Mostra il link Utenti e Parametri solo agli amministratori
    ...(user?.role === 'admin' ? [
      {
        href: "/utenti",
        label: "Utenti",
        icon: <Users className="w-5" />,
        active: location === "/utenti",
      },
      {
        href: "/parametri",
        label: "Parametri",
        icon: <Settings className="w-5" />,
        active: location === "/parametri",
      }
    ] : []),
  ];

  return (
    <aside className="bg-white shadow-md w-full md:w-64 md:min-h-screen md:flex-shrink-0 transition-all">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            <span className="text-primary">Gestionale</span>
            <span className="text-neutral-800">Magazzino</span>
          </h1>
          {isMobile && (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-neutral-700 hover:text-primary"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>

      <nav
        className={`p-4 ${
          isMobile && !mobileMenuOpen ? "hidden" : "block"
        } md:block`}
      >
        <div className="space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 py-2 px-3 rounded-md ${
                link.active
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-full border-t border-neutral-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <span>{userInitials}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
            <p className="text-xs text-neutral-600">
              {user?.role === "admin" ? "Amministratore" : "Utente"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-neutral-700 hover:text-primary"
            disabled={logoutMutation.isPending}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AmazonAffiliateBanner from "@/components/AmazonAffiliateBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  location?: {
    pathname: string;
  };
}

const Header: React.FC<HeaderProps> = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaguesOpen, setIsLeaguesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  // Keep leagues menu open if we're on a league page
  useEffect(() => {
    const isLeaguePage = location.pathname.startsWith("/league/");
    setIsLeaguesOpen(isLeaguePage);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsLeaguesOpen(false);
      }
    };

    // Only add the event listener if the dropdown is open
    if (isLeaguesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLeaguesOpen]);

  const leagues = [
    { id: "nba", name: "NBA", icon: "🏀" },
    { id: "mlb", name: "MLB", icon: "⚾" },
    { id: "nfl", name: "NFL", icon: "🏈" },
    { id: "boxing", name: "Boxing", icon: "🥊" },
    { id: "soccer", name: "Soccer", icon: "⚽", comingSoon: true },
    { id: "ncaa", name: "NCAA Football", icon: "🏈", comingSoon: true },
  ];

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upcoming-games", label: "Games" },
    { to: "/news", label: "News" },
  ];

  // Don't render header on home page
  if (location.pathname === "/") return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="w-full">
        {/* Main header content */}
        {/* Frosted glass effect using CSS */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/80 -z-10"></div>
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo - Clickable to return to dashboard */}
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 group transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)]"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600">
                {/* Empty circle - moon emoji removed */}
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-700 ease-[cubic-bezier(0.16, 1, 0.3, 1)] truncate max-w-[150px] sm:max-w-none">
                Full Moon Odds
              </span>
            </Link>

            {/* Combined Navigation */}
            <div className="hidden md:ml-4 md:flex md:items-center md:space-x-1 flex-1">
              {/* Main Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2.5 rounded-md text-base font-medium ${
                    location.pathname === link.to
                      ? "bg-transparent text-gray-800 font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  } transition-all duration-200`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Leagues Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className={`px-3 py-2.5 rounded-md text-base font-medium flex items-center ${
                    location.pathname.startsWith("/league/")
                      ? "text-gray-800 font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  } transition-colors duration-200`}
                  onClick={() => setIsLeaguesOpen(!isLeaguesOpen)}
                  onMouseEnter={() => setIsLeaguesOpen(true)}
                  aria-expanded={isLeaguesOpen}
                  aria-haspopup="true"
                >
                  Leagues
                  <span
                    className={`ml-1 transition-transform duration-200 ${isLeaguesOpen ? "transform rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>
                <div
                  className={`absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-gray-200 ring-opacity-100 ${
                    isLeaguesOpen
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1 pointer-events-none"
                  } transform transition-all duration-200 ease-out z-50`}
                >
                  <div className="py-1">
                    {leagues.map((league) => (
                      <Link
                        key={league.id}
                        to={league.comingSoon ? "#" : `/league/${league.id}`}
                        className={`block px-4 py-2 text-sm ${
                          league.comingSoon
                            ? "text-gray-500 cursor-not-allowed"
                            : location.pathname === `/league/${league.id}`
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                        onClick={(e) => {
                          if (league.comingSoon) {
                            e.preventDefault();
                          } else {
                            setIsLeaguesOpen(false);
                          }
                        }}
                      >
                        <span className="mr-2">{league.icon}</span>
                        {league.name}
                        {league.comingSoon && (
                          <span className="ml-2 text-xs text-yellow-500">
                            (Coming Soon)
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="ml-4 flex items-center">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={
                            user.user_metadata?.name ||
                            user.email?.charAt(0).toUpperCase()
                          }
                        />
                        <AvatarFallback>
                          {user.user_metadata?.name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center space-x-6">
                  <Link
                    to="/"
                    className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    Home
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/login")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Sign in
                  </Button>
                  <Button size="sm" onClick={() => navigate("/signup")}>
                    Sign up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-gray-900 focus:outline-none p-2 rounded-full hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu - slide in from right */}
          <div
            className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl md:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            {/* Header with close button and auth actions */}
            <div className="border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex justify-between items-center p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mr-3">
                    <span className="text-white text-xl">🌙</span>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    Full Moon Odds
                  </h2>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none p-2 rounded-full hover:bg-white/50 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Auth Buttons - Moved to top */}
              {!user && (
                <div className="px-4 pb-4 flex space-x-3">
                  <Link
                    to="/login"
                    className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium text-gray-800 hover:bg-white/80 border border-gray-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-2">🔑</span> Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-base font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-md hover:shadow-lg transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-2">✨</span> Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div
              className={`overflow-y-auto pb-6 ${user ? "h-[calc(100%-64px)]" : "h-[calc(100%-120px)]"}`}
            >
              {/* Main Navigation */}
              <div className="p-2">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Menu
                </h3>
                <div className="space-y-1 mb-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center px-4 py-3.5 rounded-lg text-base font-medium transition-colors ${
                        location.pathname === link.to
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="mr-3 w-5 text-center">
                        {link.label === "Dashboard" && "📊"}
                        {link.label === "Games" && "🎮"}
                        {link.label === "News" && "📰"}
                      </span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Leagues Section */}
              <div className="p-2">
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                  <span className="mr-2">🏆</span>
                  Leagues
                </h3>
                <div className="grid grid-cols-2 gap-2 px-2 mb-4">
                  {leagues.map((league) => (
                    <Link
                      key={league.id}
                      to={league.comingSoon ? "#" : `/league/${league.id}`}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all ${
                        league.comingSoon
                          ? "opacity-60 cursor-not-allowed"
                          : location.pathname === `/league/${league.id}`
                            ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 shadow-md"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200"
                      }`}
                      onClick={(e) => {
                        if (league.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsMenuOpen(false);
                        }
                      }}
                    >
                      <span className="text-2xl mb-1">{league.icon}</span>
                      <span className="text-sm font-medium">{league.name}</span>
                      {league.comingSoon && (
                        <span className="mt-1 text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                          Coming Soon
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Profile Section - Only show if user is logged in */}
              {user && (
                <div className="p-2 border-t border-gray-100">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="w-9 h-9 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 flex items-center justify-center mr-3">
                      <span className="text-yellow-600">👤</span>
                    </span>
                    <div>
                      <div className="font-medium">My Profile</div>
                      <div className="text-xs text-gray-500">
                        View account details
                      </div>
                    </div>
                    <svg
                      className="ml-auto h-5 w-5 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              )}

              {/* App Version / Footer */}
              <div className="px-6 pt-4 mt-2">
                <p className="text-xs text-center text-gray-400">v1.0.0</p>
              </div>
            </div>
          </div>

          {/* Backdrop overlay */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-40"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            ></div>
          )}
        </div>
      </div>
      
      {/* Amazon Banner below header */}
      <div className="w-full sticky top-0 z-50">
        <AmazonAffiliateBanner />
      </div>
    </header>
  );
};

export default Header;

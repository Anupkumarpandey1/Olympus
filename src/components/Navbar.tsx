
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simplified navigation links - removed pricing, testimonials, etc.
  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
  ];

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id.replace('#', ''));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleLogoutClick = async () => {
    await signOut();
    navigate('/');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/quiz-generator');
    } else {
      navigate('/auth');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Get user details for avatar
  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.full_name || userEmail.split('@')[0] || '';
  const userAvatar = user?.user_metadata?.avatar_url;
  const initials = userName ? userName.substring(0, 2).toUpperCase() : '';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="axion-container py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="#" className="flex items-center space-x-2">
                <span className="text-2xl font-bold axion-text-gradient">LearnFlow AI</span>
              </a>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className="nav-link text-sm font-medium"
                >
                  {link.name}
                </a>
              ))}
              
              {user && (
                <Link to="/quiz-generator" className="nav-link text-sm font-medium">
                  Assessment Generator
                </Link>
              )}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {!user ? (
                <Button 
                  onClick={handleLoginClick}
                  variant="outline" 
                  className="rounded-full"
                >
                  Login
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfileClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogoutClick}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button 
                onClick={handleGetStarted}
                variant="default" 
                className="rounded-full"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 md:hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <a href="#" className="flex items-center space-x-2">
                  <span className="text-2xl font-bold axion-text-gradient">LearnFlow AI</span>
                </a>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="nav-link text-lg font-medium"
                  >
                    {link.name}
                  </a>
                ))}
                
                {user && (
                  <Link
                    to="/quiz-generator"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link text-lg font-medium"
                  >
                    Assessment Generator
                  </Link>
                )}

                {user && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-link text-lg font-medium"
                  >
                    My Profile
                  </Link>
                )}
                
                {!user ? (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/auth');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Login
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (user) {
                      navigate('/quiz-generator');
                    } else {
                      navigate('/auth');
                    }
                  }}
                  variant="default"
                  className="rounded-full w-full mt-4"
                >
                  Get Started
                </Button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

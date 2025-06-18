import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Bell, User, ShoppingCart, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../ui/Logo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                <span>Menu</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isMenuDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                  <Link
                    to="/menu"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    onClick={() => setIsMenuDropdownOpen(false)}
                  >
                    Browse Menu
                  </Link>
                  <Link
                    to="/stores"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                    onClick={() => setIsMenuDropdownOpen(false)}
                  >
                    Restaurants
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Feed
            </Link>
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Offers
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {user?.name}
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  Signup
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/menu"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>
              <Link
                to="/stores"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Restaurants
              </Link>
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Feed
              </Link>
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Offers
              </Link>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
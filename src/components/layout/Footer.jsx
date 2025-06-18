import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import Logo from '../ui/Logo';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo />
            <p className="text-gray-600 text-sm leading-relaxed">
              Delivering happiness with every dish. A culinary masterpiece at your doorstep.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Useful Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Blogs
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Main Menu */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Main Menu</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Offers
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Menus
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary-600 transition-colors duration-200">
                  Reservation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:example@email.com"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  example@email.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+64958248966"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  +64 958 248 966
                </a>
              </li>
              <li className="text-gray-600">Social media</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            Copyright © 2023 Dscode | All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
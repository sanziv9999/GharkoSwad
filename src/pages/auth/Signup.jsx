import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Phone, Utensils } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { apiService } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    phoneNumber: '',
    role: 'USER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const locationParts = [];
        if (data.address.neighbourhood) locationParts.push(data.address.neighbourhood);
        if (data.address.suburb) locationParts.push(data.address.suburb);
        if (data.address.city || data.address.town || data.address.village) {
          locationParts.push(data.address.city || data.address.town || data.address.village);
        }
        const locationName = locationParts.length > 0 ? locationParts.join(', ') : data.display_name || 'Unknown location';
        setFormData((prev) => ({
          ...prev,
          location: locationName,
        }));
      } else {
        setError('Unable to retrieve specific location name');
      }
    } catch (err) {
      setError('Failed to get location. Please enable location services or enter manually (e.g., Kumari Pati, Lalitpur).');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        location: formData.location,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };
      await apiService.register(userData);
      // Store user data temporarily for OTP verification
      const tempUser = {
        id: null, // No ID yet until OTP verification
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };
      localStorage.setItem('tempUser', JSON.stringify(tempUser));
      login(tempUser, null); // Update AuthContext with temporary user, no token yet
      navigate('/otp');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">O</span>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600">Join us and start ordering or cooking delicious homemade food</p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="Username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  className="pl-12"
                />
                <User className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
              </div>
              <div className="relative">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="pl-12"
                />
                <Mail className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
              </div>
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  className="pl-12"
                />
                <Lock className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="pl-12"
                />
                <Lock className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter your location or use current location"
                  required
                  className="pl-12"
                />
                <MapPin className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="absolute right-4 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {locationLoading ? (
                    <span className="text-sm">Fetching...</span>
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Phone Number"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  className="pl-12"
                />
                <Phone className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
              </div>
              <div className="relative">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="USER">User</option>
                    <option value="CHEF">Chef</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                  <Utensils className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/" className="text-primary-600 hover:text-primary-700 transition-colors duration-200">
                  Terms and Conditions
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
              disabled={isLoading || locationLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
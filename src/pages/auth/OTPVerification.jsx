import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { apiService } from '../../api/apiService';
import { AuthContext } from '../../context/AuthContext';

const OTPVerification = () => {
  const [formData, setFormData] = useState({
    email: '',
    otpCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.verifyOtp({
        email: formData.email,
        otpCode: formData.otpCode,
      });
      const { user, token } = response.data;
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('tempUser'); // Clean up temporary user data
      setUser(userData);
      // Redirect based on role
      navigate(user.role === 'CHEF' ? '/dashboard' : '/menu');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h2>
          <p className="text-gray-600">Enter the OTP sent to your email</p>
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
                  label="OTP Code"
                  name="otpCode"
                  type="text"
                  value={formData.otpCode}
                  onChange={handleChange}
                  placeholder="Enter the OTP code"
                  required
                  className="pl-12"
                />
                <CheckCircle className="absolute left-4 top-9 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center">
              <p className="text-gray-600">
                Back to{' '}
                <Link
                  to="/signup"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerification;
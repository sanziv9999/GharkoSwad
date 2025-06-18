import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Clock, Heart, User, Bell, MapPin, Star, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      value: '24',
      change: '+12%',
      color: 'bg-primary-500'
    },
    {
      icon: Clock,
      label: 'Active Orders',
      value: '3',
      change: '+2',
      color: 'bg-orange-500'
    },
    {
      icon: Heart,
      label: 'Favorites',
      value: '12',
      change: '+3',
      color: 'bg-red-500'
    },
    {
      icon: CreditCard,
      label: 'Total Spent',
      value: '₹4,280',
      change: '+18%',
      color: 'bg-blue-500'
    }
  ];

  const recentOrders = [
    {
      id: 1,
      restaurant: 'Ama Le Banako Khanikura',
      items: ['Dal Bhat', 'Achar', 'Papad'],
      total: 180,
      status: 'Delivered',
      statusColor: 'success',
      date: 'Dec 15, 2023',
      time: '2:30 PM',
      rating: 4.8,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: 2,
      restaurant: 'Pure veg and organic Foods',
      items: ['Organic Salad', 'Green Smoothie'],
      total: 250,
      status: 'Preparing',
      statusColor: 'warning',
      date: 'Dec 16, 2023',
      time: '1:15 PM',
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1833336/pexels-photo-1833336.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    {
      id: 3,
      restaurant: 'Newari Kitchen Specialty',
      items: ['Newari Khaja Set', 'Lassi'],
      total: 320,
      status: 'On the way',
      statusColor: 'primary',
      date: 'Dec 16, 2023',
      time: '3:45 PM',
      rating: 4.7,
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=150'
    }
  ];

  const favoriteRestaurants = [
    {
      id: 1,
      name: 'Baje le banako Homemade Food',
      cuisine: 'Traditional Homestyle',
      rating: 4.7,
      deliveryTime: '25-35 min',
      image: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      id: 2,
      name: 'Newari Kitchen Specialty',
      cuisine: 'Newari Traditional',
      rating: 4.6,
      deliveryTime: '30-40 min',
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      id: 3,
      name: 'Mountain Home Cooking',
      cuisine: 'Mountain Traditional',
      rating: 4.5,
      deliveryTime: '35-45 min',
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Ready to order some delicious food?</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-200">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700 font-medium">Kathmandu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="p-6" hover>
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">{stat.change}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                <Button variant="outline">View All</Button>
              </div>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Card key={order.id} className="p-6 border border-gray-100" hover>
                    <div className="flex items-center space-x-4">
                      <img
                        src={order.image}
                        alt={order.restaurant}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{order.restaurant}</h3>
                            <p className="text-gray-600 mb-2">{order.items.join(', ')}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{order.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{order.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">₹{order.total}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{order.rating}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <Badge variant={order.statusColor}>
                            {order.status}
                          </Badge>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              Reorder
                            </Button>
                            <Button size="sm">
                              Track Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <Badge variant="success" className="mb-4">Premium Member</Badge>
                <Button className="w-full">
                  Edit Profile
                </Button>
              </div>
            </Card>

            {/* Favorite Restaurants */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Favorite Restaurants</h3>
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-4">
                {favoriteRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{restaurant.name}</h4>
                      <p className="text-gray-600 text-xs">{restaurant.cuisine}</p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600">{restaurant.rating}</span>
                        </div>
                        <span className="text-xs text-gray-500">{restaurant.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Reorder Favorite', icon: ShoppingBag },
                  { label: 'Track Active Orders', icon: Clock },
                  { label: 'Browse Menu', icon: Heart },
                  { label: 'Order History', icon: Calendar }
                ].map((action, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <action.icon className="w-5 h-5 text-gray-400" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
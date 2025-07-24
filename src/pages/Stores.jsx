import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Star, Clock, Phone, Award, Truck } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../api/apiService';
import { getImageUrl } from '../services/imageLocation/imagePath';

const Stores = () => {
  const [selectedLocation, setSelectedLocation] = useState('Kathmandu');
  const [sortBy, setSortBy] = useState('relevance');
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const locations = [
    { name: 'Kathmandu', count: 24 },
    { name: 'Bhaktapur', count: 12 },
    { name: 'Lalitpur', count: 18 },
    { name: 'Pokhara', count: 8 }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'delivery-time', label: 'Fastest Delivery' },
    { value: 'cost', label: 'Cost: Low to High' },
  ];

  useEffect(() => {
    setLoading(true);
    apiService.getAllChefs()
      .then(data => {
        setChefs(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch chefs');
        setLoading(false);
      });
  }, []);

  // Filter chefs by location if needed
  const filteredChefs = chefs.filter(chef =>
    selectedLocation === 'All' || (chef.location && chef.location.includes(selectedLocation))
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading chefs...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            Homes and <span className="text-primary-500">Chefs</span>
          </h1>
          <p className="text-xl text-gray-600">
            Discover authentic homemade food from verified local chefs
          </p>
        </div>

        {/* Location and Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Location Filter */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-6 h-6 text-primary-500" />
                <span className="text-lg font-bold text-gray-900">Location</span>
              </div>
              <div className="space-y-2">
                {locations.map((location) => (
                  <button
                    key={location.name}
                    onClick={() => setSelectedLocation(location.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 ${
                      selectedLocation === location.name
                        ? 'bg-primary-50 text-primary-600 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <span className="font-medium">{location.name}</span>
                    <Badge variant="primary" size="sm">
                      {location.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* Sort Options */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Card>

            {/* Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time
                  </label>
                  <div className="space-y-2">
                    {['Under 30 min', '30-45 min', '45+ min'].map((time) => (
                      <label key={time} className="flex items-center">
                        <input type="checkbox" className="rounded text-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="space-y-2">
                    {['4.5+', '4.0+', '3.5+'].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input type="checkbox" className="rounded text-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">{rating} ⭐</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Filter Bar */}
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">More Filters</span>
                </button>
                <p className="text-gray-600">
                  <span className="font-semibold">{filteredChefs.length}</span> chefs found in{' '}
                  <span className="font-semibold">{selectedLocation}</span>
                </p>
              </div>
            </Card>

            {/* Chefs Grid */}
            <div className="space-y-6">
              {filteredChefs.map((chef) => (
                <Card key={chef.id} className="overflow-hidden" hover>
                  <div className="md:flex">
                    <div className="md:w-1/3 relative">
                      <img
                        src={getImageUrl(chef.image) || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500'}
                        alt={chef.name}
                        className="w-full h-64 md:h-full object-cover"
                      />
                      {chef.isVerified && (
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <Badge variant="success" className="bg-green-500 text-white flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="md:w-2/3 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{chef.name}</h3>
                          <p className="text-gray-600 font-medium">{chef.specialty || 'Homemade Food'}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="text-lg font-bold text-gray-900">{chef.rating || '-'}</span>
                          </div>
                          {/* <p className="text-sm text-gray-600">({chef.reviews || 0} reviews)</p> */}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">{chef.bio || 'No description available.'}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {chef.tags && chef.tags.map((tag, index) => (
                          <Badge key={index} variant="primary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {chef.specialties && chef.specialties.map((specialty, index) => (
                          <span key={index} className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{chef.location || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{chef.phone || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>Experience: <span className="font-semibold">{chef.experience || '-'} years</span></p>
                        </div>
                        <div className="flex space-x-3">
                          <Button variant="outline" size="md">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          <Button size="md">
                            View Menu
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Star, Clock, Phone, Award, Truck, ChefHat, Mail, Navigation, Heart, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { apiService } from '../api/apiService';
import imagePathService from '../services/imageLocation/imagePath';

const Stores = () => {
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1); // Distance in km with 1 decimal
  };

  // Helper function to shorten location
  const shortenLocation = (location) => {
    if (!location) return 'Kathmandu';
    const parts = location.split(',');
    // Return first 2-3 meaningful parts
    return parts.slice(0, 3).join(', ').trim();
  };

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
          // Set default location (Kathmandu center)
          setUserLocation({ lat: 27.7172, lon: 85.3240 });
        }
      );
    } else {
      setUserLocation({ lat: 27.7172, lon: 85.3240 });
    }
  }, []);

  // Create dynamic locations based on chef data
  const locations = React.useMemo(() => {
    if (!chefs || chefs.length === 0) {
      return [{ name: 'All', count: 0 }];
    }

    // Count chefs by location
    const locationCounts = {};
    chefs.forEach(chef => {
      if (chef.location) {
        // Extract main city from location string
        const mainCity = chef.location.split(',')[0]?.trim();
        if (mainCity) {
          locationCounts[mainCity] = (locationCounts[mainCity] || 0) + 1;
        }
      }
    });

    // Create locations array with All option first
    const dynamicLocations = [
      { name: 'All', count: chefs.length }
    ];

    // Add top locations sorted by count
    Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .slice(0, 6) // Limit to top 6 locations
      .forEach(([city, count]) => {
        dynamicLocations.push({ name: city, count });
      });

    return dynamicLocations;
  }, [chefs]);

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

  // Filter chefs by location and search term
  const filteredChefs = chefs.filter(chef => {
    let matchesLocation = selectedLocation === 'All';
    
    if (!matchesLocation && chef.location) {
      // Extract main city from chef's location for precise matching
      const chefMainCity = chef.location.split(',')[0]?.trim();
      matchesLocation = chefMainCity === selectedLocation;
    }
    
    const matchesSearch = searchTerm === '' || 
      chef.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chef.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chef.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading chefs...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Enhanced Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Discover <span className="text-green-600">Home Chefs</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
              Authentic homemade food from verified local chefs in your neighborhood
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto sm:mx-0">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search chefs, cuisines, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Location and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Responsive Sidebar */}
          <div className="lg:w-80 space-y-4 sm:space-y-6">
            {/* Location Filter */}
            <Card className="p-4 sm:p-6 shadow-lg border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span className="text-base sm:text-lg font-bold text-gray-900">Location</span>
              </div>
                              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {loading ? (
                  // Loading state for locations
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gray-100 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-8"></div>
                    </div>
                  ))
                ) : (
                  locations.map((location) => (
                    <button
                      key={location.name}
                      onClick={() => setSelectedLocation(location.name)}
                      className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        selectedLocation === location.name
                          ? 'bg-green-50 text-green-600 border border-green-200 shadow-md'
                          : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:shadow-sm'
                      }`}
                    >
                      <span className="font-medium">{location.name}</span>
                      <Badge variant={selectedLocation === location.name ? "primary" : "secondary"} size="sm">
                        {location.count}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </Card>

            {/* Sort Options */}
            <Card className="p-4 sm:p-6 shadow-lg border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Card>

            {/* Filters */}
            <Card className="p-4 sm:p-6 shadow-lg border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Filters</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Time
                  </label>
                  <div className="space-y-1 sm:space-y-2">
                    {['Under 30 min', '30-45 min', '45+ min'].map((time) => (
                      <label key={time} className="flex items-center text-sm">
                        <input type="checkbox" className="rounded text-green-500 mr-2" />
                        <span className="text-gray-600">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="space-y-1 sm:space-y-2">
                    {['4.5+', '4.0+', '3.5+'].map((rating) => (
                      <label key={rating} className="flex items-center text-sm">
                        <input type="checkbox" className="rounded text-green-500 mr-2" />
                        <span className="text-gray-600">{rating} ⭐</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Enhanced Filter Bar */}
            <Card className="p-3 sm:p-4 mb-4 sm:mb-6 shadow-lg border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    <span className="text-gray-700 font-medium text-sm sm:text-base">More Filters</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm sm:text-base">
                  <Badge variant="primary" className="px-2 py-1">
                    {filteredChefs.length}
                  </Badge>
                  <p className="text-gray-600">
                    home chefs found{selectedLocation !== 'All' && (
                      <span> in <span className="font-semibold">{selectedLocation}</span></span>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            {/* Professional Chefs Display */}
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" 
              : "space-y-4 sm:space-y-6"
            }>
              {filteredChefs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16">
                  <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No chefs found</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Try adjusting your search criteria or location to find more home chefs
                  </p>
                </div>
              ) : (
                filteredChefs.map((chef) => {
                  // Parse chef coordinates
                  const chefCoords = chef.coordinate ? chef.coordinate.split(',') : null;
                  const chefLat = chefCoords ? parseFloat(chefCoords[0]) : null;
                  const chefLon = chefCoords ? parseFloat(chefCoords[1]) : null;
                  
                  // Calculate distance
                  const distance = userLocation && chefLat && chefLon 
                    ? calculateDistance(userLocation.lat, userLocation.lon, chefLat, chefLon)
                    : null;

                  return (
                                         <Card 
                       key={chef.id} 
                       className={`overflow-hidden shadow-lg border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 ${
                         viewMode === 'list' ? 'w-full' : ''
                       }`}
                     >
                      <div className={viewMode === 'grid' ? "p-4 sm:p-6" : "sm:flex"}>
                        {/* Chef Profile Section */}
                        <div className={viewMode === 'grid' 
                          ? "flex items-start space-x-4 mb-4" 
                          : "sm:w-80 sm:flex-shrink-0 relative"
                        }>
                          <div className={viewMode === 'grid' ? "relative" : "relative w-full"}>
                                                         <div className={`${viewMode === 'grid' 
                               ? 'w-16 h-16 sm:w-20 sm:h-20' 
                               : 'w-full h-48 sm:h-64'
                             } rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg`}>
                              {chef.profilePicture ? (
                                <img
                                  src={imagePathService.getImageUrl(chef.profilePicture)}
                                  alt={chef.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <ChefHat className={`${viewMode === 'grid' ? 'w-8 h-8' : 'w-12 h-12'} text-white`} 
                                style={{ display: chef.profilePicture ? 'none' : 'block' }} />
                            </div>
                            {/* Online indicator */}
                            <div className={`absolute ${viewMode === 'grid' ? '-bottom-1 -right-1' : 'top-4 right-4'} w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center`}>
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                             
                          </div>

                          {/* Quick info for grid view */}
                          {viewMode === 'grid' && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{chef.username}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-600 font-medium">4.8</span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">50+ orders</span>
                                  </div>
                                  {/* Verified Badge - Below rating stars */}
                                  <div className="mt-2">
                                    <Badge variant="success" className="text-xs px-2 py-1 bg-green-500 text-white flex items-center shadow-sm">
                                      <Award className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  </div>
                                </div>
                                                                 {distance && (
                                   <div className="text-right flex-shrink-0">
                                     <span className="text-sm font-bold text-green-600">{distance} km</span>
                                     <p className="text-xs text-gray-500">away</p>
                                   </div>
                                 )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chef Details */}
                        <div className={viewMode === 'grid' ? "space-y-3" : "flex-1 p-4 sm:p-6"}>
                          {/* Header for list view */}
                          {viewMode === 'list' && (
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{chef.username}</h3>
                                                                 <div className="flex items-center space-x-2 mb-2">
                                   <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                   <span className="text-lg font-bold text-gray-900">4.8</span>
                                   <span className="text-sm text-gray-400">•</span>
                                   <span className="text-sm text-gray-500">50+ orders</span>
                                 </div>
                                 {/* Verified Badge - Below rating stars */}
                                 <div className="mb-2">
                                   <Badge variant="success" className="text-xs px-2 py-1 bg-green-500 text-white flex items-center shadow-sm">
                                     <Award className="w-3 h-3 mr-1" />
                                     Verified
                                   </Badge>
                                 </div>
                              </div>
                                                             {distance && (
                                 <div className="text-right flex-shrink-0">
                                   <span className="text-lg font-bold text-green-600">{distance} km</span>
                                   <p className="text-sm text-gray-500">away</p>
                                 </div>
                               )}
                            </div>
                          )}

                          {/* Description */}
                          <p className={`text-gray-600 mb-3 ${viewMode === 'grid' ? 'text-sm line-clamp-2' : 'text-base leading-relaxed'}`}>
                            {chef.description || 'Specializing in authentic homemade dishes with fresh, local ingredients from this talented home chef'}
                          </p>

                          {/* Contact & Location Info */}
                          <div className={`${viewMode === 'grid' ? 'space-y-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'} mb-4`}>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">{shortenLocation(chef.location)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{chef.phoneNumber}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">{chef.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <span className="text-sm text-gray-600">25-35 min delivery</span>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="success" className="text-xs px-2 py-1">
                              Available Now
                            </Badge>
                            <Badge variant="primary" className="text-xs px-2 py-1">
                              Fast Delivery
                            </Badge>
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              Homemade
                            </Badge>
                          </div>

                          {/* Action Buttons */}
                          <div className={`flex ${viewMode === 'grid' ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                            {viewMode === 'list' && (
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-4 h-4 text-red-500" />
                                  <span>156 likes</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Truck className="w-4 h-4 text-blue-500" />
                                  <span>Free delivery</span>
                                </div>
                              </div>
                            )}
                                                         <div className={`flex ${viewMode === 'grid' ? 'space-x-2' : 'space-x-3'}`}>
                               <Button 
                                 size={viewMode === 'grid' ? 'sm' : 'md'} 
                                 variant="outline" 
                                 className="text-green-600 border-green-600 hover:bg-green-50 flex-1"
                                 onClick={() => {
                                   const phoneNumber = chef.phoneNumber.replace(/[^\d]/g, '');
                                   const message = `Hi! I'm interested in ordering food from your home kitchen. I found you on our platform.`;
                                   const whatsappUrl = `https://wa.me/977${phoneNumber}?text=${encodeURIComponent(message)}`;
                                   window.open(whatsappUrl, '_blank');
                                 }}
                               >
                                 <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                 WhatsApp
                               </Button>
                               <Button 
                                 size={viewMode === 'grid' ? 'sm' : 'md'} 
                                 className="bg-gradient-to-r from-green-500 to-green-600 text-white flex-1 hover:from-green-600 hover:to-green-700"
                               >
                                 View Menu
                               </Button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
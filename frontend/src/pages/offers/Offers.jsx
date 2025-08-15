import React, { useState } from 'react';
import { Clock, Star, Plus, Gift, Percent, Tag, Calendar, Users, ChefHat, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';

const Offers = () => {
  const { addToCart } = useCart();
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 3000);
  };

  const categories = [
    { id: 'all', name: 'All Offers', count: 15 },
    { id: 'combo', name: 'Combo Sets', count: 8 },
    { id: 'discount', name: 'Discounts', count: 5 },
    { id: 'festival', name: 'Festival Special', count: 2 }
  ];

  const offers = [
    {
      id: 1,
      type: 'combo',
      title: 'Family Feast Combo',
      description: 'Perfect for family dinner! Dal Bhat + Momo + Achar + Papad + Lassi for 4 people',
      originalPrice: 800,
      discountedPrice: 599,
      discount: 25,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Ama Didi Kitchen',
      rating: 4.8,
      reviews: 156,
      serves: '4 people',
      cookingTime: '35-45 min',
      items: [
        { name: 'Dal Bhat', quantity: 4, price: 180 },
        { name: 'Momo Platter', quantity: 2, price: 120 },
        { name: 'Mixed Achar', quantity: 1, price: 60 },
        { name: 'Papad', quantity: 4, price: 40 },
        { name: 'Sweet Lassi', quantity: 4, price: 200 }
      ],
      validUntil: '2024-01-31',
      isPopular: true,
      tags: ['Family Pack', 'Best Value', 'Traditional']
    },
    {
      id: 2,
      type: 'combo',
      title: 'Newari Special Combo',
      description: 'Authentic Newari experience with Khaja Set + Chatamari + Aila + Traditional sweets',
      originalPrice: 650,
      discountedPrice: 499,
      discount: 23,
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Newari Kitchen Specialty',
      rating: 4.9,
      reviews: 89,
      serves: '2 people',
      cookingTime: '40-50 min',
      items: [
        { name: 'Newari Khaja Set', quantity: 1, price: 250 },
        { name: 'Chatamari', quantity: 2, price: 160 },
        { name: 'Traditional Aila', quantity: 1, price: 150 },
        { name: 'Yomari', quantity: 2, price: 90 }
      ],
      validUntil: '2024-02-15',
      isPopular: false,
      tags: ['Authentic', 'Cultural', 'Premium']
    },
    {
      id: 3,
      type: 'discount',
      title: '30% Off on All Breakfast Items',
      description: 'Start your day right! Get 30% discount on all breakfast items including Sel Roti, Puri Tarkari, and more',
      originalPrice: 200,
      discountedPrice: 140,
      discount: 30,
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Mountain Home Cooking',
      rating: 4.6,
      reviews: 234,
      serves: '1 person',
      cookingTime: '15-25 min',
      items: [
        { name: 'Sel Roti', quantity: 4, price: 80 },
        { name: 'Gundruk Soup', quantity: 1, price: 60 },
        { name: 'Achar', quantity: 1, price: 40 },
        { name: 'Milk Tea', quantity: 1, price: 20 }
      ],
      validUntil: '2024-01-25',
      isPopular: true,
      tags: ['Breakfast', 'Healthy', 'Traditional']
    },
    {
      id: 4,
      type: 'combo',
      title: 'Student Special Combo',
      description: 'Budget-friendly combo for students! Dal Bhat + Pickle + Tea at unbeatable price',
      originalPrice: 250,
      discountedPrice: 180,
      discount: 28,
      image: 'https://images.pexels.com/photos/1833336/pexels-photo-1833336.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Village Style Kitchen',
      rating: 4.5,
      reviews: 312,
      serves: '1 person',
      cookingTime: '20-30 min',
      items: [
        { name: 'Dal Bhat', quantity: 1, price: 180 },
        { name: 'Pickle', quantity: 1, price: 30 },
        { name: 'Masala Tea', quantity: 1, price: 40 }
      ],
      validUntil: '2024-03-31',
      isPopular: false,
      tags: ['Budget Friendly', 'Student Special', 'Quick']
    },
    {
      id: 5,
      type: 'festival',
      title: 'Dashain Festival Mega Combo',
      description: 'Celebrate Dashain with our special festive platter! Mutton curry + Rice + Sweets + Traditional drinks',
      originalPrice: 1200,
      discountedPrice: 899,
      discount: 25,
      image: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Heritage Kitchen',
      rating: 4.9,
      reviews: 67,
      serves: '3-4 people',
      cookingTime: '60-75 min',
      items: [
        { name: 'Mutton Curry', quantity: 1, price: 450 },
        { name: 'Basmati Rice', quantity: 3, price: 240 },
        { name: 'Festival Sweets', quantity: 1, price: 200 },
        { name: 'Traditional Drinks', quantity: 3, price: 210 },
        { name: 'Special Achar', quantity: 1, price: 100 }
      ],
      validUntil: '2024-10-15',
      isPopular: true,
      tags: ['Festival Special', 'Premium', 'Traditional']
    },
    {
      id: 6,
      type: 'discount',
      title: 'First Order 50% Off',
      description: 'New to our platform? Get 50% off on your first order! Try our authentic homemade food',
      originalPrice: 300,
      discountedPrice: 150,
      discount: 50,
      image: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Multiple Chefs',
      rating: 4.7,
      reviews: 0,
      serves: 'Any',
      cookingTime: 'Varies',
      items: [
        { name: 'Any item from menu', quantity: 1, price: 300 }
      ],
      validUntil: '2024-12-31',
      isPopular: true,
      tags: ['New User', 'Limited Time', 'Best Deal']
    },
    {
      id: 7,
      type: 'combo',
      title: 'Healthy Organic Combo',
      description: 'Organic vegetables + Brown rice + Herbal tea + Fresh salad for health-conscious foodies',
      originalPrice: 450,
      discountedPrice: 349,
      discount: 22,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Pure Veg and Organic Foods',
      rating: 4.8,
      reviews: 145,
      serves: '1-2 people',
      cookingTime: '25-35 min',
      items: [
        { name: 'Organic Vegetable Curry', quantity: 1, price: 180 },
        { name: 'Brown Rice', quantity: 1, price: 120 },
        { name: 'Fresh Green Salad', quantity: 1, price: 80 },
        { name: 'Herbal Tea', quantity: 1, price: 70 }
      ],
      validUntil: '2024-02-29',
      isPopular: false,
      tags: ['Healthy', 'Organic', 'Nutritious']
    },
    {
      id: 8,
      type: 'combo',
      title: 'Weekend Brunch Special',
      description: 'Perfect weekend brunch! Pancakes + Fresh fruits + Coffee + Eggs + Juice',
      originalPrice: 380,
      discountedPrice: 299,
      discount: 21,
      image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=500',
      chef: 'Sweet Home',
      rating: 4.6,
      reviews: 98,
      serves: '1 person',
      cookingTime: '20-30 min',
      items: [
        { name: 'Fluffy Pancakes', quantity: 3, price: 150 },
        { name: 'Fresh Fruit Bowl', quantity: 1, price: 80 },
        { name: 'Premium Coffee', quantity: 1, price: 60 },
        { name: 'Scrambled Eggs', quantity: 1, price: 50 },
        { name: 'Fresh Orange Juice', quantity: 1, price: 40 }
      ],
      validUntil: '2024-01-28',
      isPopular: false,
      tags: ['Brunch', 'Weekend Special', 'Sweet']
    }
  ];

  const filteredOffers = offers.filter(offer => 
    selectedCategory === 'all' || offer.type === selectedCategory
  );

  const handleAddComboToCart = (offer) => {
    // Add the combo as a single item with all details
    const comboItem = {
      id: `combo-${offer.id}`,
      name: offer.title,
      price: offer.discountedPrice,
      originalPrice: offer.originalPrice,
      image: offer.image,
      chef: offer.chef,
      rating: offer.rating,
      cookingTime: offer.cookingTime,
      serves: offer.serves,
      isCombo: true,
      comboItems: offer.items
    };
    
    addToCart(comboItem);
    showBanner('success', `${offer.title} added to cart!`);
  };

  const calculateSavings = (original, discounted) => {
    return original - discounted;
  };

  const getDaysLeft = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              🎉 Special <span className="text-primary-500">Offers</span> & Combos
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Save big with our exclusive combo sets and limited-time discounts on authentic homemade food
            </p>
          </div>

          {/* Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6 text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-center mb-2">
                <Percent className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Up to 50%</h3>
              <p className="text-primary-100 text-sm sm:text-base">Maximum Savings</p>
            </Card>
            <Card className="p-4 sm:p-6 text-center bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-center mb-2">
                <Gift className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">{offers.length}+</h3>
              <p className="text-orange-100 text-sm sm:text-base">Active Offers</p>
            </Card>
            <Card className="p-4 sm:p-6 text-center bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">1000+</h3>
              <p className="text-green-100 text-sm sm:text-base">Happy Customers</p>
            </Card>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-all duration-200 text-sm sm:text-base ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-md'
                }`}
              >
                <span className="block sm:inline">{category.name}</span>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden group" hover>
              <div className="relative">
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-48 sm:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2">
                  <Badge variant="error" className="bg-red-500 text-white font-bold text-xs sm:text-sm">
                    {offer.discount}% OFF
                  </Badge>
                  {offer.isPopular && (
                    <Badge variant="warning" className="bg-orange-500 text-white text-xs sm:text-sm">
                      🔥 Popular
                    </Badge>
                  )}
                  {getDaysLeft(offer.validUntil) <= 3 && (
                    <Badge variant="error" className="bg-red-600 text-white animate-pulse text-xs sm:text-sm">
                      ⏰ Ending Soon
                    </Badge>
                  )}
                </div>

                {/* Savings Badge */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <div className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                    Save NRs.{calculateSavings(offer.originalPrice, offer.discountedPrice)}
                  </div>
                </div>

                {/* Heart Icon */}
                <button className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-red-500" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">{offer.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <ChefHat className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">by {offer.chef}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{offer.rating}</span>
                    <span className="text-xs text-gray-500 hidden sm:inline">({offer.reviews})</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base line-clamp-2">{offer.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                  {offer.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="primary" size="sm" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {offer.tags.length > 3 && (
                    <Badge variant="primary" size="sm" className="text-xs">
                      +{offer.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Items Included */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center text-sm sm:text-base">
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary-500" />
                    What's Included:
                  </h4>
                  <div className="space-y-1">
                    {offer.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 truncate">• {item.name} x{item.quantity}</span>
                        <span className="text-gray-500 ml-2 flex-shrink-0">NRs.{item.price}</span>
                      </div>
                    ))}
                    {offer.items.length > 2 && (
                      <p className="text-xs sm:text-sm text-primary-600 font-medium">
                        +{offer.items.length - 2} more items...
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{offer.cookingTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{offer.serves}</span>
                  </div>
                  <div className="flex items-center space-x-1 col-span-2 sm:col-span-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{getDaysLeft(offer.validUntil)} days left</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl font-bold text-gray-900">NRs.{offer.discountedPrice}</span>
                      <span className="text-base sm:text-lg text-gray-500 line-through">NRs.{offer.originalPrice}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-600 font-medium">
                                              You save NRs.{calculateSavings(offer.originalPrice, offer.discountedPrice)}!
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full flex items-center justify-center space-x-2 py-2 sm:py-3 text-sm sm:text-base font-semibold"
                  onClick={() => handleAddComboToCart(offer)}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Combo to Cart</span>
                </Button>

                {/* Valid Until */}
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    Valid until {new Date(offer.validUntil).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 sm:mt-16 text-center">
          <Card className="p-8 sm:p-12 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Don't Miss Out! 🎯
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-6">
                These amazing offers won't last forever. Order now and save big on authentic homemade food!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Browse All Offers
                </Button>
                <Button variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Subscribe for Deals
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Offers;
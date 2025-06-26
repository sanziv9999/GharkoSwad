import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, MapPin, Star, ChefHat, Clock, Gift, ShoppingBag, ArrowRight, Truck, Shield, Heart, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Banner from '../components/ui/Banner';

const Home = () => {
  const { addToCart } = useCart();
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 3000);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    showBanner('success', `${item.name} added to cart!`);
  };

  const featuredItems = [
    {
      id: 1,
      name: 'Puri Tarkari',
      price: 120.00,
      originalPrice: 150.00,
      image: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=400',
      chef: 'Ama Didi Kitchen',
      rating: 4.8,
      preparationTime: '20-25 min',
      serves: '1 person'
    },
    {
      id: 2,
      name: 'Dal Bhat',
      price: 180.00,
      originalPrice: 220.00,
      image: 'https://images.pexels.com/photos/1833336/pexels-photo-1833336.jpeg?auto=compress&cs=tinysrgb&w=400',
      chef: 'Newari Kitchen',
      rating: 4.9,
      preparationTime: '25-30 min',
      serves: '1-2 people'
    }
  ];

  const specialOffers = [
    {
      title: 'Family Feast Combo',
      description: 'Dal Bhat + Momo + Achar + Lassi for 4 people',
      originalPrice: 800.00,
      discountedPrice: 599.00,
      discount: 25,
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      title: 'Student Special',
      description: 'Budget-friendly combo with Dal Bhat + Tea',
      originalPrice: 250.00,
      discountedPrice: 180.00,
      discount: 28,
      image: 'https://images.pexels.com/photos/1833336/pexels-photo-1833336.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      title: 'First Order 50% Off',
      description: 'New users get 50% discount on first order',
      originalPrice: 300.00,
      discountedPrice: 150.00,
      discount: 50,
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  return (
    <div className="bg-white">
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50/30 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10 animate-fade-in">
              <div className="space-y-6">
                <Badge variant="success" size="md" className="animate-bounce-gentle">
                  🌟 #1 Homemade Food Delivery
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Get Homemade<br />
                  Food From <span className="text-primary-500 relative">
                    Home
                    <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary-200 opacity-60 rounded-full"></div>
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Where Each Plate Weaves a Story of Culinary<br />
                  Mastery and Passionate Craftsmanship
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/menu">
                  <Button size="lg" className="px-10 py-4 text-lg shadow-lg hover:shadow-xl">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Order Now
                  </Button>
                </Link>
                <button className="flex items-center space-x-3 px-8 py-4 text-gray-700 hover:text-primary-600 transition-all duration-300 group">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <Play className="w-6 h-6 text-primary-500 ml-1" />
                  </div>
                  <span className="font-semibold text-lg">Watch Video</span>
                </button>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">50K+</p>
                  <p className="text-gray-600">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">4.8</p>
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-600">Rating</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">1000+</p>
                  <p className="text-gray-600">Home Chefs</p>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl rotate-6 opacity-20"></div>
                <Card className="relative p-8 bg-gradient-to-br from-white to-gray-50">
                  <img
                    src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Delicious homemade food"
                    className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  
                  {/* Floating Cards */}
                  {featuredItems.map((item, index) => (
                    <Card 
                      key={item.id}
                      className={`absolute p-4 shadow-xl animate-bounce-gentle ${
                        index === 0 ? '-bottom-6 -left-6' : '-top-6 -right-6'
                      }`} 
                      style={{ animationDelay: `${index * 0.5}s` }}
                      hover
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-primary-600 font-semibold">₹{item.price.toFixed(2)}</p>
                            {item.originalPrice && (
                              <p className="text-xs text-gray-500 line-through">₹{item.originalPrice.toFixed(2)}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{item.rating}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </Card>

                {/* Decorative Elements */}
                <div className="absolute top-1/4 -left-8 w-6 h-6 bg-orange-400 rounded-full animate-bounce-gentle"></div>
                <div className="absolute bottom-1/3 -right-4 w-4 h-4 bg-red-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 -right-12 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="primary" size="md" className="mb-4">
              Customer Favourites
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Popular Categories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the most loved homemade dishes crafted by local home chefs
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { 
                name: 'Main Dish', 
                count: '86 dishes', 
                image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200',
                color: 'bg-orange-100 text-orange-600'
              },
              { 
                name: 'Break Fast', 
                count: '12 break fast', 
                image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=200',
                color: 'bg-blue-100 text-blue-600'
              },
              { 
                name: 'Dessert', 
                count: '48 dessert', 
                image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=200',
                color: 'bg-pink-100 text-pink-600'
              },
              { 
                name: 'Browse All', 
                count: '255 Items', 
                image: 'https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=200',
                color: 'bg-primary-100 text-primary-600'
              },
            ].map((category, index) => (
              <Link key={index} to="/menu">
                <Card
                  className="p-8 text-center cursor-pointer group"
                  hover
                >
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600">({category.count})</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="error" size="md" className="mb-4 bg-red-500 text-white">
              🎉 Limited Time Offers
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Special <span className="text-primary-500">Deals</span> & Combos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Save big with our exclusive combo sets and limited-time discounts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {specialOffers.map((offer, index) => (
              <Card key={index} className="overflow-hidden group" hover>
                <div className="relative">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="error" className="bg-red-500 text-white font-bold">
                      {offer.discount}% OFF
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                      Save ₹{(offer.originalPrice - offer.discountedPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h3>
                  <p className="text-gray-600 mb-4">{offer.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">₹{offer.discountedPrice.toFixed(2)}</span>
                      <span className="text-lg text-gray-500 line-through ml-2">₹{offer.originalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link to="/offers">
                    <Button className="w-full">
                      View Offer
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/offers">
              <Button size="lg" className="px-8 py-4 text-lg">
                <Gift className="w-5 h-5 mr-2" />
                View All Offers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="success" size="md" className="mb-4">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              We Deliver More Than Food
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: 'Fast Delivery',
                description: 'Get your homemade food delivered hot and fresh within 30 minutes',
                color: 'bg-blue-500'
              },
              {
                icon: Shield,
                title: 'Quality Guaranteed',
                description: 'All our home chefs are verified and follow strict hygiene standards',
                color: 'bg-primary-500'
              },
              {
                icon: Heart,
                title: 'Made with Love',
                description: 'Every dish is prepared with care by local families who love cooking',
                color: 'bg-red-500'
              }
            ].map((feature, index) => (
              <Card key={index} className="p-8 text-center group" hover>
                <div className={`w-16 h-16 mx-auto mb-6 ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-primary-500 to-primary-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
                <div className="relative text-center">
                  <img
                    src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=300"
                    alt="Home Chef"
                    className="w-56 h-56 mx-auto rounded-full object-cover border-4 border-white/20"
                  />
                  <div className="mt-6">
                    <Badge variant="success" className="bg-white/20 text-white border border-white/30">
                      Verified Home Chef
                    </Badge>
                    <p className="text-white/90 font-medium mt-2">Award Winner 2023</p>
                  </div>
                </div>
              </Card>
            </div>
            <div className="space-y-8">
              <div>
                <Badge variant="primary" size="md" className="mb-4">
                  Testimonials
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  What Our Customers<br />Say About Us
                </h2>
              </div>
              <Card className="p-8">
                <blockquote className="text-xl text-gray-700 leading-relaxed mb-6">
                  "I had the pleasure of dining at foodi last night, and I'm still raving about the experience! The attention to detail in presentation and service was impeccable. From the moment I stepped through the door, I felt like eating food made with love by family."
                </blockquote>
                <div className="flex items-center space-x-4">
                  <img
                    src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100"
                    alt="Customer"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Rifka Sharma</p>
                    <p className="text-gray-600">Kathmandu</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">4.9 (18.8k Reviews)</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" size="md" className="mb-4">
              Our Story & Services
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Our Culinary Journey<br />And Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Rooted in passion, we curate unforgettable dining experiences and offer exceptional services, blending culinary artistry with warm hospitality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: ChefHat,
                title: 'Home Chef',
                description: 'Experience hand-crafted food from home, prepared with local ingredients and traditional recipes.',
                color: 'bg-orange-500'
              },
              {
                icon: Clock,
                title: 'Weekly Meal Plan',
                description: 'Subscribe to delicious, home-made weekly meal plans that save time while ensuring nutritious dining.',
                color: 'bg-blue-500'
              },
              {
                icon: ShoppingBag,
                title: 'Custom Orders',
                description: 'Customize your meal according to your taste and dietary requirements with our flexible ordering system.',
                color: 'bg-primary-500'
              },
              {
                icon: Gift,
                title: 'Fresh Ingredients',
                description: 'We use only the freshest, locally-sourced ingredients to ensure the highest quality in every dish.',
                color: 'bg-red-500'
              }
            ].map((service, index) => (
              <Card
                key={index}
                className="p-8 text-center group"
                hover
              >
                <div className={`w-20 h-20 mx-auto mb-6 ${service.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location Search CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-12">
            <div>
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Ready to Order?<br />
                Food now from <span className="text-primary-500">Home</span>
              </h2>
              <p className="text-xl text-gray-600">
                Where Each Plate Weaves a Story of Culinary<br />
                Mastery and Passionate Craftsmanship
              </p>
            </div>
            <Card className="max-w-2xl mx-auto p-8">
              <div className="flex items-center bg-gray-50 rounded-2xl p-3">
                <div className="flex items-center flex-1 px-6">
                  <MapPin className="w-6 h-6 text-gray-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Enter your delivery location"
                    className="bg-transparent flex-1 outline-none text-gray-700 text-lg"
                  />
                </div>
                <Link to="/menu">
                  <Button className="px-8 py-3 text-lg">
                    Find Food
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="mt-6 text-left">
                <p className="text-sm font-semibold text-gray-700 mb-2">POPULAR CITIES IN NEPAL</p>
                <div className="flex flex-wrap gap-2">
                  {['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Pokhara'].map((city) => (
                    <Badge key={city} variant="primary" className="cursor-pointer hover:bg-primary-200 transition-colors">
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-24 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <Badge variant="success" size="md" className="mb-4">
                  Mobile App
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Homemade Foods<br />
                  In Your <span className="text-primary-500">Pocket</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  All you need to do is download one of the best delivery apps, make an order and most companies are opting for mobile app development for food delivery
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-16 w-auto cursor-pointer hover:scale-105 transition-transform duration-200"
                />
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  className="h-16 w-auto cursor-pointer hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full opacity-20 animate-pulse"></div>
                <img
                  src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=500"
                  alt="Traditional food platter"
                  className="relative z-10 w-80 h-80 mx-auto rounded-full object-cover border-8 border-primary-500/20 shadow-2xl"
                />
                
                {/* Floating Elements */}
                <div className="absolute top-8 right-8 w-6 h-6 bg-orange-400 rounded-full animate-bounce-gentle"></div>
                <div className="absolute bottom-16 left-8 w-4 h-4 bg-red-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
                
                {/* Decorative Image */}
                <div className="absolute -bottom-8 -right-8">
                  <img
                    src="https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=100"
                    alt="Herbs"
                    className="w-24 h-24 object-cover opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, MoreHorizontal, Plus, Camera, Video, Image, Send, Bookmark, ChefHat, Star, Clock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';

const Feed = () => {
  const { user, isAuthenticated } = useAuth();
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'text',
    content: '',
    image: '',
    video: '',
    recipe: {
      name: '',
      ingredients: '',
      instructions: '',
      cookingTime: '',
      serves: ''
    }
  });
  const [playingVideos, setPlayingVideos] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 3000);
  };

  const [posts, setPosts] = useState([
    {
      id: 1,
      chef: {
        id: 'chef1',
        name: 'Ama Didi Kitchen',
        avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
        verified: true,
        followers: 1250,
        rating: 4.8
      },
      type: 'video',
      content: 'Making traditional Dal Bhat with love! 🍛 This recipe has been passed down through generations in my family. The secret is in the slow cooking and fresh spices.',
      video: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
      recipe: {
        name: 'Traditional Dal Bhat',
        ingredients: 'Lentils, Rice, Seasonal vegetables, Spices, Ghee',
        cookingTime: '45 minutes',
        serves: '4 people',
        difficulty: 'Medium'
      },
      likes: 234,
      comments: 45,
      shares: 12,
      timestamp: '2 hours ago',
      isLiked: false,
      isBookmarked: false
    },
    {
      id: 2,
      chef: {
        id: 'chef2',
        name: 'Newari Kitchen Specialty',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
        verified: true,
        followers: 890,
        rating: 4.7
      },
      type: 'image',
      content: 'Fresh batch of momos ready! 🥟 Hand-wrapped with organic vegetables and served with our signature spicy chutney. Available for order now!',
      image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=600',
      recipe: {
        name: 'Vegetable Momos',
        ingredients: 'Flour, Cabbage, Carrots, Onions, Ginger, Garlic',
        cookingTime: '30 minutes',
        serves: '6 people',
        difficulty: 'Easy'
      },
      likes: 189,
      comments: 23,
      shares: 8,
      timestamp: '4 hours ago',
      isLiked: true,
      isBookmarked: false
    },
    {
      id: 3,
      chef: {
        id: 'chef3',
        name: 'Mountain Home Cooking',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
        verified: false,
        followers: 456,
        rating: 4.5
      },
      type: 'recipe',
      content: 'Sharing my grandmother\'s secret Sel Roti recipe! 🍩 Perfect for festivals and special occasions. The key is getting the batter consistency just right.',
      image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600',
      recipe: {
        name: 'Traditional Sel Roti',
        ingredients: 'Rice flour, Sugar, Milk, Ghee, Cardamom, Water',
        instructions: '1. Soak rice overnight\n2. Grind to smooth paste\n3. Add sugar and spices\n4. Deep fry in circular shapes\n5. Serve hot',
        cookingTime: '2 hours (including soaking)',
        serves: '8 people',
        difficulty: 'Hard'
      },
      likes: 156,
      comments: 34,
      shares: 15,
      timestamp: '6 hours ago',
      isLiked: false,
      isBookmarked: true
    }
  ]);

  const handleCreatePost = () => {
    if (!newPost.content.trim()) {
      showBanner('error', 'Please add some content to your post');
      return;
    }

    const post = {
      id: Date.now(),
      chef: {
        id: user?.id || 'current-user',
        name: user?.name || 'Current User',
        avatar: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=100',
        verified: false,
        followers: 0,
        rating: 0
      },
      type: newPost.type,
      content: newPost.content,
      image: newPost.image,
      video: newPost.video,
      recipe: newPost.type === 'recipe' ? newPost.recipe : null,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: 'Just now',
      isLiked: false,
      isBookmarked: false
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({
      type: 'text',
      content: '',
      image: '',
      video: '',
      recipe: { name: '', ingredients: '', instructions: '', cookingTime: '', serves: '' }
    });
    setShowCreatePost(false);
    showBanner('success', 'Post shared successfully!');
  };

  const handleLike = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleBookmark = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ));
    showBanner('success', 'Recipe saved to bookmarks!');
  };

  const toggleVideo = (postId) => {
    setPlayingVideos(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleMute = (postId) => {
    setMutedVideos(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': 'success',
      'Medium': 'warning',
      'Hard': 'error'
    };
    return colors[difficulty] || 'primary';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {banner.show && (
        <Banner 
          type={banner.type} 
          message={banner.message} 
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chef Feed 👨‍🍳</h1>
              <p className="text-gray-600">Discover recipes and cooking tips from home chefs</p>
            </div>
            {isAuthenticated && (
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Share Recipe</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Share Your Recipe</h2>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Type Selector */}
                <div className="flex space-x-2 mb-4">
                  {[
                    { type: 'text', label: 'Text', icon: MessageCircle },
                    { type: 'image', label: 'Photo', icon: Image },
                    { type: 'video', label: 'Video', icon: Video },
                    { type: 'recipe', label: 'Recipe', icon: ChefHat }
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewPost(prev => ({ ...prev, type }))}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        newPost.type === type
                          ? 'bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Content Input */}
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your cooking story, tips, or recipe..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                />

                {/* Media Upload */}
                {(newPost.type === 'image' || newPost.type === 'video') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newPost.type === 'image' ? 'Image URL' : 'Video URL'}
                    </label>
                    <input
                      type="url"
                      value={newPost.type === 'image' ? newPost.image : newPost.video}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        [newPost.type]: e.target.value 
                      }))}
                      placeholder={`Enter ${newPost.type} URL`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Recipe Details */}
                {newPost.type === 'recipe' && (
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newPost.recipe.name}
                        onChange={(e) => setNewPost(prev => ({ 
                          ...prev, 
                          recipe: { ...prev.recipe, name: e.target.value }
                        }))}
                        placeholder="Recipe name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newPost.recipe.cookingTime}
                        onChange={(e) => setNewPost(prev => ({ 
                          ...prev, 
                          recipe: { ...prev.recipe, cookingTime: e.target.value }
                        }))}
                        placeholder="Cooking time"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={newPost.recipe.serves}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        recipe: { ...prev.recipe, serves: e.target.value }
                      }))}
                      placeholder="Serves how many people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <textarea
                      value={newPost.recipe.ingredients}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        recipe: { ...prev.recipe, ingredients: e.target.value }
                      }))}
                      placeholder="List ingredients..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <textarea
                      value={newPost.recipe.instructions}
                      onChange={(e) => setNewPost(prev => ({ 
                        ...prev, 
                        recipe: { ...prev.recipe, instructions: e.target.value }
                      }))}
                      placeholder="Step-by-step instructions..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button onClick={handleCreatePost} className="flex-1">
                    Share Post
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreatePost(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Feed Posts */}
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.chef.avatar}
                      alt={post.chef.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900">{post.chef.name}</h3>
                        {post.chef.verified && (
                          <Badge variant="primary" size="sm" className="flex items-center space-x-1">
                            <ChefHat className="w-3 h-3" />
                            <span>Verified</span>
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{post.timestamp}</span>
                        {post.chef.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{post.chef.rating}</span>
                          </div>
                        )}
                        <span>{post.chef.followers} followers</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
              </div>

              {/* Media Content */}
              {post.type === 'image' && post.image && (
                <div className="relative">
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full h-96 object-cover"
                  />
                </div>
              )}

              {post.type === 'video' && post.video && (
                <div className="relative">
                  <video
                    src={post.video}
                    poster={post.thumbnail}
                    className="w-full h-96 object-cover"
                    muted={mutedVideos[post.id]}
                    autoPlay={playingVideos[post.id]}
                    loop
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={() => toggleVideo(post.id)}
                      className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200"
                    >
                      {playingVideos[post.id] ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => toggleMute(post.id)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200"
                  >
                    {mutedVideos[post.id] ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              )}

              {/* Recipe Card */}
              {post.recipe && (
                <div className="mx-6 mb-4">
                  <Card className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                        <ChefHat className="w-5 h-5 text-primary-500" />
                        <span>{post.recipe.name}</span>
                      </h4>
                      {post.recipe.difficulty && (
                        <Badge variant={getDifficultyColor(post.recipe.difficulty)} size="sm">
                          {post.recipe.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{post.recipe.cookingTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{post.recipe.serves}</span>
                      </div>
                    </div>

                    {post.recipe.ingredients && (
                      <div className="mb-3">
                        <p className="font-semibold text-gray-900 mb-1">Ingredients:</p>
                        <p className="text-gray-700 text-sm">{post.recipe.ingredients}</p>
                      </div>
                    )}

                    {post.recipe.instructions && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Instructions:</p>
                        <p className="text-gray-700 text-sm whitespace-pre-line">{post.recipe.instructions}</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors duration-200 ${
                        post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-medium">{post.comments}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      <Share2 className="w-6 h-6" />
                      <span className="font-medium">{post.shares}</span>
                    </button>
                  </div>
                  
                  {post.recipe && (
                    <button
                      onClick={() => handleBookmark(post.id)}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        post.isBookmarked 
                          ? 'text-primary-600 bg-primary-50' 
                          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment Section */}
              <div className="px-6 pb-6">
                <div className="flex items-center space-x-3">
                  <img
                    src={user?.avatar || 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors duration-200"
                    />
                    <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-200">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center py-8">
          <Button variant="outline" className="px-8">
            Load More Posts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Feed;
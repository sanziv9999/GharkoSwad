import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, MoreHorizontal, Plus, Camera, Video, Image, Send, Bookmark, ChefHat, Clock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Banner from '../../components/ui/Banner';
import { apiService } from '../../api/apiService';
import { getImageUrl } from '../../services/imageLocation/imagePath'; // Assuming getVideoUrl is not needed

// Simple Video Player Component
const SimpleVideoPlayer = ({ post, playingVideos, mutedVideos, toggleVideo, toggleMute }) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  // Simplified video URL generation
  const videoUrls = React.useMemo(() => {
    if (!post.videoPath) return [];

    const baseUrl = 'http://localhost:8080'; // Replace with your actual server URL
    const cleanPath = post.videoPath.startsWith('/') ? post.videoPath.slice(1) : post.videoPath;

    return [
      `${baseUrl}/uploads/${cleanPath}`, // Primary path for videos
      `${baseUrl}/api/uploads/${cleanPath}`, // Alternative API path
    ];
  }, [post.videoPath]);

  const currentVideoUrl = videoUrls[currentUrlIndex];

  const handleVideoError = async (e) => {
    console.error(`Video error for URL ${currentVideoUrl}:`, e.target.error);

    // Log specific error details
    const error = e.target.error;
    let errorMessage = '';
    switch (error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        errorMessage = 'Video playback aborted';
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        errorMessage = 'Network error while fetching video';
        break;
      case MediaError.MEDIA_ERR_DECODE:
        errorMessage = 'Video decoding error (possibly unsupported format)';
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = 'Video source not supported (possibly CORS or invalid URL)';
        break;
      default:
        errorMessage = 'Unknown video error';
    }
    console.error(`Error details: ${errorMessage} (Code: ${error.code})`);

    // Check server response for the URL
    try {
      const response = await fetch(currentVideoUrl, { method: 'HEAD' });
      console.log(`Server response for ${currentVideoUrl}:`, response.status, response.statusText);
    } catch (fetchError) {
      console.error(`Fetch error for ${currentVideoUrl}:`, fetchError);
    }

    // Try next URL if available
    if (currentUrlIndex < videoUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
      setIsLoading(true);
      setHasError(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleVideoLoad = () => {
    setHasError(false);
    setIsLoading(false);
    console.log(`Video loaded successfully from: ${currentVideoUrl}`);
  };

  const retryVideo = () => {
    setHasError(false);
    setCurrentUrlIndex(0);
    setIsLoading(true);
  };

  // Reset state when video path changes
  useEffect(() => {
    setCurrentUrlIndex(0);
    setIsLoading(true);
    setHasError(false);
  }, [post.videoPath]);

  // Sync video playback with playingVideos state
  useEffect(() => {
    if (videoRef.current) {
      if (playingVideos[post.id]) {
        videoRef.current.play().catch((error) => {
          console.error('Autoplay failed:', error);
          setHasError(true);
          setIsLoading(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [playingVideos, post.id]);

  if (!post.videoPath) return null;

  if (hasError) {
    return (
      <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium mb-2">Video not available</p>
          <p className="text-sm text-gray-500 mb-4">Failed to load from all {videoUrls.length} sources</p>
          
          <details className="text-xs text-gray-400 mb-4 text-left">
            <summary className="cursor-pointer hover:text-gray-600 text-center">Show debug info</summary>
            <div className="mt-2 bg-gray-50 p-3 rounded border">
              <p><strong>Original Path:</strong> {post.videoPath}</p>
              <p><strong>Attempted URLs:</strong></p>
              <ul className="list-disc list-inside ml-2 mt-1">
                {videoUrls.map((url, index) => (
                  <li key={index} className={`text-xs break-all ${index === currentUrlIndex ? 'text-red-500 font-medium' : ''}`}>
                    {url}
                  </li>
                ))}
              </ul>
            </div>
          </details>
          
          <button
            onClick={retryVideo}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
          <div className="text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
            Loading video... ({currentUrlIndex + 1}/{videoUrls.length})
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        key={`video-${post.id}-${currentUrlIndex}`}
        src={currentVideoUrl}
        className="w-full h-96 object-cover"
        muted={mutedVideos[post.id] !== false}
        loop
        playsInline
        preload="metadata"
        onError={handleVideoError}
        onLoadedData={handleVideoLoad}
        onCanPlay={() => setIsLoading(false)}
      />
      
      {/* Play/Pause Button */}
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
      
      {/* Mute/Unmute Button */}
      <button
        onClick={() => toggleMute(post.id)}
        className="absolute bottom-4 right-4 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all duration-200"
      >
        {mutedVideos[post.id] !== false ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
};

const Feed = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [banner, setBanner] = useState({ show: false, type: '', message: '' });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'TEXT',
    content: '',
    image: null,
    video: null,
    recipe: {
      name: '',
      ingredients: '',
      instructions: '',
      cookingTime: '',
      serves: '',
    },
  });
  const [posts, setPosts] = useState([]);
  const [playingVideos, setPlayingVideos] = useState({});
  const [mutedVideos, setMutedVideos] = useState({});
  const [loading, setLoading] = useState(true);

  const showBanner = (type, message) => {
    setBanner({ show: true, type, message });
    setTimeout(() => setBanner({ show: false, type: '', message: '' }), 3000);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData.id;
        const token = localStorage.getItem('token') || user?.token;
        
        console.log('Fetch posts - User data:', userData);
        console.log('Fetch posts - User ID:', userId);
        console.log('Fetch posts - Token:', token ? 'Present' : 'Missing');
        
        if (!token) {
          showBanner('error', 'Please login to view posts');
          return;
        }

        const data = await apiService.getFoodFeeds(token);
        setPosts(
          data.map((post) => ({
            ...post,
            isLiked: Array.isArray(post.likes) ? post.likes.includes(userId || '') : false,
            isBookmarked: false,
            chef: post.chef || { username: 'Unknown Chef' },
          }))
        );
        // Initialize video states
        const initialPlaying = {};
        const initialMuted = {};
        data.forEach((post) => {
          if (post.videoPath) {
            initialPlaying[post.id] = false; // Default to paused
            initialMuted[post.id] = true; // Default to muted for autoplay compatibility
          }
        });
        setPlayingVideos(initialPlaying);
        setMutedVideos(initialMuted);
      } catch (error) {
        showBanner('error', error.message || 'Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchPosts();
  }, [isAuthenticated, token, user?.id]);

  const handleCreatePost = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      const token = localStorage.getItem('token') || user?.token;

      console.log('Create post - User data:', userData);
      console.log('Create post - User ID:', userId);
      console.log('Create post - Token:', token ? 'Present' : 'Missing');

      if (!userId) {
        showBanner('error', 'Please login to create posts');
        return;
      }

      if (!token) {
        showBanner('error', 'Authentication required');
        return;
      }

      if (!newPost.content.trim()) {
        showBanner('error', 'Please add some content to your post');
        return;
      }

      const formData = new FormData();
      formData.append('chefId', userId);
      formData.append('content', newPost.content);
      formData.append('type', newPost.type);
      if (newPost.image) formData.append('image', newPost.image);
      if (newPost.video) formData.append('video', newPost.video);

      if (newPost.type === 'RECIPE' && newPost.recipe) {
        formData.append('recipe', JSON.stringify(newPost.recipe));
      }

      const response = await apiService.createFoodFeed(formData, token);
      setPosts((prev) => [{ ...response.data, isLiked: false, isBookmarked: false, chef: { username: userData.username || 'Unknown Chef' } }, ...prev]);
      setNewPost({
        type: 'TEXT',
        content: '',
        image: null,
        video: null,
        recipe: {
          name: '',
          cookingTime: '',
          serves: '',
          difficulty: 'Easy',
          ingredients: '',
          instructions: '',
        },
      });
      setShowCreatePost(false);
      showBanner('success', 'Post created successfully!');
    } catch (error) {
      showBanner('error', error.message || 'Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      
      console.log('User data from localStorage:', userData);
      console.log('User ID:', userId);
      
      if (!userId) {
        showBanner('error', 'Please login to like posts');
        return;
      }

      const token = localStorage.getItem('token') || user?.token;
      if (!token) {
        showBanner('error', 'Authentication required');
        return;
      }

      // Optimistic update
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked
                  ? (Array.isArray(post.likes) ? post.likes.filter(id => id !== userId) : [])
                  : (Array.isArray(post.likes) ? [...post.likes, userId] : [userId])
              }
            : post
        )
      );

      // API call with userId
      await apiService.likeFoodFeed(postId, userId, token);
    } catch (error) {
      // Revert optimistic update on error
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked
                  ? (Array.isArray(post.likes) ? [...post.likes, userId] : [userId])
                  : (Array.isArray(post.likes) ? post.likes.filter(id => id !== userId) : [])
              }
            : post
        )
      );
      showBanner('error', error.message || 'Failed to like post');
    }
  };

  const handleBookmark = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
      )
    );
    showBanner('success', 'Recipe saved to bookmarks!');
  };

  const toggleVideo = (postId) => {
    setPlayingVideos((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleMute = (postId) => {
    setMutedVideos((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'success',
      Medium: 'warning',
      Hard: 'error',
    };
    return colors[difficulty] || 'primary';
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData.id;
      const token = localStorage.getItem('token') || user?.token;

      console.log('Comment - User data:', userData);
      console.log('Comment - User ID:', userId);

      if (!userId) {
        showBanner('error', 'Please login to add comments');
        return;
      }

      if (!token) {
        showBanner('error', 'Authentication required');
        return;
      }

      // Pass userId explicitly to the API
      await apiService.addComment(postId, userId, text, token);
      const updatedPost = await apiService.getFoodFeedById(postId, token);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, comments: updatedPost.comments } : post))
      );
    } catch (error) {
      showBanner('error', error.message || 'Failed to add comment');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {banner.show && (
        <Banner
          type={banner.type}
          message={banner.message}
          onClose={() => setBanner({ show: false, type: '', message: '' })}
        />
      )}

      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chef Feed 👨‍🍳</h1>
              <p className="text-gray-600">Discover recipes and cooking tips from home chefs</p>
            </div>
            {isAuthenticated && (
              <Button onClick={() => setShowCreatePost(true)} className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Share Recipe</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                <div className="flex space-x-2 mb-4">
                  {[
                    { type: 'TEXT', label: 'Text', icon: MessageCircle },
                    { type: 'IMAGE', label: 'Photo', icon: Image },
                    { type: 'VIDEO', label: 'Video', icon: Video },
                    { type: 'RECIPE', label: 'Recipe', icon: ChefHat },
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewPost((prev) => ({ ...prev, type }))}
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

                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your cooking story, tips, or recipe..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                />

                {(newPost.type === 'IMAGE' || newPost.type === 'VIDEO') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newPost.type === 'IMAGE' ? 'Upload Image' : 'Upload Video'}
                    </label>
                    <input
                      type="file"
                      accept={newPost.type === 'IMAGE' ? 'image/*' : 'video/mp4,video/webm'}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          [newPost.type.toLowerCase()]: e.target.files[0],
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {newPost.type === 'RECIPE' && (
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newPost.recipe.name}
                        onChange={(e) =>
                          setNewPost((prev) => ({
                            ...prev,
                            recipe: { ...prev.recipe, name: e.target.value },
                          }))
                        }
                        placeholder="Recipe name"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newPost.recipe.cookingTime}
                        onChange={(e) =>
                          setNewPost((prev) => ({
                            ...prev,
                            recipe: { ...prev.recipe, cookingTime: e.target.value },
                          }))
                        }
                        placeholder="Cooking time"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={newPost.recipe.serves}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          recipe: { ...prev.recipe, serves: e.target.value },
                        }))
                      }
                      placeholder="Serves how many people"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Recipe Image (Optional)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors duration-200">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const maxSize = 5 * 1024 * 1024;
                              if (file.size > maxSize) {
                                showBanner('error', 'File too large. Maximum size: 5MB');
                                return;
                              }
                              setNewPost((prev) => ({
                                ...prev,
                                image: file,
                              }));
                            }
                          }}
                          className="hidden"
                          id="recipe-image-upload"
                        />
                        <label htmlFor="recipe-image-upload" className="cursor-pointer">
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-gray-600">
                            <span className="font-medium text-primary-600 hover:text-primary-500">
                              Click to upload recipe image
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </div>
                        </label>
                      </div>
                      {newPost.image && (
                        <div className="relative">
                          <img 
                            src={URL.createObjectURL(newPost.image)} 
                            alt="Recipe preview" 
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200" 
                          />
                          <button
                            onClick={() => setNewPost((prev) => ({ ...prev, image: null }))}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <textarea
                      value={newPost.recipe.ingredients}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          recipe: { ...prev.recipe, ingredients: e.target.value },
                        }))
                      }
                      placeholder="List ingredients..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <textarea
                      value={newPost.recipe.instructions}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          recipe: { ...prev.recipe, instructions: e.target.value },
                        }))
                      }
                      placeholder="Step-by-step instructions..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={handleCreatePost} className="flex-1">
                    Share Post
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreatePost(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900">{post.chef.username || 'Unknown Chef'}</h3>
                        {post.chef.profilePicture && (
                          <img
                            src={getImageUrl(post.chef.profilePicture)}
                            alt={`${post.chef.username}'s profile`}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{new Date(post.createdAt).toLocaleString() || 'Unknown time'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
              </div>

              {post.type !== 'TEXT' && post.imagePath && (
                <div className="relative mb-4">
                  <img
                    src={getImageUrl(post.imagePath)}
                    alt="Post content"
                    className="w-full h-96 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}

              {post.type !== 'TEXT' && post.videoPath && (
                <SimpleVideoPlayer
                  post={post}
                  playingVideos={playingVideos}
                  mutedVideos={mutedVideos}
                  toggleVideo={toggleVideo}
                  toggleMute={toggleMute}
                />
              )}

              {post.recipe && (
                <div className="mx-6 mb-4">
                  <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                        <ChefHat className="w-5 h-5 text-orange-500" />
                        <span>{post.recipe.name}</span>
                      </h4>
                      {post.recipe.difficulty && (
                        <Badge variant={getDifficultyColor(post.recipe.difficulty)} size="sm">
                          {post.recipe.difficulty}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{post.recipe.cookingTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{post.recipe.serves}</span>
                      </div>
                    </div>

                    {post.recipe.ingredients && (
                      <div className="mb-4">
                        <p className="font-semibold text-gray-900 mb-2">Ingredients:</p>
                        <p className="text-gray-700 text-sm leading-relaxed">{post.recipe.ingredients}</p>
                      </div>
                    )}

                    {post.recipe.instructions && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Instructions:</p>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{post.recipe.instructions}</p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors duration-200 ${
                        post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes?.length || post.likes}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200">
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-medium">{post.comments?.length || post.comments}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
                      <Share2 className="w-6 h-6" />
                      <span className="font-medium">0</span>
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

              <div className="px-6 pb-6">
                <div className="flex items-center space-x-3">
                  <img
                    src={user?.profilePicture ? getImageUrl(user.profilePicture) : 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=50'}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      type="text"
                      id={`comment-input-${post.id}`}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleCommentSubmit(post.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(`comment-input-${post.id}`);
                        if (input && input.value.trim()) {
                          handleCommentSubmit(post.id, input.value);
                          input.value = '';
                        }
                      }}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-200"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        {/* User Profile Picture */}
                        <div className="flex-shrink-0">
                          <img
                            src={comment.user.profilePicture ? getImageUrl(comment.user.profilePicture) : 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=50'}
                            alt={`${comment.user.username || 'Unknown User'}'s profile`}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          />
                        </div>
                        
                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {comment.user.username || 'Unknown User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

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
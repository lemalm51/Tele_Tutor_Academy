import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Footer from '../../component/student/Footer'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const BecomeEducator = () => {
  const { backendUrl, getToken, setIsEducator } = useContext(AppContext)
  const navigate = useNavigate()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  const handleBecomeEducator = async () => {
    // Check if user is logged in
    if (!user) {
      toast.warning('Please log in to become an educator')
      return
    }

    setLoading(true)
    setDebugInfo('Starting process...')
    
    try {
      setDebugInfo(prev => prev + '\n🔑 Getting token...')
      const token = await getToken()
      setDebugInfo(prev => prev + '\n✅ Token obtained: ' + (token ? 'Yes' : 'No'))
      
      if (!token) {
        setDebugInfo(prev => prev + '\n❌ No token available')
        toast.error('Authentication token not available')
        return
      }

      setDebugInfo(prev => prev + '\n📡 Calling API: ' + backendUrl + '/api/educator/update-role')
      
      // Use axios with proper configuration
      const { data } = await axios({
        method: 'GET',
        url: backendUrl + '/api/educator/update-role',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      })

      setDebugInfo(prev => prev + '\n✅ API Response: ' + JSON.stringify(data))

      if (data.success) {
        setDebugInfo(prev => prev + '\n🎉 Success! Becoming educator...')
        toast.success('🎉 You are now an educator! You can create and share STEM courses.')
        setIsEducator(true)
        
        // Immediate redirect to educator dashboard
        setDebugInfo(prev => prev + '\n🔄 Redirecting to educator dashboard...')
        navigate('/educator')
      } else {
        setDebugInfo(prev => prev + '\n❌ API returned error: ' + data.message)
        toast.error(data.message || 'Failed to become educator')
      }
    } catch (error) {
      console.error('❌ Error becoming educator:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
      setDebugInfo(prev => prev + '\n💥 Error: ' + errorMessage)
      
      if (error.response) {
        // Server responded with error status
        setDebugInfo(prev => prev + '\n📊 Status: ' + error.response.status)
      } else if (error.request) {
        // Request made but no response
        setDebugInfo(prev => prev + '\n📡 No response from server')
      }
      
      toast.error('Failed to become educator: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-blue-200">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Join as Educator
              </h1>
              <p className="text-gray-600 mb-6">
                Please log in to your account to become a STEM educator and start creating courses.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Become a STEM Educator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Share your knowledge and inspire the next generation of STEM learners in Asella
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
              <h3 className="text-2xl font-semibold text-blue-800 mb-4">🎓 Why Become an Educator?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Share your STEM expertise with students
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Create engaging course content
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Help bridge the STEM education gap
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Build your teaching portfolio
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Make education accessible to all
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border border-green-200">
              <h3 className="text-2xl font-semibold text-green-800 mb-4">🚀 What You Can Do</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Create unlimited STEM courses
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Upload course videos and materials
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Track student progress
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Get enrollment analytics
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Join our educator community
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-8 text-center border-2 border-blue-300">
            <h2 className="text-3xl font-bold text-blue-800 mb-4">Ready to Start Teaching?</h2>
            <p className="text-blue-600 mb-6 text-lg">
              Join our community of educators making STEM education accessible in Asella
            </p>
            
            <button
              onClick={handleBecomeEducator}
              disabled={loading}
              className={`px-8 py-4 rounded-lg text-xl font-semibold transition-colors shadow-lg ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed text-white' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Become an Educator Now'
              )}
            </button>
            
            <p className="text-gray-500 mt-4 text-sm">
              It's free and takes just one click!
            </p>
            
            {/* Enhanced Debug info */}
            <div className="mt-6 p-4 bg-yellow-100 rounded text-xs text-yellow-800 text-left font-mono">
              <strong>🚨 Debug Info:</strong>
              <div className="mt-2 whitespace-pre-wrap">
                User: {user ? user.fullName : 'Not logged in'}<br />
                Backend: {backendUrl}<br />
                Loading: {loading ? 'Yes' : 'No'}<br />
                <br />
                <strong>Process Log:</strong><br />
                {debugInfo || 'No actions yet... Click the button above to test.'}
              </div>
              <button 
                onClick={() => setDebugInfo('')}
                className="mt-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs"
              >
                Clear Log
              </button>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/educator')}
              className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Go to Educator Dashboard
            </button>
            <button 
              onClick={() => navigate('/educator/add-course')}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Add New Course
            </button>
            <button 
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default BecomeEducator
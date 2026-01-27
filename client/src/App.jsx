import React from 'react'
import { Route, Routes ,useMatch} from 'react-router-dom'
import Home from './pages/student/Home'
import CourseList from './pages/student/CourseList'
import CourseDetails from './pages/student/CourseDetails' // Make sure this import matches
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import Loading from './component/student/Loading'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/student/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Navbar from './component/student/Navbar'
import PageTransition from './component/PageTransition'
import "quill/dist/quill.snow.css";
import BecomeEducator from './pages/educator/BecomeEducator'
import VideoClass from './pages/student/VideoClass';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import Analytics from './pages/admin/Analytics';

const App = () => {
  const isEducatorRoute=useMatch('/educator/*')
  return (
    <div className='text-default min-h-screen bg-white'>
      {!isEducatorRoute && <Navbar />}

      <PageTransition>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/course-list' element={<CourseList />} />
          <Route path='/course-list/:input' element={<CourseList />} />

          <Route path='/course/:id' element={<CourseDetails />} />
          <Route path='/my-enrollments' element={<MyEnrollments />} />
          <Route path='/player/:courseId' element={<Player />} />
          <Route path='/loading/:path' element={<Loading />} />
          <Route path='/become-educator' element={<BecomeEducator />} />
          <Route path='/video-class/:courseId' element={<VideoClass />} />

          <Route path='/educator' element={ <Educator />} >
              <Route index element={<Dashboard />} />
              <Route path='add-course' element={<AddCourse />} />
              <Route path='my-courses' element={<MyCourses />} />
              <Route path='student-enrolled' element={<StudentsEnrolled />} />
          </Route>

          <Route path='/admin' element={<AdminDashboard />} />
          <Route path='/admin/users' element={<UserManagement />} />
          <Route path='/admin/courses' element={<CourseManagement />} />
          <Route path='/admin/analytics' element={<Analytics />} />

        </Routes>
      </PageTransition>
    </div>
  )
}

export default App

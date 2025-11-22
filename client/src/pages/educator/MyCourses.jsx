// Add this check before rendering the table
if (!courses || courses.length === 0) {
  return (
    <div className='h-full mb-10 flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='w-full'>
        <div className="block sm:hidden">
          <Logger/>
        </div>
        // Replace empty image handling
<img 
  src={course.courseThumbnail || "https://via.placeholder.com/400x300"} 
  alt="CourseImage"
  className="w-16 h-12 object-cover rounded"
/>
        <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
        <div className='flex items-center justify-center py-12 border border-gray-500/20 rounded-md bg-white'>
          <p className='text-gray-500'>No courses found. Create your first course!</p>
          <button 
            onClick={() => window.location.href = '/educator/add-course'}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Course
          </button>
        </div>
      </div>
    </div>
  );
}
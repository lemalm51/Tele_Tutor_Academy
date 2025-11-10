import React from 'react'
import { assets } from '../../assets/assets'

const Companies = () => {
  return (
    <div className='pt-16'>
      <p className='text-base text-gray-500'>Supported By</p>
      <div className='flex flex-wrap items-center justify-center gap-6 md:gap-16 md:mt-10 mt-5'>
        <img src={assets.telelogo} alt="telelogo" className='w-20 md:w-28' />
        <img src={assets.aulogo} alt="aulogo" className='w-20 md:w-28' />
        <img src={assets.astulogo} alt="astulogo" className='w-20 md:w-28' />
        <img src={assets.riftylogo} alt="riftylogo" className='w-20 md:w-28' />
        <img src={assets.cbelogo} alt="cbelogo" className='w-20 md:w-28' />
      </div>
    </div>
  )
}

export default Companies

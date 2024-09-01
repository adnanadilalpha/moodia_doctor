

import React from 'react'
import Sidebar from '../components/sidebar'
import Navbar from '../components/navbar'

function Settings() {
  return (
<div className='flex'>
<Sidebar />
<div className="flex-grow flex flex-col">
<Navbar />
  <div className='text-4xl text-black'>
  Settings
  </div>
</div>
</div>
  )
}

export default Settings
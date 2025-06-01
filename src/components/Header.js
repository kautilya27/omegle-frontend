"use client"

import { useState, useEffect } from "react"

function getRandomInRange(prev) {
  // Generate a random delta between -50 and 50, excluding 0
  let delta = Math.floor(Math.random() * 101) - 50
  if (delta === 0) delta = 1
  let next = prev + delta
  // Clamp the value between 8000 and 12000
  if (next < 8000) next = 8000
  if (next > 12000) next = 12000
  return next
}

function Header() {
  const [onlineNow, setOnlineNow] = useState(Math.floor(Math.random() * (12000 - 8000 + 1)) + 8000)

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineNow((prev) => getRandomInRange(prev))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex flex-wrap items-center justify-between bg-white px-2 sm:px-4 py-2 sm:py-3 shadow-md border-b border-gray-100 relative">
      {/* Logo and Online Text */}
      <div className="flex items-center flex-wrap">
        <div className="flex items-center gap-1">
          <img
            src="https://ext.same-assets.com/2180202029/3907936530.png"
            alt="Omegle Online Logo"
            className="h-8 sm:h-10 md:h-[42px]"
          />
          <span className="font-semibold text-[8px] sm:text-xs text-[#d2874f] tracking-wider relative top-2 sm:top-3">
            Online
          </span>
        </div>

        {/* Talk to strangers! - Straight on mobile, tilted on larger screens */}
        <span className="inline-block transform rotate-0 md:-rotate-6 text-sm sm:text-lg md:text-xl text-[#464b5a] font-bold leading-tight whitespace-nowrap ml-3 sm:ml-6 mt-1 sm:mt-1.5">
  Talk to strangers!
</span>


      </div>

      {/* Online Now - Responsive text sizes */}
      <div className="flex items-center md:static absolute top-1 right-2">
        <span className="font-bold text-sm sm:text-lg md:text-xl lg:text-2xl text-[#68a8f5] mr-1">
          {onlineNow.toLocaleString()}
        </span>
        <span className="text-[#68a8f5] font-medium text-xs sm:text-sm md:text-base">online now</span>
      </div>
    </header>
  )
}

export default Header

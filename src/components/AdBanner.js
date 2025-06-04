"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "../contexts/ThemeContext"

const AdBanner = ({ position }) => {
  const { darkMode } = useTheme()
  const adRef = useRef(null)

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({})
      }
    } catch (e) {
      console.error("AdSense error:", e)
    }
  }, [])

  return (
    <div
     className="w-full h-24 mb-4 flex items-center justify-center rounded bg-white text-gray-600"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: "390px", height: "60px" }}
        data-ad-client="ca-pub-6382255537358474"
        data-ad-slot="1425864328"
        ref={adRef}
      />
    </div>
  )
}

export default AdBanner

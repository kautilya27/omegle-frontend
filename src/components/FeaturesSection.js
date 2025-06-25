"use client"

import { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"

function FeaturesSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const features = [
    {
      title: "Secured Environment",
      description:
        "Your safety is paramount. At Omegle Online, we provide a secure platform with advanced screening processes. Chat with peace of mind, knowing we've taken measures to ensure a smooth and worry-free experience.",
    },
    {
      title: "Fast Connections",
      description:
        "Dive straight into exciting conversations! Our ultra-efficient matching system minimizes wait times and maximizes your chat experience. Discover why our speed and ease of use set us apart as the leading Omegle alternative.",
    },
    {
      title: "Global Reach",
      description:
        "Connect with a diverse international community. Expand your horizons as you interact with users from around the world, enriching your social experience on Omegle Online. Enjoy engaging in online chat random and stranger video call online.",
    },
  ]

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Omegle Online Features",
    "url": "https://www.omegleonline.com", 
    "mainEntity": features.map((feature) => ({
      "@type": "Service",
      "name": feature.title,
      "description": feature.description,
      "provider": {
        "@type": "Organization",
        "name": "Omegle Online"
      }
    }))
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === features.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? features.length - 1 : prev - 1))
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextSlide()
    }
    if (touchStart - touchEnd < -50) {
      prevSlide()
    }
  }

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      const interval = setInterval(() => {
        nextSlide()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentSlide])

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <section className="bg-[#faf7f4] py-10 px-5">
        {/* Desktop view - side by side */}
        <div className="hidden md:flex justify-center gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex-1 bg-white rounded-2xl p-6 shadow-lg text-center max-w-xs">
              <h2 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Mobile view - slider */}
        <div
          className="md:hidden relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 bg-white rounded-2xl p-6 shadow-lg text-center"
                >
                  <h2 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1 bg-white/80 rounded-full p-2 shadow-md"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1 bg-white/80 rounded-full p-2 shadow-md"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-4 gap-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index ? "w-6 bg-blue-500" : "w-2 bg-gray-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default FeaturesSection

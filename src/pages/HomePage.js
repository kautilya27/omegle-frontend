"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TermsPopup from "./TermsPopup"

const getNextOnlineUsers = (prev) => {
  let delta = Math.floor(Math.random() * 101) - 50 // -50 to +50
  if (delta === 0) delta = 1
  let next = prev + delta
  if (next < 8000) next = 8000
  if (next > 13000) next = 13000
  return next
}

const HomePage = () => {
  const navigate = useNavigate()
  const [onlineUsers, setOnlineUsers] = useState(
    Math.floor(Math.random() * 5000) + 8000
  )
  const [showTermsPopup, setShowTermsPopup] = useState(false)
  const [pendingChatType, setPendingChatType] = useState(null)
  const [interests, setInterests] = useState("")

  // Update onlineUsers every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => getNextOnlineUsers(prev))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // When user clicks Text or Video, show popup
  const handleStartChat = (type) => {
    setPendingChatType(type)
    setShowTermsPopup(true)
  }

  // When user accepts terms in popup
  const handleAcceptTerms = () => {
    setShowTermsPopup(false)
    if (pendingChatType) {
      navigate("/chat", { state: { chatType: pendingChatType, interests } })
      setPendingChatType(null)
    }
  }

  // When user cancels popup
  const handleCancelTerms = () => {
    setShowTermsPopup(false)
    setPendingChatType(null)
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* You can add your logo or other header content here */}
        </div>
        <div className="flex items-center">
          <span className="text-blue-500 font-bold text-lg mr-2">
            {onlineUsers.toLocaleString()}
          </span>
          <span className="text-blue-500 font-medium text-base">
            online now
          </span>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-3xl">
        <div className="bg-white rounded-lg p-8 shadow-md">
          <h1 className="text-base font-medium text-gray-500 text-center mb-6 whitespace-nowrap">
            You don't need an app to use Omegle Online on your phone or tablet! The website works great on mobile.
          </h1>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img
              src="/people%20video%20calling.webp"
              alt="People Video Calling"
              style={{ maxWidth: "100%", height: "200px", borderRadius: 8, marginLeft: "25%" }}
            />
          </div>
          <div className="mb-8">
            <p className="mb-4">
              Omegle (oh-meg-ull) Online is a great way to meet new friends. When you use Omegle Online, we pick someone
              else at random and let you talk one-on-one. To help you stay safe, chats are anonymous unless you tell
              someone who you are (not suggested!), and you can stop a chat at any time. Predators have been known to
              use Omegle Online, so please be careful.
            </p>
          </div>
          <div className="p-4 mb-8 text-center rounded bg-blue-100">
            <p className="font-bold">Video is monitored. Keep it clean !</p>
          </div>
         
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-4">What do you wanna talk about?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <input
                type="text"
                placeholder="Add your interests (optional)"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className="p-3 rounded border border-gray-300 w-full"
              />
            </div>
            <h2 className="text-xl font-bold mb-4">Start chatting:</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleStartChat("text")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded"
              >
                Text
              </button>
              <span className="self-center">or</span>
              <button
                onClick={() => handleStartChat("video")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded"
              >
                Video
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Terms Popup */}
      {showTermsPopup && (
        <TermsPopup
          onAccept={handleAcceptTerms}
          onCancel={handleCancelTerms}
        />
      )}
    </div>
  )
}

export default HomePage

"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import TermsPopup from "./TermsPopup"

const HomePage = () => {
  const navigate = useNavigate()
  const [showTermsPopup, setShowTermsPopup] = useState(false)
  const [pendingChatType, setPendingChatType] = useState(null)
  const [interests, setInterests] = useState("")

  const handleStartChat = (type) => {
    setPendingChatType(type)
    setShowTermsPopup(true)
  }

  const handleAcceptTerms = () => {
    setShowTermsPopup(false)
    if (pendingChatType) {
      navigate("/chat", { state: { chatType: pendingChatType, interests } })
      setPendingChatType(null)
    }
  }

  const handleCancelTerms = () => {
    setShowTermsPopup(false)
    setPendingChatType(null)
  }

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <header className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center">
          {/* Add logo or header content if needed */}
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg p-8 shadow-md">
          <p className="text-sm font-medium text-gray-500 text-center mb-6 overflow-hidden text-ellipsis whitespace-nowrap">
            You don't need an app to use Omegle Online on your phone or tablet! The website works great on mobile.
          </p>

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

          {/* Final Layout for Input and Centered Buttons */}
          <div className="text-center mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-6">

              {/* Left: Interest Input */}
              <div className="flex flex-col items-start w-full sm:w-1/2 pr-4">
                <label className="text-base font-semibold mb-2">What do you wanna talk about?</label>
                <input
                  type="text"
                  placeholder="Add your interests (optional)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="p-2 w-full border border-gray-300 rounded"
                />
              </div>

              {/* Right: Buttons with Centered Label Above */}
              <div className="flex flex-col items-center w-full sm:w-1/2 pl-4">
                <label className="text-base font-semibold mb-2 text-center">Start chatting:</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStartChat("text")}
                    className="bg-gradient-to-b from-[#4facfe] to-[#00f2fe] text-white font-bold py-2 px-6 rounded-lg border border-blue-300 shadow-inner hover:from-[#3ea8fe] hover:to-[#00d6e5]"
                  >
                    Text
                  </button>
                  <span className="text-sm text-gray-600 font-semibold">or</span>
                  <button
                    onClick={() => handleStartChat("video")}
                    className="bg-gradient-to-b from-[#4facfe] to-[#00f2fe] text-white font-bold py-2 px-6 rounded-lg border border-blue-300 shadow-inner hover:from-[#3ea8fe] hover:to-[#00d6e5]"
                  >
                    Video
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

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

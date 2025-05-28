"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import io from "socket.io-client"
import ReportModal from "../components/ReportModal"
import { initializePeerConnection, createOffer, handleAnswer, handleIceCandidate } from "../utils/webrtc"
// changes made here
const ChatPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const interests = location.state?.interests || ""

  // Status and connection states
  const [status, setStatus] = useState("Connecting to server...")
  const [connected, setConnected] = useState(false)
  const [country, setCountry] = useState("somewhere")
  const [showReportModal, setShowReportModal] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)

  // Chat states
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState("")
  const messagesEndRef = useRef(null)

  // WebRTC and socket refs
  const socketRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const connectionTimeoutRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socketRef.current.on("connect", () => {
      console.log("Connected to server with socket ID:", socketRef.current.id)
      setStatus("Waiting for a partner...")
      initializeMedia()
    })

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setStatus("Connection error. Trying to reconnect...")
    })

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`)
      setStatus("Reconnected! Looking for a partner...")
      initializeMedia()
    })

    socketRef.current.on("reconnect_failed", () => {
      console.error("Failed to reconnect")
      setStatus("Failed to reconnect. Please refresh the page.")
    })

    socketRef.current.on("partner-found", (data) => {
      console.log("Partner found:", data)

      // Clear any existing connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      setStatus("Connected")
      setConnected(true)
      setReconnecting(false)
      setCountry(data.country || "somewhere")

      if (data.initiator) {
        console.log("We are the initiator, starting call")
        startCall()
      } else {
        console.log("We are not the initiator, waiting for offer")
      }
    })

    socketRef.current.on("offer", async (offer) => {
      console.log("Received offer")
      try {
        if (!peerConnectionRef.current) {
          peerConnectionRef.current = await initializePeerConnection(
            localStreamRef.current,
            handleRemoteStream,
            (candidate) => socketRef.current.emit("ice-candidate", candidate),
          )
        }

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        socketRef.current.emit("answer", answer)
      } catch (error) {
        console.error("Error handling offer:", error)
        // If there's an error, try to find a new partner
        setStatus("Error establishing connection. Finding a new partner...")
        cleanupCall()
        setTimeout(() => {
          findPartner()
        }, 2000)
      }
    })

    socketRef.current.on("answer", (answer) => {
      handleAnswer(peerConnectionRef.current, answer)
    })

    socketRef.current.on("ice-candidate", (candidate) => {
      handleIceCandidate(peerConnectionRef.current, candidate)
    })

    socketRef.current.on("chat-message", (message) => {
      setMessages((prev) => [...prev, { text: message, sender: "partner" }])
    })

    socketRef.current.on("partner-disconnected", () => {
      console.log("Partner disconnected")
      setStatus("Partner disconnected. Looking for a new one...")
      setConnected(false)
      setReconnecting(true)
      cleanupCall()

      // The server will automatically find a new partner for us
      // But we'll set a timeout just in case
      connectionTimeoutRef.current = setTimeout(() => {
        console.log("Connection timeout, manually finding a new partner")
        findPartner()
      }, 5000)
    })

    return () => {
      console.log("Cleaning up component")
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      socketRef.current.disconnect()
    }
  }, [])

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initializeMedia = async () => {
    try {
      // If we already have a stream, don't request a new one
      if (localStreamRef.current && localVideoRef.current && localVideoRef.current.srcObject) {
        console.log("Using existing media stream")
        findPartner()
        return
      }

      console.log("Requesting media devices")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      findPartner()
    } catch (error) {
      console.error("Error accessing media devices:", error)
      setStatus("Error accessing camera/microphone. Please check your permissions.")
    }
  }

  const handleRemoteStream = (stream) => {
    console.log("Received remote stream")
    remoteStreamRef.current = stream

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream
    }
  }

  const findPartner = () => {
    setStatus("Looking for a partner...")
    console.log("Finding partner with interests:", interests)
    socketRef.current.emit("find-partner", { chatType: "video", interests })

    // Set a timeout to retry if we don't find a partner
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }

    connectionTimeoutRef.current = setTimeout(() => {
      if (!connected) {
        console.log("Partner search timeout, retrying")
        findPartner()
      }
    }, 10000)
  }

  const startCall = async () => {
    try {
      console.log("Starting call as initiator")

      // Create a new peer connection
      peerConnectionRef.current = await initializePeerConnection(
        localStreamRef.current,
        handleRemoteStream,
        (candidate) => {
          console.log("Sending ICE candidate to partner")
          socketRef.current.emit("ice-candidate", candidate)
        },
      )

      // Create and send an offer
      const offer = await createOffer(peerConnectionRef.current)
      console.log("Sending offer to partner")
      socketRef.current.emit("offer", offer)
    } catch (error) {
      console.error("Error starting call:", error)
      setStatus("Error starting call. Please try again.")

      // Try to find a new partner after a short delay
      setTimeout(() => {
        nextPartner()
      }, 2000)
    }
  }

  const cleanupCall = () => {
    console.log("Cleaning up call")

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close()
      } catch (err) {
        console.error("Error closing peer connection:", err)
      }
      peerConnectionRef.current = null
    }

    if (remoteStreamRef.current) {
      try {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop())
      } catch (err) {
        console.error("Error stopping remote tracks:", err)
      }
      remoteStreamRef.current = null

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
    }

    // Clear messages when disconnecting
    setMessages([])
  }

  const nextPartner = () => {
    setStatus("Looking for a new partner...")
    setConnected(false)
    setMessages([])

    // Clean up the current call
    cleanupCall()

    // Emit the next-partner event
    console.log("Requesting next partner")
    socketRef.current.emit("next-partner")

    // Set a timeout to retry if we don't find a partner
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
    }

    connectionTimeoutRef.current = setTimeout(() => {
      if (!connected) {
        console.log("Next partner search timeout, retrying")
        findPartner()
      }
    }, 10000)
  }

  const disconnect = () => {
    navigate("/")
  }

  const sendMessage = () => {
    if (currentMessage.trim() && connected) {
      socketRef.current.emit("chat-message", currentMessage)
      setMessages((prev) => [...prev, { text: currentMessage, sender: "me" }])
      setCurrentMessage("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  const reportUser = (reason) => {
    socketRef.current.emit("report-user", { reason })
    setShowReportModal(false)
    nextPartner()
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              <span className="text-blue-500">O</span>
              <span className="text-orange-500">megle</span>
            </div>
          </div>
          <div className="flex space-x-6">
            <button className="font-medium border-b-2 border-black pb-1">VIDEO CHAT</button>
            <button className="font-medium text-gray-500">MESSAGE</button>
            <button className="font-medium text-gray-500">HISTORY</button>
          </div>
          <div className="flex space-x-2">
            <button className="bg-orange-500 text-white px-4 py-1 rounded">Store</button>
            <button className="bg-blue-500 text-white px-4 py-1 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              PLUS
            </button>
            <button className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <span className="font-bold">S</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Connection status indicator */}
        {reconnecting && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
            <p className="font-bold">Reconnecting...</p>
            <p>Looking for a new partner. Please wait.</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          {/* Left side - Video displays */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* Local video */}
            <div className="relative bg-gray-600 rounded-lg overflow-hidden h-80">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold">Y</span>
                  </div>
                  <div>
                    <div className="font-bold">You</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Remote video */}
            <div className="relative bg-black rounded-lg overflow-hidden h-80">
              {connected ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">{status}</div>
              )}
              {connected && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div>
                      <div className="font-bold">Stranger</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Chat */}
          <div className="w-full md:w-1/2 bg-white border border-gray-200 rounded-lg flex flex-col">
            {/* Chat header */}
            {connected ? (
              <div className="p-4 border-b border-gray-200">
                <p className="text-lg">
                  Great match! Connecting with someone from {country}. Get ready for an exciting chat!
                  <span className="ml-2">🌎 💬</span>
                </p>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-200">
                <p className="text-lg">{status}</p>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex-grow p-4 overflow-y-auto h-[400px]">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {connected ? "Say hello to your new friend!" : "Waiting for someone to connect..."}
                </div>
              )}

              {messages.map((msg, index) => (
                <div key={index} className={`mb-2 ${msg.sender === "me" ? "text-right" : "text-left"}`}>
                  <span
                    className={`inline-block px-3 py-2 rounded-lg ${
                      msg.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={connected ? "Type a message..." : "Waiting for connection..."}
                  disabled={!connected}
                  className="flex-grow p-3 rounded-l border border-gray-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={!connected || !currentMessage.trim()}
                  className={`p-3 rounded-r ${
                    connected && currentMessage.trim()
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-400 text-gray-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={nextPartner}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg mx-2"
          >
            Next
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg mx-2"
            disabled={!connected}
          >
            Report
          </button>
          <button
            onClick={disconnect}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg mx-2"
          >
            Stop (ESC)
          </button>
        </div>
      </main>

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onSubmit={reportUser} />}
    </div>
  )
}

export default ChatPage

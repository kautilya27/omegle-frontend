"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import io from "socket.io-client"
import ReportModal from "../components/ReportModal"
import { initializePeerConnection, createOffer, handleAnswer, handleIceCandidate } from "../utils/webrtc"
import AdBanner from "../components/AdBanner"

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
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [localVideoReady, setLocalVideoReady] = useState(false)

  // Chat states
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState("")
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // WebRTC and socket refs - PERSISTENT REFS
  const socketRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null) // PERSIST STREAM
  const remoteStreamRef = useRef(null)
  const localVideoRef = useRef(null) // PERSIST VIDEO ELEMENT
  const remoteVideoRef = useRef(null)
  const connectionTimeoutRef = useRef(null)
  const videoInitializedRef = useRef(false) // Track if video was initialized

  // Manual play function for mobile
  const playLocalVideo = useCallback(async () => {
    if (localVideoRef.current && localStreamRef.current) {
      try {
        // Ensure the stream is attached
        if (localVideoRef.current.srcObject !== localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current
        }

        await localVideoRef.current.play()
        console.log("Local video playing successfully")
        setLocalVideoReady(true)
        return true
      } catch (error) {
        console.log("Play failed:", error)
        return false
      }
    }
    return false
  }, [])

  // Handle resize events - RE-CALL PLAY ON RESIZE
  useEffect(() => {
    const handleResize = () => {
      console.log("Window resized, ensuring video continues playing")

      // Re-call play() on resize for mobile
      if (localVideoRef.current && localStreamRef.current) {
        setTimeout(() => {
          playLocalVideo()
        }, 100)
      }
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
    }
  }, [playLocalVideo])

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(process.env.REACT_APP_API_URL || "http://localhost:5000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socketRef.current.on("connect", () => {
      console.log("Connected to server with socket ID:", socketRef.current.id)
      // setStatus("")
      if (!videoInitializedRef.current) {
        initializeMedia()
      } else {
        findPartner()
      }
    })

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setStatus("Connection error. Trying to reconnect...")
    })

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`)
      setStatus("")
      if (!localStreamRef.current) {
        initializeMedia()
      } else {
        findPartner()
      }
    })

    socketRef.current.on("reconnect_failed", () => {
      console.error("Failed to reconnect")
      setStatus("Failed to reconnect. Please refresh the page.")
    })

    socketRef.current.on("partner-found", (data) => {
      console.log("Partner found:", data)

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      setStatus("Connected")
      setConnected(true)
      setReconnecting(false)
      setCountry(data.country || "somewhere")

      // If we already have a remote stream, make sure to show it
      if (remoteStreamRef.current && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
        setHasRemoteVideo(true)
      }

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
      setHasRemoteVideo(false)
      cleanupCall()

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

      // DON'T STOP TRACKS UNLESS EXPLICITLY NEEDED
      if (localStreamRef.current && !videoInitializedRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }

      socketRef.current.disconnect()
    }
  }, [])

  // Fixed scroll behavior - only scroll when there are messages and chat is connected
  useEffect(() => {
    // Only scroll to bottom if there are messages and we're connected
    if (messages.length > 0 && messagesEndRef.current && chatContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        })
      })
    }
  }, [messages])

  // Ensure page starts at top on initial load
  useEffect(() => {
    // Scroll to top of page on component mount
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    // Also ensure chat container starts at top
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0
    }
  }, [])

  const initializeMedia = async () => {
    try {
      // If we already have a stream, don't reinitialize
      if (localStreamRef.current && videoInitializedRef.current) {
        console.log("Using existing media stream")
        playLocalVideo()
        findPartner()
        return
      }

      console.log("Requesting media devices")

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not supported")
        setStatus("Your browser doesn't support camera/microphone access")
        return
      }

      // Mobile-optimized constraints
      const constraints = {
        video: {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          facingMode: "user",
        },
        audio: true, // Enable audio
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log("Got media stream:", stream.id)
      } catch (error) {
        console.log("Failed with constraints, trying basic:", error)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
      }

      // PERSIST STREAM - don't replace if we already have one
      localStreamRef.current = stream
      videoInitializedRef.current = true

      // Set up video element with mobile-specific attributes
      if (localVideoRef.current) {
        console.log("Setting up local video element")

        // MOBILE RESTRICTIONS - Use all required attributes
        localVideoRef.current.setAttribute("playsinline", "true")
        localVideoRef.current.setAttribute("muted", "true")
        localVideoRef.current.setAttribute("autoplay", "true")
        localVideoRef.current.muted = true
        localVideoRef.current.playsInline = true
        localVideoRef.current.autoplay = true

        // Attach stream
        localVideoRef.current.srcObject = stream

        // Event handlers
        localVideoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded")
          playLocalVideo()
        }

        localVideoRef.current.oncanplay = () => {
          console.log("Video can play")
          playLocalVideo()
        }

        localVideoRef.current.onplay = () => {
          console.log("Video started playing")
          setLocalVideoReady(true)
        }

        localVideoRef.current.onpause = () => {
          console.log("Video paused, trying to resume")
          playLocalVideo()
        }

        localVideoRef.current.onerror = (e) => {
          console.error("Video error:", e)
        }

        // CALL PLAY() MANUALLY for mobile
        setTimeout(() => {
          playLocalVideo()
        }, 100)
      }

      console.log("Media stream initialized successfully")
      findPartner()
    } catch (error) {
      console.error("Error accessing media devices:", error)
      setStatus(`Camera error: ${error.message}`)
    }
  }

  // Handle user interaction to enable audio
  const enableAudio = useCallback(async () => {
    if (remoteVideoRef.current) {
      try {
        remoteVideoRef.current.muted = false
        await remoteVideoRef.current.play()
        console.log("Audio enabled successfully")
      } catch (error) {
        console.log("Audio enable failed:", error)
      }
    }
  }, [])

  // Add click handler to enable audio on user interaction
  const handleRemoteVideoClick = () => {
    enableAudio()
  }

  const handleRemoteStream = (stream) => {
    console.log("Received remote stream")
    remoteStreamRef.current = stream

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream

      // Ensure remote video is not muted to hear audio
      remoteVideoRef.current.muted = false

      // Make sure to set hasRemoteVideo to true to show the video
      setHasRemoteVideo(true)

      // Add event listeners to ensure video plays
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log("Remote video metadata loaded")
        remoteVideoRef.current.play().catch((err) => console.error("Error playing remote video:", err))
      }
    }
  }

  const findPartner = () => {
    if (!localStreamRef.current) {
      console.log("No local stream available, requesting permissions first")
      initializeMedia()
      return
    }

    setStatus("")
    setHasRemoteVideo(false)
    console.log("Finding partner with interests:", interests)
    socketRef.current.emit("find-partner", { chatType: "video", interests })

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

      peerConnectionRef.current = await initializePeerConnection(
        localStreamRef.current,
        handleRemoteStream,
        (candidate) => {
          console.log("Sending ICE candidate to partner")
          socketRef.current.emit("ice-candidate", candidate)
        },
      )

      const offer = await createOffer(peerConnectionRef.current)
      console.log("Sending offer to partner")
      socketRef.current.emit("offer", offer)
    } catch (error) {
      console.error("Error starting call:", error)
      setStatus("Error starting call. Please try again.")

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

    setHasRemoteVideo(false)
    setMessages([])
  }

  const nextPartner = () => {
    setStatus("Looking for a new partner...")
    setConnected(false)
    setMessages([])
    setHasRemoteVideo(false)

    cleanupCall()

    console.log("Requesting next partner")
    socketRef.current.emit("next-partner")

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

  // Custom Loader Component
  const LoaderComponent = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-600">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-orange-500 rounded-full animate-spin animation-delay-150"></div>
      </div>
      <div className="text-center px-4">
        <p className="text-white text-lg font-medium mb-2">{status}</p>
      </div>
      <div className="flex space-x-1 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-400"></div>
      </div>
    </div>
  )

  // Handle manual video play (for mobile user interaction)
  const handleVideoClick = () => {
    console.log("Video clicked, attempting manual play")
    playLocalVideo()
  }

  // Monitor remote video and stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current && connected) {
      console.log("Setting up remote video with existing stream")
      remoteVideoRef.current.srcObject = remoteStreamRef.current
      setHasRemoteVideo(true)
    }
  }, [connected, remoteVideoRef.current, remoteStreamRef.current])

  return (
    <div className="h-screen w-screen flex flex-col bg-white lg:overflow-hidden">
      {/* Custom CSS for animations */}
      <style jsx>{`
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-0.5rem);
          }
        }
        /* SIMPLIFIED CSS - AVOID HIDING/RESIZING VIDEO */
        .mobile-video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background-color: #1f2937 !important;
        }
        .mobile-video-mirror {
          transform: scaleX(-1) !important;
        }
        .mobile-video-container {
          background-color: #1f2937 !important;
          overflow: hidden !important;
          position: absolute !important;
        }
      `}</style>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Connection status indicator */}
        {reconnecting && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm flex-shrink-0">
            <p className="font-bold">Reconnecting...</p>
          </div>
        )}

        {/* Video container - Responsive layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Video section - Contains both remote and local videos - SMALLER ON DESKTOP */}
          <div className="relative flex-1 lg:w-[30%] overflow-hidden h-1/2 lg:h-auto">
            {/* Remote video container - REMOVED SHADOW */}
            <div className="relative h-full min-h-[180px] lg:h-[45%] bg-red-50 overflow-hidden mb-0">
              {connected || hasRemoteVideo ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onClick={handleRemoteVideoClick}
                />
              ) : (
                <LoaderComponent />
              )}

              {/* Your image watermark */}
              <img
                src={require("../assets/omeglelogo.png") || "/placeholder.svg"}
                alt="Watermark"
                className="absolute bottom-3 left-3 w-[110px] h-[40px] opacity-70 z-10 pointer-events-none"
                style={{ objectFit: "contain" }}
              />
            </div>

            {/* Local video container - Overlay on mobile, separate on desktop - REMOVED SHADOW */}
            <div
              className="absolute bottom-4 right-4 w-32 h-44 lg:relative lg:bottom-auto lg:right-auto lg:w-full lg:h-[45%] bg-gray-800 overflow-hidden z-20 lg:z-auto"
              onClick={handleVideoClick}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
                onClick={handleVideoClick}
              />

              {/* Loading indicator */}
              {!localVideoReady && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-20">
                  <div className="text-white text-xs lg:text-sm text-center">
                    <div className="w-4 h-4 lg:w-6 lg:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1 lg:mb-2"></div>
                    <div className="text-xs lg:text-sm">Loading Camera...</div>
                  </div>
                </div>
              )}

              {/* Manual play button for mobile */}
              {!localVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center z-30 lg:hidden">
                  <button
                    onClick={handleVideoClick}
                    className="bg-green-500 text-white px-3 py-2 lg:px-4 lg:py-3 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold"
                  >
                    ▶ Start Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Chat section - Right side on desktop, bottom on mobile - EXPANDED WIDTH */}
          <div className="flex flex-col overflow-hidden lg:w-[70%]">
            <div className="bg-white border-t-2 lg:border-0 flex flex-col h-64 lg:h-[600px] overflow-hidden">
              {/* Chat header - hidden on mobile */}
              <div className="hidden lg:block p-4 border-b-2 border-gray-100 flex-shrink-0 bg-gray-50">
                {connected && hasRemoteVideo ? (
                  <p className="text-lg font-medium text-gray-800">
                    You're now chatting with a random stranger from {country}. Stand with the fight against world
                    hunger.
                    <span className="ml-2">🌎 💬</span>
                  </p>
                ) : (
                  <p className="text-lg font-medium text-gray-600">{status}</p>
                )}
              </div>

              {/* Chat messages - ALWAYS VISIBLE - Added ref for scroll control */}
              <div ref={chatContainerRef} className="flex-1 p-2 lg:p-4 mb-1 lg:mb-2 overflow-y-auto bg-gray-50 block">
                <div className="min-h-full">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm lg:text-base">
                      {connected && hasRemoteVideo
                        ? "Say hello to your new friend!"
                        : "Waiting for someone to connect..."}
                    </div>
                  )}

                  {messages.map((msg, index) => (
                    <div key={index} className="mb-2 lg:mb-3 text-left">
                      <div className="flex items-start gap-2 justify-start">
                        <div className="flex flex-col">
                          <span className="text-sm lg:text-base text-gray-800">
                            <span className={`font-semibold ${msg.sender === "me" ? "text-blue-600" : "text-red-600"}`}>
                              {msg.sender === "me" ? "You" : "Stranger"}:
                            </span>{" "}
                            {msg.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat input */}
              <div className="p-2 lg:p-3 bg-white border-t-2 border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {/* Desktop controls on left */}
                  <button
                    onClick={nextPartner}
                    className="hidden lg:block bg-white text-gray-700 border border-gray-400 font-semibold py-3 px-4 rounded-none text-sm flex-shrink-0 transition-colors"
                  >
                    Next
                  </button>

                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={connected && hasRemoteVideo ? "Type a message..." : "Waiting for connection..."}
                    disabled={!connected || !hasRemoteVideo}
                    className="flex-1 p-3 text-sm lg:text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />

                  <button
                    onClick={sendMessage}
                    disabled={!connected || !hasRemoteVideo || !currentMessage.trim()}
                    className={`p-3 rounded-xl transition-colors ${
                      connected && hasRemoteVideo && currentMessage.trim()
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-400 text-gray-200"
                    } flex-shrink-0`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Desktop controls on right */}
                  <button
                    onClick={disconnect}
                    className="hidden lg:block bg-white text-gray-700 border border-gray-400 font-semibold py-3 px-4 rounded-none text-sm flex-shrink-0 transition-colors"
                  >
                    Stop
                  </button>
                </div>
              </div>

              <div>
                {/* Chat UI */}
                <AdBanner />
              </div>

              {/* Report button - Desktop only */}
              {connected && hasRemoteVideo && (
                <div className="hidden lg:block p-4 border-t-2 border-gray-200 flex-shrink-0 bg-gray-50">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                  >
                    Report User
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile controls - Bottom bar */}
          <div className="lg:hidden p-3 flex justify-center space-x-3 border-t-2 border-gray-200 flex-shrink-0 bg-white">
            <button
              onClick={nextPartner}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
            >
              Next
            </button>
            <button
              onClick={disconnect}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
            >
              Stop
            </button>
            {connected && hasRemoteVideo && (
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors"
              >
                Report
              </button>
            )}
          </div>
        </div>
      </main>

      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onSubmit={reportUser} />}
    </div>
  )
}

export default ChatPage

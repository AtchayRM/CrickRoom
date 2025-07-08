"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import io, { type Socket } from "socket.io-client"
import { Users, Clock, Trophy, Play, UserPlus, Crown, Timer, Zap, Star, ChevronRight, Sparkles } from "lucide-react"
import "./App.css"

const SOCKET_URL = "https://crickroom-9xzx.onrender.com"

interface User {
  id: string
  name: string
}

interface Player {
  id: number
  name: string
  role: string
  country: string
}

interface SelectedPlayer extends Player {
  userId: string
  userName: string
  isAutoSelected?: boolean
}

interface Room {
  id: string
  users: User[]
  isHost: boolean
  availablePlayers: Player[]
}

interface TurnInfo {
  userId: string
  userName: string
}

// Landing Page Component
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8 }}
    >
      <div className="landing-background">
        <div className="cricket-field"></div>
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{
                x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000)],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="landing-content">
        <motion.div
          className="brand-container"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <motion.div
            className="app-logo"
            initial={{ scale: 0.5, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          >
            <Trophy className="logo-icon" />
          </motion.div>

          <motion.h1
            className="app-title"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <span className="title-crick">Crick</span>
            <span className="title-room">Room</span>
          </motion.h1>

          <motion.p
            className="app-tagline"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            Step Into the Selection Zone
          </motion.p>

          <motion.div
            className="feature-highlights"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <div className="feature-item">
              <Users className="feature-icon" />
              <span>Real-time Multiplayer</span>
            </div>
            <div className="feature-item">
              <Timer className="feature-icon" />
              <span>Turn-based Selection</span>
            </div>
            <div className="feature-item">
              <Zap className="feature-icon" />
              <span>Live Updates</span>
            </div>
          </motion.div>

          <motion.button
            className="enter-button"
            onClick={onEnter}
            initial={{ y: 50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.7 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="button-icon" />
            Enter CrickRoom
            <ChevronRight className="button-arrow" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Main App Component
const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentView, setCurrentView] = useState<"home" | "room" | "game">("home")

  const [createUserName, setCreateUserName] = useState("")
  const [joinUserName, setJoinUserName] = useState("")
  const [joinHostName, setJoinHostName] = useState("")

  const [userId, setUserId] = useState("")
  const [room, setRoom] = useState<Room | null>(null)
  const [isSelectionStarted, setIsSelectionStarted] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [turnOrder, setTurnOrder] = useState<TurnInfo[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(10)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [notification, setNotification] = useState<string>("")
  const [finalTeams, setFinalTeams] = useState<any[]>([])
  const [isGameEnded, setIsGameEnded] = useState(false)

  useEffect(() => {
    if (!showLanding) {
      const newSocket = io(SOCKET_URL)
      setSocket(newSocket)
      setUserId(Math.random().toString(36).substr(2, 9))

      return () => {
        newSocket.close()
      }
    }
  }, [showLanding])

  useEffect(() => {
    if (!socket) return

    socket.on("room-joined", (data) => {
      setRoom(data)
      setAvailablePlayers(data.availablePlayers)
      setCurrentView("room")
      showNotification(`Joined ${data.hostName}'s room successfully!`)
    })

    socket.on("user-joined", (data) => {
      setRoom((prev) => (prev ? { ...prev, users: data.users } : null))
      showNotification(`${data.userName} joined the room`)
    })

    socket.on("selection-started", (data) => {
      setIsSelectionStarted(true)
      setTurnOrder(data.turnOrder)
      setCurrentTurn(data.currentTurn)
      setCurrentUserName(data.currentUserName)
      setAvailablePlayers(data.availablePlayers)
      setIsMyTurn(data.currentTurn === userId)
      setCurrentView("game")
      showNotification("Team selection has started!")
    })

    socket.on("turn-changed", (data) => {
      setCurrentTurn(data.currentTurn)
      setCurrentUserName(data.currentUserName)
      setIsMyTurn(data.currentTurn === userId)
      setTimeLeft(10)
    })

    socket.on("turn-timer-started", () => {
      setTimeLeft(10)
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    })

    socket.on("player-selected", (data) => {
      setSelectedPlayers((prev) => [
        ...prev,
        {
          ...data.player,
          userId: data.userId,
          userName: data.userName,
          isAutoSelected: data.isAutoSelected,
        },
      ])
      setAvailablePlayers((prev) => prev.filter((p) => p.id !== data.player.id))

      if (data.isAutoSelected) {
        showNotification(`${data.userName}'s time ran out! Auto-selected ${data.player.name}`)
      } else {
        showNotification(`${data.userName} selected ${data.player.name}`)
      }
    })

    socket.on("selection-ended", (data) => {
      setFinalTeams(data.finalTeams)
      setIsGameEnded(true)
      setIsSelectionStarted(false)
      showNotification("Team selection completed!")
    })

    socket.on("error", (data) => {
      showNotification(data.message, "error")
    })

    return () => {
      socket.off("room-joined")
      socket.off("user-joined")
      socket.off("selection-started")
      socket.off("turn-changed")
      socket.off("turn-timer-started")
      socket.off("player-selected")
      socket.off("selection-ended")
      socket.off("error")
    }
  }, [socket, userId])

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification(message)
    setTimeout(() => setNotification(""), 3000)
  }

  const createRoom = async () => {
    if (!createUserName.trim()) {
      showNotification("Please enter your name", "error")
      return
    }

    try {
      const response = await fetch(`${SOCKET_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName: createUserName }),
      })

      const data = await response.json()
      setUserId(data.hostId)

      socket?.emit("join-room", {
        hostName: createUserName,
        userName: createUserName,
        userId: data.hostId,
      })
    } catch (error) {
      showNotification("Failed to create room", "error")
    }
  }

  const joinRoom = () => {
    if (!joinUserName.trim() || !joinHostName.trim()) {
      showNotification("Please enter your name and host's name", "error")
      return
    }

    socket?.emit("join-room", {
      hostName: joinHostName.trim(),
      userName: joinUserName,
      userId,
    })
  }

  const startSelection = () => {
    socket?.emit("start-selection", { hostName: room?.hostName, userId })
  }

  const selectPlayer = (playerId: number) => {
    if (!isMyTurn) return
    socket?.emit("select-player", { hostName: room?.hostName, userId, playerId })
  }

  const resetGame = () => {
    setCurrentView("home")
    setRoom(null)
    setIsSelectionStarted(false)
    setSelectedPlayers([])
    setFinalTeams([])
    setIsGameEnded(false)
    setCreateUserName("")
    setJoinUserName("")
    setJoinHostName("")
  }

  if (showLanding) {
    return (
      <AnimatePresence>
        <LandingPage onEnter={() => setShowLanding(false)} />
      </AnimatePresence>
    )
  }

  // Your render code below...
}

export default App

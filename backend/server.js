const express = require("express")
const http = require("http")
const cors = require("cors")
const { Server } = require("socket.io")
const { v4: uuidv4 } = require("uuid")

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 10000

app.use(cors())
app.use(express.json())

// ✅ Added this route to show a clean message on "/" path
app.get("/", (req, res) => {
  res.send("<h2>✅ CrickRoom Backend is Live</h2><p>Welcome to the Cricket Team Selection Server.</p>")
})

// Example health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Cricket Team Selection Server is running!" })
})

// Socket setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id)

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId)
    console.log(`Socket ${socket.id} joined room ${roomId}`)
  })

  socket.on("selectPlayer", ({ roomId, player }) => {
    socket.to(roomId).emit("playerSelected", player)
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`🏏 Cricket Team Selection Server running on port ${PORT}`)
})
l
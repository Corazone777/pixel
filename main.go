package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Configure the WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Data Structures
type Player struct {
	ID    string  `json:"id"`
	GridX float64 `json:"gridX"`
	GridY float64 `json:"gridY"`
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// Global Network State
var (
	clients   = make(map[*websocket.Conn]*Player)
	clientsMu sync.Mutex
)

func main() {
	// 1. Serve your static HTML/JS files from a folder called "public"
	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", fs)

	// 2. The WebSocket Endpoint
	http.HandleFunc("/ws", handleConnections)

	log.Println("IBEX Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal("Server crashed: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer ws.Close()

	// Assign a simple ID based on connection address and spawn at 0,0
	playerID := ws.RemoteAddr().String()
	newPlayer := &Player{ID: playerID, GridX: 0, GridY: 0}

	clientsMu.Lock()
	clients[ws] = newPlayer

	// Collect all current players to send to the new arrival
	currentPlayers := make(map[string]*Player)
	for _, p := range clients {
		currentPlayers[p.ID] = p
	}
	clientsMu.Unlock()

	// Tell the new player about the current factory floor
	ws.WriteJSON(Message{Type: "currentPlayers", Payload: currentPlayers})

	// Broadcast to everyone else that a new human arrived
	broadcast(Message{Type: "playerJoined", Payload: newPlayer}, ws)

	// Listen for incoming movements
	for {
		var msg Message
		if err := ws.ReadJSON(&msg); err != nil {
			// Player closed their browser
			clientsMu.Lock()
			delete(clients, ws)
			clientsMu.Unlock()
			broadcast(Message{Type: "playerLeft", Payload: playerID}, nil)
			break
		}

		if msg.Type == "move" {
			// Parse the new coordinates and update the server state
			payloadMap := msg.Payload.(map[string]interface{})
			newPlayer.GridX = payloadMap["gridX"].(float64)
			newPlayer.GridY = payloadMap["gridY"].(float64)

			// Echo the movement to everyone else
			broadcast(Message{Type: "playerMoved", Payload: newPlayer}, ws)
		}
	}
}

func broadcast(msg Message, sender *websocket.Conn) {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	for client := range clients {
		if client != sender {
			client.WriteJSON(msg)
		}
	}
}

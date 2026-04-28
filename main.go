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

type Player struct {
	ID     string  `json:"id"`
	GridX  float64 `json:"gridX"`
	GridY  float64 `json:"gridY"`
	Dir    string  `json:"dir"`
	Name   string  `json:"name"`
	Avatar string  `json:"avatar"`
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

	// 🔥 THE FIX: We loop using both the connection object (c) and the player data (p)
	for c, p := range clients {
		// If the connection in the loop is NOT the guy who just joined... add them!
		if c != ws {
			currentPlayers[p.ID] = p
		}
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
			payloadMap := msg.Payload.(map[string]interface{})
			newPlayer.GridX = payloadMap["gridX"].(float64)
			newPlayer.GridY = payloadMap["gridY"].(float64)

			// 🔥 Capture the direction from the move message
			if d, ok := payloadMap["dir"].(string); ok {
				newPlayer.Dir = d
			}

			broadcast(Message{Type: "playerMoved", Payload: newPlayer}, ws)
		}

		if msg.Type == "join" {
			payloadMap := msg.Payload.(map[string]interface{})
			newPlayer.Name = payloadMap["name"].(string)
			newPlayer.Avatar = payloadMap["avatar"].(string)
			// Broadcast the update so everyone knows who this is
			broadcast(Message{Type: "playerJoined", Payload: newPlayer}, ws)
		}

		if msg.Type == "chat" {
			// We just pass the text payload through.
			// The client already knows the player ID/Name from the connection.
			broadcast(Message{Type: "chat", Payload: map[string]interface{}{
				"id":   newPlayer.ID,
				"name": newPlayer.Name,
				"text": msg.Payload.(map[string]interface{})["text"],
			}}, nil) // Send to everyone including the sender
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

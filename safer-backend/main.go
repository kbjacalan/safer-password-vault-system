package main

import (
	"fmt"
	"log"
	"net/http"

	"safer-backend/internal/config"
	"safer-backend/internal/db"
	"safer-backend/internal/router"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	database, err := db.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()
	log.Println("✅ Connected to MySQL database")

	handler := router.New(database, cfg.JWTSecret, cfg.JWTExpiryHours)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 Safer backend running on http://localhost%s", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("server: %v", err)
	}
}
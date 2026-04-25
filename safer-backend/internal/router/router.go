package router

import (
	"database/sql"
	"net/http"

	"safer-backend/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(db *sql.DB, jwtSecret string, jwtExpiry int) http.Handler {
	r := chi.NewRouter()

	// ── Global middleware ──────────────────────────────────────────────────────
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// ── Auth routes ────────────────────────────────────────────────────────────
	auth := &handlers.AuthHandler{
		DB:             db,
		JWTSecret:      jwtSecret,
		JWTExpiryHours: jwtExpiry,
	}

	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/signup", auth.Signup)
		r.Post("/signin", auth.Signin)
	})

	// ── Vault routes ───────────────────────────────────────────────────────────
	vault := &handlers.VaultHandler{
		DB:        db,
		JWTSecret: jwtSecret,
	}

	r.Route("/api/vault", func(r chi.Router) {
		r.Get("/", vault.List)
		r.Post("/", vault.Create)
		r.Delete("/{id}", vault.Delete)
		r.Patch("/{id}/favorite", vault.ToggleFavorite)
	})

	// ── Health check ───────────────────────────────────────────────────────────
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	return r
}

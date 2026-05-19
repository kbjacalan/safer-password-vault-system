package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"safer-backend/internal/jwt"
	"safer-backend/internal/models"

	"golang.org/x/crypto/bcrypt"
)

// ── request / response types ──────────────────────────────────────────────────

type signupRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type signinRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

type errorResponse struct {
	Error string `json:"error"`
}

// ── AuthHandler ───────────────────────────────────────────────────────────────

type AuthHandler struct {
	DB             *sql.DB
	JWTSecret      string
	JWTExpiryHours int
}

// ── helpers ───────────────────────────────────────────────────────────────────

var emailRegex = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, errorResponse{Error: msg})
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req signupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	switch {
	case req.FirstName == "":
		writeError(w, http.StatusUnprocessableEntity, "First name is required")
		return
	case req.LastName == "":
		writeError(w, http.StatusUnprocessableEntity, "Last name is required")
		return
	case !emailRegex.MatchString(req.Email):
		writeError(w, http.StatusUnprocessableEntity, "Enter a valid email")
		return
	case len(req.Password) < 6:
		writeError(w, http.StatusUnprocessableEntity, "Password must be at least 6 characters")
		return
	}

	// Check duplicate email
	var exists bool
	err := h.DB.QueryRowContext(r.Context(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", req.Email,
	).Scan(&exists)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}
	if exists {
		writeError(w, http.StatusConflict, "An account with that email already exists")
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to secure password")
		return
	}

	// Insert user — role defaults to 'user' via DB default
	result, err := h.DB.ExecContext(r.Context(),
		"INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)",
		req.FirstName, req.LastName, req.Email, string(hash),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create account")
		return
	}

	id, _ := result.LastInsertId()

	user := models.User{
		ID:        int(id),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Role:      "user",
	}

	// Generate JWT
	token, err := jwt.Generate(user.ID, user.Email, user.FirstName, user.LastName,
		user.Role, h.JWTSecret, h.JWTExpiryHours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	writeJSON(w, http.StatusCreated, authResponse{Token: token, User: user})
}

// ── POST /api/auth/signin ─────────────────────────────────────────────────────

func (h *AuthHandler) Signin(w http.ResponseWriter, r *http.Request) {
	var req signinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if !emailRegex.MatchString(req.Email) {
		writeError(w, http.StatusUnprocessableEntity, "Enter a valid email")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, http.StatusUnprocessableEntity, "Password must be at least 6 characters")
		return
	}

	// Fetch user — include role
	var user models.User
	err := h.DB.QueryRowContext(r.Context(),
		"SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?",
		req.Email,
	).Scan(&user.ID, &user.FirstName, &user.LastName, &user.Email, &user.PasswordHash, &user.Role)

	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Database error")
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	// Generate JWT — role is now embedded in the token
	token, err := jwt.Generate(user.ID, user.Email, user.FirstName, user.LastName,
		user.Role, h.JWTSecret, h.JWTExpiryHours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{Token: token, User: user})
}
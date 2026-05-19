package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"safer-backend/internal/jwt"
	"safer-backend/internal/models"

	"github.com/go-chi/chi/v5"
)

// ── AdminHandler ──────────────────────────────────────────────────────────────

type AdminHandler struct {
	DB        *sql.DB
	JWTSecret string
}

// ── middleware ────────────────────────────────────────────────────────────────

// RequireAdmin is a chi-compatible middleware that rejects any request whose
// JWT does not carry role = "admin".
func (h *AdminHandler) RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := jwt.Verify(tokenStr, h.JWTSecret)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		if claims.Role != "admin" {
			writeError(w, http.StatusForbidden, "Forbidden")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.QueryContext(r.Context(),
		`SELECT id, first_name, last_name, email, role, created_at
		 FROM users
		 WHERE role = 'user'
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(
			&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.Role, &u.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to read users")
			return
		}
		users = append(users, u)
	}

	writeJSON(w, http.StatusOK, users)
}

// ── DELETE /api/admin/users/{id} ─────────────────────────────────────────────

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Prevent deleting the last admin
	var adminCount int
	h.DB.QueryRowContext(r.Context(),
		"SELECT COUNT(*) FROM users WHERE role = 'admin'",
	).Scan(&adminCount)

	var targetRole string
	h.DB.QueryRowContext(r.Context(),
		"SELECT role FROM users WHERE id = ?", userID,
	).Scan(&targetRole)

	if targetRole == "admin" && adminCount <= 1 {
		writeError(w, http.StatusConflict, "Cannot delete the last admin account")
		return
	}

	result, err := h.DB.ExecContext(r.Context(),
		"DELETE FROM users WHERE id = ?", userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "User deleted"})
}
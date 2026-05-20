package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"safer-backend/internal/jwt"
	"safer-backend/internal/models"

	"github.com/go-chi/chi/v5"
)

// ── VaultHandler ──────────────────────────────────────────────────────────────

type VaultHandler struct {
	DB        *sql.DB
	JWTSecret string
}

// ── helpers ───────────────────────────────────────────────────────────────────

// getUserID extracts and verifies the JWT from the Authorization header,
// returning the user ID on success.
func (h *VaultHandler) getUserID(r *http.Request) (int, error) {
	authHeader := r.Header.Get("Authorization")
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := jwt.Verify(tokenStr, h.JWTSecret)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

// categoryNameToID looks up a category by name and returns its ID.
func (h *VaultHandler) categoryNameToID(ctx interface{ Value(any) any }, name string) (int, error) {
	return 0, nil // placeholder — resolved inline in Create
}

// ── POST /api/vault ───────────────────────────────────────────────────────────

type createVaultRequest struct {
	SiteName      string `json:"site_name"`
	SiteURL       string `json:"site_url"`
	Username      string `json:"username"`
	Password      string `json:"password"`
	Category      string `json:"category"`
	StrengthScore int    `json:"strength_score"`
	Notes         string `json:"notes"`
}

func (h *VaultHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req createVaultRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	req.SiteName = strings.TrimSpace(req.SiteName)
	req.Username = strings.TrimSpace(req.Username)

	if req.SiteName == "" {
		writeError(w, http.StatusUnprocessableEntity, "Site name is required")
		return
	}
	if req.Username == "" {
		writeError(w, http.StatusUnprocessableEntity, "Username is required")
		return
	}
	if req.Password == "" {
		writeError(w, http.StatusUnprocessableEntity, "Password is required")
		return
	}

	// Resolve category ID (default to "Other" if not found)
	var categoryID int
	err = h.DB.QueryRowContext(r.Context(),
		"SELECT id FROM categories WHERE name = ?", req.Category,
	).Scan(&categoryID)
	if err != nil {
		// fallback to "Other"
		h.DB.QueryRowContext(r.Context(),
			"SELECT id FROM categories WHERE name = 'Other'",
		).Scan(&categoryID)
	}

	result, err := h.DB.ExecContext(r.Context(),
		`INSERT INTO vault_entries
			(user_id, category_id, site_name, site_url, username, encrypted_password, strength_score, notes)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, categoryID, req.SiteName, req.SiteURL, req.Username,
		req.Password, req.StrengthScore, req.Notes,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save entry")
		return
	}

	id, _ := result.LastInsertId()

	entry := models.VaultEntry{
		ID:                int(id),
		UserID:            userID,
		CategoryID:        categoryID,
		Category:          req.Category,
		SiteName:          req.SiteName,
		SiteURL:           req.SiteURL,
		Username:          req.Username,
		EncryptedPassword: req.Password,
		StrengthScore:     req.StrengthScore,
		Notes:             req.Notes,
	}

	writeJSON(w, http.StatusCreated, entry)
}

// ── GET /api/vault ────────────────────────────────────────────────────────────

func (h *VaultHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := h.DB.QueryContext(r.Context(),
		`SELECT ve.id, ve.user_id, ve.category_id, c.name,
			ve.site_name, COALESCE(ve.site_url, ''),
			ve.username, ve.encrypted_password,
			ve.strength_score, ve.is_favorited,
			COALESCE(ve.notes, ''), ve.created_at, ve.updated_at
		FROM vault_entries ve
		JOIN categories c ON c.id = ve.category_id
		WHERE ve.user_id = ? AND ve.deleted_at IS NULL
		ORDER BY ve.created_at DESC`,
		userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch entries")
		return
	}
	defer rows.Close()

	entries := []models.VaultEntry{}
	for rows.Next() {
		var e models.VaultEntry
		var favInt int
		if err := rows.Scan(
			&e.ID, &e.UserID, &e.CategoryID, &e.Category,
			&e.SiteName, &e.SiteURL, &e.Username, &e.EncryptedPassword,
			&e.StrengthScore, &favInt, &e.Notes, &e.CreatedAt, &e.UpdatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to read entries")
			return
		}
		e.IsFavorited = favInt == 1
		entries = append(entries, e)
	}

	writeJSON(w, http.StatusOK, entries)
}

// ── DELETE /api/vault/{id} ────────────────────────────────────────────────────

func (h *VaultHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	entryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid entry ID")
		return
	}

	result, err := h.DB.ExecContext(r.Context(),
		"UPDATE vault_entries SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
		entryID, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete entry")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Entry not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Entry deleted"})
}

// ── PATCH /api/vault/{id}/restore ────────────────────────────────────────────

func (h *VaultHandler) Restore(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	entryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid entry ID")
		return
	}

	result, err := h.DB.ExecContext(r.Context(),
		"UPDATE vault_entries SET deleted_at = NULL WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL",
		entryID, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to restore entry")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Entry not found or not deleted")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Entry restored"})
}

// ── DELETE /api/vault/{id}/purge ─────────────────────────────────────────────

func (h *VaultHandler) Purge(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	entryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid entry ID")
		return
	}

	result, err := h.DB.ExecContext(r.Context(),
		"DELETE FROM vault_entries WHERE id = ? AND user_id = ?",
		entryID, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to purge entry")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Entry not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Entry permanently deleted"})
}


// ── GET /api/vault/trash ──────────────────────────────────────────────────────

func (h *VaultHandler) ListTrashed(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	rows, err := h.DB.QueryContext(r.Context(),
		`SELECT ve.id, ve.user_id, ve.category_id, c.name,
			ve.site_name, COALESCE(ve.site_url, ''),
			ve.username, ve.encrypted_password,
			ve.strength_score, ve.is_favorited,
			COALESCE(ve.notes, ''), ve.created_at, ve.updated_at
		FROM vault_entries ve
		JOIN categories c ON c.id = ve.category_id
		WHERE ve.user_id = ? AND ve.deleted_at IS NOT NULL
		ORDER BY ve.deleted_at DESC`,
		userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch trashed entries")
		return
	}
	defer rows.Close()

	entries := []models.VaultEntry{}
	for rows.Next() {
		var e models.VaultEntry
		var favInt int
		if err := rows.Scan(
			&e.ID, &e.UserID, &e.CategoryID, &e.Category,
			&e.SiteName, &e.SiteURL, &e.Username, &e.EncryptedPassword,
			&e.StrengthScore, &favInt, &e.Notes, &e.CreatedAt, &e.UpdatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to read entries")
			return
		}
		e.IsFavorited = favInt == 1
		entries = append(entries, e)
	}

	writeJSON(w, http.StatusOK, entries)
}

// ── PATCH /api/vault/{id}/password ───────────────────────────────────────────

type updatePasswordRequest struct {
	Password      string `json:"password"`
	StrengthScore int    `json:"strength_score"`
}

func (h *VaultHandler) UpdatePassword(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	entryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid entry ID")
		return
	}

	var req updatePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(req.Password) == "" {
		writeError(w, http.StatusUnprocessableEntity, "Password is required")
		return
	}

	result, err := h.DB.ExecContext(r.Context(),
		`UPDATE vault_entries
		 SET encrypted_password = ?, strength_score = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ? AND user_id = ?`,
		req.Password, req.StrengthScore, entryID, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update password")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Entry not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Password updated"})
}

// ── PATCH /api/vault/{id}/favorite ───────────────────────────────────────────

func (h *VaultHandler) ToggleFavorite(w http.ResponseWriter, r *http.Request) {
	userID, err := h.getUserID(r)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	entryID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid entry ID")
		return
	}

	// Toggle: flip the current value
	result, err := h.DB.ExecContext(r.Context(),
		"UPDATE vault_entries SET is_favorited = NOT is_favorited WHERE id = ? AND user_id = ?",
		entryID, userID,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update favorite")
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		writeError(w, http.StatusNotFound, "Entry not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Favorite toggled"})
}
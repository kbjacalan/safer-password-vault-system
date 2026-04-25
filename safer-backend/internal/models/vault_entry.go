package models

import "time"

type VaultEntry struct {
	ID                int       `json:"id"`
	UserID            int       `json:"user_id"`
	CategoryID        int       `json:"category_id"`
	Category          string    `json:"category"`
	SiteName          string    `json:"site_name"`
	SiteURL           string    `json:"site_url"`
	Username          string    `json:"username"`
	EncryptedPassword string    `json:"encrypted_password"`
	StrengthScore     int       `json:"strength_score"`
	IsFavorited       bool      `json:"is_favorited"`
	Notes             string    `json:"notes"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

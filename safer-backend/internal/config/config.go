package config

import "fmt"

type Config struct {
	Port           string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	JWTSecret      string
	JWTExpiryHours int
}

func Load() (*Config, error) {
	return &Config{
		Port:           "8080",
		DBHost:         "127.0.0.1",
		DBPort:         "3306",
		DBUser:         "root",
		DBPassword:     "",
		DBName:         "safer_db",
		JWTSecret:      "safer_super_secret_2026",
		JWTExpiryHours: 168,
	}, nil
}

func (c *Config) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}
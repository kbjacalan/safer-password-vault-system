package db

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

func Connect(dsn string) (*sql.DB, error) {
	database, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open: %w", err)
	}

	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("db.Ping: %w", err)
	}

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(10)

	return database, nil
}

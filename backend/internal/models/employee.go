package models

import "time"

type Employee struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"uniqueIndex;size:50;not null" json:"code"`
	FirstName string    `gorm:"size:100;not null" json:"firstName"`
	LastName  string    `gorm:"size:100;not null" json:"lastName"`
	Email     string    `gorm:"size:150" json:"email"`
	Position  string    `gorm:"size:100" json:"position"`

	// ใช้ pointer เพื่อหลีกเลี่ยง recursive type
	Employment *Employment `json:"employment"` // has-one

	Salary    float64   `json:"salary"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

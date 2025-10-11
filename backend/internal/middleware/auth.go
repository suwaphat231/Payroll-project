package middleware

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("dev_secret")

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

// Claims ที่ฝัง RegisteredClaims ของ jwt/v5
type Claims struct {
	UID   uint   `json:"uid"`
	Role  string `json:"role"`
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// สร้าง token ด้วย HS256
func GenerateToken(uid uint, role, email string, ttl time.Duration) (string, error) {
	if ttl <= 0 {
		return "", errors.New("ttl must be positive")
	}

	now := time.Now().UTC()
	claims := &Claims{
		UID:   uid,
		Role:  role,
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			// ออปชัน: ใส่ Subject เพื่ออ้างอิง UID เป็น string ก็ได้
			Subject: strconv.FormatUint(uint64(uid), 10),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}
	return signed, nil
}

// Middleware ตรวจสอบ Authorization: Bearer <token>
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.GetHeader("Authorization")
		if h == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "bad token format"})
			return
		}

		claims, err := parseToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		// jwt/v5 เช็ค exp ให้แล้ว แต่เผื่อกรณีเปิด validation แบบหลวม ๆ
		if claims.ExpiresAt != nil && time.Now().After(claims.ExpiresAt.Time) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
			return
		}

		// inject ข้อมูลลง context เผื่อ handler อื่น ๆ ใช้ต่อ
		c.Set("uid", claims.UID)
		c.Set("role", claims.Role)
		c.Set("email", claims.Email)

		c.Next()
	}
}

// แยกฟังก์ชัน parse เพื่อเทสง่าย
func parseToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(t *jwt.Token) (interface{}, error) {
			// รับเฉพาะ HS256
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unsupported signing method")
			}
			return jwtSecret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	)
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

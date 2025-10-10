package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var jwtSecret = []byte("dev_secret")

func SetJWTSecret(secret string) {
	jwtSecret = []byte(secret)
}

type Claims struct {
	UID      uint      `json:"uid"`
	Role     string    `json:"role"`
	Email    string    `json:"email"`
	Expires  time.Time `json:"expiresAt"`
	IssuedAt time.Time `json:"issuedAt"`
}

type wireClaims struct {
	UID   uint   `json:"uid"`
	Role  string `json:"role"`
	Email string `json:"email"`
	Exp   int64  `json:"exp"`
	Iat   int64  `json:"iat"`
}

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

func GenerateToken(uid uint, role, email string, ttl time.Duration) (string, error) {
	if ttl <= 0 {
		return "", errors.New("ttl must be positive")
	}

	now := time.Now().UTC()
	header := jwtHeader{Alg: "HS256", Typ: "JWT"}
	payload := wireClaims{
		UID:   uid,
		Role:  role,
		Email: email,
		Exp:   now.Add(ttl).Unix(),
		Iat:   now.Unix(),
	}

	hJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	pJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	part1 := base64.RawURLEncoding.EncodeToString(hJSON)
	part2 := base64.RawURLEncoding.EncodeToString(pJSON)
	signingInput := part1 + "." + part2
	sig := sign(signingInput)
	token := signingInput + "." + base64.RawURLEncoding.EncodeToString(sig)
	return token, nil
}

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

		if time.Now().UTC().After(claims.Expires) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token expired"})
			return
		}

		c.Next()
	}
}

func parseToken(token string) (*Claims, error) {
	segments := strings.Split(token, ".")
	if len(segments) != 3 {
		return nil, errors.New("token format")
	}

	signingInput := segments[0] + "." + segments[1]
	sigBytes, err := base64.RawURLEncoding.DecodeString(segments[2])
	if err != nil {
		return nil, err
	}

	expected := sign(signingInput)
	if !hmac.Equal(sigBytes, expected) {
		return nil, errors.New("signature mismatch")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(segments[0])
	if err != nil {
		return nil, err
	}
	var hdr jwtHeader
	if err := json.Unmarshal(headerBytes, &hdr); err != nil {
		return nil, err
	}
	if hdr.Alg != "HS256" {
		return nil, errors.New("unsupported alg")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(segments[1])
	if err != nil {
		return nil, err
	}
	var wc wireClaims
	if err := json.Unmarshal(payloadBytes, &wc); err != nil {
		return nil, err
	}

	claims := &Claims{
		UID:      wc.UID,
		Role:     wc.Role,
		Email:    wc.Email,
		IssuedAt: time.Unix(wc.Iat, 0).UTC(),
		Expires:  time.Unix(wc.Exp, 0).UTC(),
	}
	return claims, nil
}

func sign(data string) []byte {
	mac := hmac.New(sha256.New, jwtSecret)
	mac.Write([]byte(data))
	return mac.Sum(nil)
}

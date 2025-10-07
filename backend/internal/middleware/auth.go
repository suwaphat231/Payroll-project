package middleware

import ( "net/http" "strings" "time"

"github.com/gin-gonic/gin"
"github.com/golang-jwt/jwt/v5"

Copy

)

var jwtSecret = []byte("dev_secret")

func SetJWTSecret(secret string) { jwtSecret = []byte(secret) }

type Claims struct { UID uint json:"uid" Role string json:"role" Email string json:"email" jwt.RegisteredClaims }

func GenerateToken(uid uint, role, email string, ttl time.Duration) (string, error) { claims := Claims{ UID: uid, Role: role, Email: email, RegisteredClaims: jwt.RegisteredClaims{ ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)), IssuedAt: jwt.NewNumericDate(time.Now()), }, } token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims) return token.SignedString(jwtSecret) }

func AuthRequired() gin.HandlerFunc { return func(c *gin.Context) { h := c.GetHeader("Authorization") if h == "" { c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"}) return } parts := strings.SplitN(h, " ", 2) if len(parts) != 2 || parts[0] != "Bearer" { c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "bad token format"}) return } tok, err := jwt.ParseWithClaims(parts[1], &Claims{}, func(t *jwt.Token) (interface{}, error) { return jwtSecret, nil }) if err != nil || !tok.Valid { c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"}) return } c.Next() } }
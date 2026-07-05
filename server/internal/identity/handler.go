package identity

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"bolo-server/internal/platform/auth"
	"bolo-server/internal/platform/httpx"
)

const dateLayout = "2006-01-02"

type Handler struct {
	svc *Service
	log zerolog.Logger
}

func NewHandler(svc *Service, log zerolog.Logger) *Handler {
	return &Handler{svc: svc, log: log}
}

// --- auth endpoints (BACKEND_PLAN.md §6, steps 1–2) ---

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"`
	Region   string `json:"region" binding:"required,alpha,len=2"`
}

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	parent, pair, err := h.svc.Register(c.Request.Context(), req.Email, req.Password, req.Region)
	if err != nil {
		if errors.Is(err, ErrEmailTaken) {
			httpx.Error(c, http.StatusConflict, "email_taken", "an account with this email already exists")
			return
		}
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"parent_id":     parent.ID,
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
	})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	pair, err := h.svc.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			httpx.Error(c, http.StatusUnauthorized, "invalid_credentials", "email or password is incorrect")
			return
		}
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *Handler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	pair, err := h.svc.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if errors.Is(err, ErrInvalidRefreshToken) {
			httpx.Error(c, http.StatusUnauthorized, "invalid_refresh_token", "refresh token is invalid, expired, or already used")
			return
		}
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
	})
}

// --- child endpoints (BACKEND_PLAN.md §6, steps 3–4) ---

type addChildRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=60"`
	DateOfBirth string `json:"date_of_birth" binding:"required,datetime=2006-01-02"`
}

func (h *Handler) AddChild(c *gin.Context) {
	var req addChildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	dob, _ := time.Parse(dateLayout, req.DateOfBirth) // format already validated
	child, err := h.svc.AddChild(c.Request.Context(), auth.ParentID(c), req.Name, dob)
	if err != nil {
		if errors.Is(err, ErrInvalidDateOfBirth) {
			httpx.Error(c, http.StatusBadRequest, "invalid_date_of_birth", ErrInvalidDateOfBirth.Error())
			return
		}
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"child_id":           child.ID,
		"suggested_category": child.CategoryCode,
		"next_step":          "confirm_category",
	})
}

func (h *Handler) ListChildren(c *gin.Context) {
	children, err := h.svc.ListChildren(c.Request.Context(), auth.ParentID(c))
	if err != nil {
		h.fail(c, err)
		return
	}
	out := make([]gin.H, 0, len(children))
	for _, child := range children {
		out = append(out, gin.H{
			"child_id":           child.ID,
			"name":               child.Name,
			"date_of_birth":      child.DateOfBirth.Format(dateLayout),
			"category_code":      child.CategoryCode,
			"category_confirmed": child.CategoryConfirmedAt != nil,
		})
	}
	c.JSON(http.StatusOK, gin.H{"children": out})
}

type confirmCategoryRequest struct {
	CategoryCode string `json:"category_code" binding:"required"`
}

func (h *Handler) ConfirmCategory(c *gin.Context) {
	var req confirmCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.ValidationError(c, err)
		return
	}
	child := childFromContext(c)
	if err := h.svc.ConfirmCategory(c.Request.Context(), child.ID, req.CategoryCode); err != nil {
		if errors.Is(err, ErrUnknownCategory) {
			httpx.Error(c, http.StatusBadRequest, "unknown_category", "category_code is not a valid category")
			return
		}
		h.fail(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"category_code": req.CategoryCode, "confirmed": true})
}

// --- ownership middleware ---

const childKey = "identity.child"

// childOwnership resolves :child_id and proves it belongs to the
// authenticated parent. Children of other parents return 404, not 403 —
// the API never confirms that someone else's child id exists.
func (h *Handler) childOwnership() gin.HandlerFunc {
	return func(c *gin.Context) {
		childID, err := uuid.Parse(c.Param("child_id"))
		if err != nil {
			httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
			c.Abort()
			return
		}
		child, err := h.svc.ChildForParent(c.Request.Context(), auth.ParentID(c), childID)
		if err != nil {
			if errors.Is(err, ErrNotFound) {
				httpx.Error(c, http.StatusNotFound, "not_found", "child not found")
			} else {
				h.log.Error().Err(err).Msg("child ownership check failed")
				httpx.Internal(c)
			}
			c.Abort()
			return
		}
		c.Set(childKey, child)
		c.Next()
	}
}

func childFromContext(c *gin.Context) *ChildProfile {
	v, _ := c.Get(childKey)
	child, _ := v.(*ChildProfile)
	return child
}

func (h *Handler) fail(c *gin.Context, err error) {
	h.log.Error().Err(err).Str("path", c.Request.URL.Path).Msg("handler error")
	httpx.Internal(c)
}

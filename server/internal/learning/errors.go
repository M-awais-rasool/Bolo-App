package learning

import "errors"

var (
	ErrNotFound        = errors.New("not found")
	ErrChildNotFound   = errors.New("child not found")
	ErrSessionNotFound = errors.New("session not found")
	ErrLessonNotFound  = errors.New("lesson not found")
	ErrWordNotInLesson = errors.New("word is not part of this lesson")
	ErrAudioRequired   = errors.New("audio recording is required")
)

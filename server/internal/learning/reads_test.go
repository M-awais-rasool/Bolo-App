package learning

import (
	"testing"
	"time"
)

func d(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return t
}

func TestStreakDays(t *testing.T) {
	now := d("2026-07-05")
	cases := []struct {
		name  string
		dates []time.Time
		want  int
	}{
		{"no practice", nil, 0},
		{"today only", []time.Time{d("2026-07-05")}, 1},
		{"three days ending today", []time.Time{d("2026-07-05"), d("2026-07-04"), d("2026-07-03")}, 3},
		{"streak alive from yesterday", []time.Time{d("2026-07-04"), d("2026-07-03")}, 2},
		{"broken two days ago", []time.Time{d("2026-07-03"), d("2026-07-02")}, 0},
		{"gap stops the count", []time.Time{d("2026-07-05"), d("2026-07-03")}, 1},
	}
	for _, tc := range cases {
		if got := streakDays(tc.dates, now); got != tc.want {
			t.Errorf("%s: streakDays = %d, want %d", tc.name, got, tc.want)
		}
	}
}

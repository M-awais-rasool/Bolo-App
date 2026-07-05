package identity

import (
	"testing"
	"time"
)

var testCats = []Category{
	{Code: "KG", MinAgeMonths: 48, MaxAgeMonths: 71, SortOrder: 1},
	{Code: "G1", MinAgeMonths: 72, MaxAgeMonths: 83, SortOrder: 2},
	{Code: "G2", MinAgeMonths: 84, MaxAgeMonths: 95, SortOrder: 3},
	{Code: "G3", MinAgeMonths: 96, MaxAgeMonths: 107, SortOrder: 4},
	{Code: "G4", MinAgeMonths: 108, MaxAgeMonths: 119, SortOrder: 5},
}

func TestSuggestCategory(t *testing.T) {
	cases := []struct {
		months int
		want   string
	}{
		{30, "KG"}, // below every window → clamp young
		{48, "KG"}, // lower bound
		{71, "KG"}, // upper bound
		{72, "G1"}, // boundary crossing
		{83, "G1"},
		{84, "G2"},
		{95, "G2"},
		{96, "G3"},
		{107, "G3"},
		{108, "G4"},
		{119, "G4"},
		{160, "G4"}, // above every window → clamp old
	}
	for _, tc := range cases {
		if got := suggestCategory(testCats, tc.months); got != tc.want {
			t.Errorf("suggestCategory(%d) = %q, want %q", tc.months, got, tc.want)
		}
	}
}

func TestAgeInMonths(t *testing.T) {
	now := time.Date(2026, 7, 5, 12, 0, 0, 0, time.UTC)
	cases := []struct {
		dob  string
		want int
	}{
		{"2020-03-14", 75}, // day-of-month not yet reached this month
		{"2020-07-05", 72}, // birthday today counts the full month
		{"2020-07-06", 71}, // one day short
		{"2026-07-01", 0},  // newborn
	}
	for _, tc := range cases {
		dob, err := time.Parse("2006-01-02", tc.dob)
		if err != nil {
			t.Fatalf("parse %q: %v", tc.dob, err)
		}
		if got := ageInMonths(dob, now); got != tc.want {
			t.Errorf("ageInMonths(%s) = %d, want %d", tc.dob, got, tc.want)
		}
	}
}

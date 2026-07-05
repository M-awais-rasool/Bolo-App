package identity

import "time"

// ageInMonths is whole months completed between dob and now.
func ageInMonths(dob, now time.Time) int {
	months := (now.Year()-dob.Year())*12 + int(now.Month()) - int(dob.Month())
	if now.Day() < dob.Day() {
		months--
	}
	if months < 0 {
		return 0
	}
	return months
}

// suggestCategory picks the category whose age window contains the child's
// age, clamping to the youngest/oldest category outside the windows
// (BACKEND_PLAN.md §3). cats must be sorted by SortOrder — the category is a
// starting point the parent can override, not a cage.
func suggestCategory(cats []Category, months int) string {
	if len(cats) == 0 {
		return ""
	}
	for _, c := range cats {
		if months >= c.MinAgeMonths && months <= c.MaxAgeMonths {
			return c.Code
		}
	}
	if months < cats[0].MinAgeMonths {
		return cats[0].Code
	}
	return cats[len(cats)-1].Code
}

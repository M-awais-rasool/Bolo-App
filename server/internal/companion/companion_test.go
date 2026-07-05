package companion

import "testing"

func TestStageFor(t *testing.T) {
	cases := []struct {
		words int
		want  string
	}{
		{0, "egg"},
		{9, "egg"},
		{10, "hatchling"},
		{49, "hatchling"},
		{50, "young"},
		{119, "young"},
		{120, "brave"},
		{219, "brave"},
		{220, "wise"},
		{349, "wise"},
		{350, "star"},
		{1000, "star"},
	}
	for _, tc := range cases {
		if got := StageFor(tc.words); got != tc.want {
			t.Errorf("StageFor(%d) = %q, want %q", tc.words, got, tc.want)
		}
	}
}

func TestStageIndexOrdering(t *testing.T) {
	if !(stageIndex("egg") < stageIndex("hatchling") && stageIndex("hatchling") < stageIndex("star")) {
		t.Error("stage indices must be ordered by growth")
	}
}

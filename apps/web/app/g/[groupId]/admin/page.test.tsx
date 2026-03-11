import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AdminPage from "@/app/g/[groupId]/admin/page";

const useMutationMock = vi.fn();
const useQueryClientMock = vi.fn();
const useGroupMock = vi.fn();
const useSeasonMatchdaysMock = vi.fn();
const useMatchdayMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ groupId: "1" })
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => useMutationMock(),
  useQueryClient: () => useQueryClientMock()
}));

vi.mock("@/lib/group-hooks", () => ({
  useGroup: (...args: unknown[]) => useGroupMock(...args),
  useSeasonMatchdays: (...args: unknown[]) => useSeasonMatchdaysMock(...args),
  useMatchday: (...args: unknown[]) => useMatchdayMock(...args)
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => useAuthMock()
}));

describe("AdminPage", () => {
  function mockMutationSequence(states: Array<Record<string, unknown>>) {
    let index = 0;
    useMutationMock.mockImplementation(() => states[index++] ?? states[states.length - 1]);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useAuthMock.mockReturnValue({
      token: "token",
      user: { id: 1, name: "Owner", email: "owner@example.com" }
    });
    useGroupMock.mockReturnValue({
      data: {
        id: 1,
        name: "Pelada",
        created_by_user_id: 1,
        active_season_id: 10,
        memberships: [{ id: 1, user_id: 1, group_id: 1, role: "OWNER" }]
      },
      isLoading: false,
      error: null
    });
    useSeasonMatchdaysMock.mockReturnValue({
      data: [{ id: 20, season_id: 10, title: "Rodada 1", scheduled_for: "2026-03-11", is_locked: true }],
      isLoading: false,
      error: null
    });
    useMatchdayMock.mockReturnValue({
      data: {
        id: 20,
        season_id: 10,
        title: "Rodada 1",
        scheduled_for: "2026-03-11",
        notes: null,
        is_locked: true,
        locked_at: "2026-03-11T12:00:00Z",
        attendance: [
          { matchday_id: 20, player_id: 1, status: "CONFIRMED" },
          { matchday_id: 20, player_id: 2, status: "CONFIRMED" }
        ],
        teams: [
          {
            team_id: 1,
            name: "Time A",
            total_rating: 12,
            players: [{ player_id: 1, player_name: "Ana", position: "MID", skill_rating: 6 }]
          },
          {
            team_id: 2,
            name: "Time B",
            total_rating: 11,
            players: [{ player_id: 2, player_name: "Bia", position: "MID", skill_rating: 5 }]
          }
        ],
        matches: [{ id: 30, home_team_id: 1, away_team_id: 2, home_score: 2, away_score: 1, finished_at: null }]
      },
      isLoading: false,
      error: null
    });
  });

  it("renderiza secoes principais do painel admin", () => {
    const createSeasonMutate = vi.fn();
    const createMatchdayMutate = vi.fn();
    const lockMatchdayMutate = vi.fn();
    const submitResultMutate = vi.fn();
    const inviteMutate = vi.fn();

    mockMutationSequence([
      { mutate: createSeasonMutate, isPending: false, error: null },
      { mutate: createMatchdayMutate, isPending: false, error: null },
      { mutate: lockMatchdayMutate, isPending: false, error: null },
      { mutate: submitResultMutate, isPending: false, error: null },
      { mutate: inviteMutate, isPending: false, error: null, data: undefined }
    ]);

    render(<AdminPage />);

    expect(screen.getByText("Convite do Grupo")).toBeInTheDocument();
    expect(screen.getByText("Temporada")).toBeInTheDocument();
    expect(screen.getByText("Rodada")).toBeInTheDocument();
    expect(screen.getByText(/placar/i)).toBeInTheDocument();
    expect(screen.getAllByText("Time A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Time B").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("2").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("1").length).toBeGreaterThan(0);
  });

  it("aciona a mutation de convite ao clicar no botao", async () => {
    const inviteMutate = vi.fn();

    mockMutationSequence([
      { mutate: vi.fn(), isPending: false, error: null },
      { mutate: vi.fn(), isPending: false, error: null },
      { mutate: vi.fn(), isPending: false, error: null },
      { mutate: vi.fn(), isPending: false, error: null },
      { mutate: inviteMutate, isPending: false, error: null, data: undefined }
    ]);

    render(<AdminPage />);

    await userEvent.click(screen.getByRole("button", { name: /gerar convite/i }));

    expect(inviteMutate).toHaveBeenCalledTimes(1);
  });
});

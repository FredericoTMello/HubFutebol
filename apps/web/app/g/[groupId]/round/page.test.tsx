import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RoundPage from "@/app/g/[groupId]/round/page";

const useMutationMock = vi.fn();
const useQueryClientMock = vi.fn();
const useGroupMock = vi.fn();
const useGroupPlayersMock = vi.fn();
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
  useGroupPlayers: (...args: unknown[]) => useGroupPlayersMock(...args),
  useSeasonMatchdays: (...args: unknown[]) => useSeasonMatchdaysMock(...args),
  useMatchday: (...args: unknown[]) => useMatchdayMock(...args)
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => useAuthMock()
}));

describe("RoundPage", () => {
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
    useGroupPlayersMock.mockReturnValue({
      data: [
        { id: 1, group_id: 1, user_id: 1, name: "Ana", nickname: "Aninha", position: "MID", skill_rating: 6, is_active: true },
        { id: 2, group_id: 1, user_id: null, name: "Bia", nickname: null, position: "DEF", skill_rating: 5, is_active: true }
      ],
      isLoading: false,
      error: null
    });
    useSeasonMatchdaysMock.mockReturnValue({
      data: [{ id: 20, season_id: 10, title: "Rodada 1", scheduled_for: "2026-03-11", is_locked: false }],
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
        is_locked: false,
        locked_at: null,
        attendance: [{ matchday_id: 20, player_id: 1, status: "CONFIRMED" }],
        teams: [],
        matches: []
      },
      isLoading: false,
      error: null
    });
  });

  it("renderiza lista de presencas e status atual", () => {
    useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null });

    render(<RoundPage />);

    expect(screen.getByText("Rodada 1")).toBeInTheDocument();
    expect(screen.getByText(/lista de presen/i)).toBeInTheDocument();
    expect(screen.getByText("Aninha")).toBeInTheDocument();
    expect(screen.getAllByText("Bia").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Confirmado").length).toBeGreaterThan(0);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("envia a presenca ao submeter o formulario", async () => {
    const mutate = vi.fn();
    useMutationMock.mockReturnValue({ mutate, isPending: false, error: null });

    render(<RoundPage />);

    await userEvent.click(screen.getByRole("button", { name: /confirmar presen/i }));

    expect(mutate).toHaveBeenCalledWith({ player_id: 1, status: "CONFIRMED" });
  });
});

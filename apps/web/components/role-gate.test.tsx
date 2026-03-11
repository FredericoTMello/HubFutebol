import React from "react";
import { render, screen } from "@testing-library/react";

import { RoleGate } from "@/components/role-gate";
import type { Group } from "@/lib/types";

const group: Group = {
  id: 1,
  name: "Pelada",
  created_by_user_id: 1,
  active_season_id: 10,
  memberships: [
    { id: 1, user_id: 1, group_id: 1, role: "OWNER" },
    { id: 2, user_id: 2, group_id: 1, role: "MEMBER" }
  ]
};

describe("RoleGate", () => {
  it("mostra children para admin", () => {
    render(
      <RoleGate group={group} userId={1} requireAdmin>
        <div>Painel liberado</div>
      </RoleGate>
    );

    expect(screen.getByText("Painel liberado")).toBeInTheDocument();
  });

  it("bloqueia member quando requireAdmin for true", () => {
    render(
      <RoleGate group={group} userId={2} requireAdmin>
        <div>Painel liberado</div>
      </RoleGate>
    );

    expect(screen.queryByText("Painel liberado")).not.toBeInTheDocument();
    expect(screen.getByText(/admin\/owner/i)).toBeInTheDocument();
  });
});

export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type AppearanceStatus = "CONFIRMED" | "DECLINED" | "NO_SHOW";

export type User = {
  id: number;
  name: string;
  email: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type Membership = {
  id: number;
  user_id: number;
  group_id: number;
  role: Role;
};

export type Group = {
  id: number;
  name: string;
  join_code?: string | null;
  created_by_user_id: number;
  memberships: Membership[];
  active_season_id?: number | null;
};

export type Player = {
  id: number;
  group_id: number;
  user_id?: number | null;
  name: string;
  nickname?: string | null;
  position?: string | null;
  skill_rating: number;
  is_active: boolean;
};

export type MatchDayListItem = {
  id: number;
  season_id: number;
  title: string;
  scheduled_for: string;
  is_locked: boolean;
};

export type MatchDay = {
  id: number;
  season_id: number;
  title: string;
  scheduled_for: string;
  notes?: string | null;
  is_locked: boolean;
  locked_at?: string | null;
  attendance: Array<{ matchday_id: number; player_id: number; status: AppearanceStatus }>;
  teams: Array<{
    team_id: number;
    name: string;
    total_rating: number;
    players: Array<{
      player_id: number;
      player_name: string;
      position?: string | null;
      skill_rating: number;
    }>;
  }>;
  matches: Array<{
    id: number;
    home_team_id: number;
    away_team_id: number;
    home_score?: number | null;
    away_score?: number | null;
    finished_at?: string | null;
  }>;
};

export type StandingItem = {
  player_id: number;
  player_name: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  no_shows: number;
  games_played: number;
};

export type StandingsResponse = {
  season_id: number;
  items: StandingItem[];
};

export type PlayerStatItem = {
  player_id: number;
  player_name: string;
  appearances: number;
  goals: number;
  no_shows: number;
};

export type PlayerStatsResponse = {
  season_id: number;
  items: PlayerStatItem[];
};

export type LedgerResponse = {
  group_id: number;
  ledger_id: number;
  balance: string;
  entries: Array<{
    id: number;
    amount: string;
    kind: string;
    description?: string | null;
    created_at: string;
  }>;
};


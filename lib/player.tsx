"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ROSTER } from "./roster";

const STORAGE_KEY = "soccer-hotels-my-player";

interface PlayerState {
  player: string | null; // null = still loading from storage, "" = not picked
  select: (name: string) => void;
}

const PlayerContext = createContext<PlayerState>({
  player: null,
  select: () => {},
});

export function usePlayer(): string {
  return useContext(PlayerContext).player ?? "";
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<string | null>(null);

  useEffect(() => {
    setPlayer(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  const select = (name: string) => {
    localStorage.setItem(STORAGE_KEY, name);
    setPlayer(name);
  };

  return (
    <PlayerContext.Provider value={{ player, select }}>
      {children}
    </PlayerContext.Provider>
  );
}

// Blocks page content until a player has been picked and confirmed. The
// choice is stored on the device permanently — both parents pick the same
// player on their own phones to share the booking.
export function PlayerGate({ children }: { children: React.ReactNode }) {
  const { player, select } = useContext(PlayerContext);
  const [pending, setPending] = useState<string | null>(null);

  if (player === null) return <div className="loading">Loading…</div>;
  if (player) return <>{children}</>;

  return (
    <div className="picker card">
      {pending ? (
        <>
          <h2 className="picker-title">Confirm your player</h2>
          <p className="picker-sub">
            Set <strong>{pending}</strong> as your player on this device?
            Hotels you book will be for {pending.split(" ")[0]}, and this
            can&apos;t be changed later.
          </p>
          <div className="picker-actions">
            <button className="btn btn-primary" onClick={() => select(pending)}>
              Yes, that&apos;s my player
            </button>
            <button className="btn" onClick={() => setPending(null)}>
              Go back
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="picker-title">Welcome! Who&apos;s your player?</h2>
          <p className="picker-sub">
            Pick your child to track and book team hotels. Each parent picks
            the same player on their own phone.
          </p>
          <div className="picker-grid">
            {ROSTER.map((p) => (
              <button
                key={p.name}
                className="picker-player"
                onClick={() => setPending(p.name)}
              >
                <span className="num">#{p.number}</span> {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PlayerBadge() {
  const player = usePlayer();
  const p = ROSTER.find((r) => r.name === player);
  if (!player) return null;
  return (
    <span className="player-chip header-player">
      <span className="num">#{p?.number ?? "–"}</span>
      {player}
    </span>
  );
}

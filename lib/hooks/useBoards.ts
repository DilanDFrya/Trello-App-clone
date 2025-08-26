"use client";

import { useUser } from "@clerk/nextjs";
import { boardDataService } from "../services";
import { useState } from "react";
import { Board } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function createBoard(boardData: {
    titel: string;
    description?: string;
    color?: string;
  }) {
    if (!user) throw new Error("User not Authenticated");

    setLoading(true);
    try {
      const newBoard = await boardDataService.createBoardWithDefaultColumn(
        supabase!,
        {
          ...boardData,
          userId: user.id,
        }
      );
      setBoards((prev) => [newBoard, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create board.");
    } finally {
      setLoading(false);
    }
  }

  return {
    boards,
    loading,
    error,
    createBoard,
  };
}

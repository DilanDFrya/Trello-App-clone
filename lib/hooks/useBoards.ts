"use client";

import { useUser } from "@clerk/nextjs";
import { boardDataService, boardService, taskService } from "../services";
import { useCallback, useEffect, useState } from "react";
import { Board, ColumnWithTasks, Task } from "../supabase/models";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoards = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardService.getBoards(supabase!, user.id);
      setBoards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user, loadBoards]);

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

export function useBoard(boardId: string) {
  const { supabase } = useSupabase();
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await boardDataService.getBoardWithColumns(
        supabase!,
        boardId
      );
      setBoard(data.board);
      setColumns(data.columnsWithTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards.");
    } finally {
      setLoading(false);
    }
  }, [boardId, supabase]);

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId, loadBoard]);

  async function updateBoard(boardId: string, updates: Partial<Board>) {
    try {
      const updatedBoard = await boardService.updateBoard(
        supabase!,
        boardId,
        updates
      );
      setBoard(updatedBoard);
      return updatedBoard;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the board."
      );
    }
  }

  async function createRealTask(
    columnId: string,
    taskData: {
      titel: string;
      description?: string;
      assignee?: string;
      due_date?: string;
      pirority: "low" | "medium" | "high";
    }
  ) {
    try {
      const newTask = await taskService.createTask(supabase!, {
        titel: taskData.titel,
        description: taskData.description || null,
        assignee: taskData.assignee || null,
        due_date: taskData.due_date || null,
        pirority: taskData.pirority || "medium",
        columns_id: columnId,
        sort_order:
          columns.find((column) => column.id === columnId)?.tasks.length || 0,
      });
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setLoading(false);
    }
  }

  async function moveTask(
    taskId: string,
    newColumnId: string,
    newOrder: number
  ) {
    try {
      await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);
      setColumns((prev) => {
        const newColumns = [...prev];
        //find and remove the task from the old column
        let taskToMove: Task | null = null;
        for (const col of newColumns) {
          const taskIndex = col.tasks.findIndex((task) => task.id === taskId); 
          if(taskIndex !== -1){
            taskToMove = col.tasks[taskIndex];
            col.tasks.splice(taskIndex, 1);
            break;
          }
        }

        if(taskToMove){
          // add the task to the new column
          const targetColumn = newColumns.find((col) => col.id === newColumnId);
          if(targetColumn){
            targetColumn.tasks.splice(newOrder, 0, taskToMove);
          }
          
        }
        return newColumns;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move task.");
    } finally {
      setLoading(false);
    }
  }

  return {
    board,
    columns,
    loading,
    error,
    updateBoard,
    createRealTask,
    setColumns,
    moveTask,
  };
}

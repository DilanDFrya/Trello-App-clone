"use client";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useBoards } from "@/lib/hooks/useBoards";
import { useUser } from "@clerk/nextjs";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const { createBoard } = useBoards();

  const handleCreateBoard = async () => {
    await createBoard({ titel: "New Board" });
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back,
            {user?.firstName ?? user?.emailAddresses[0].emailAddress}! 🖐️
          </h1>
          <p className="text-gray-600">
            Here&apos;s what&apos;s happening with your boards today.
          </p>
          <Button className="w-full sm:w-auto mt-4 bg-blue-600 text-white hover:bg-blue-700" onClick={handleCreateBoard}>
            <Plus/>
            Create New Board
          </Button>
          

        </div>
      </main>
    </div>
  );
}

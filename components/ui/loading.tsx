"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

interface LoadingCardProps {
  className?: string;
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        className
      )}
    >
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded-full w-12"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

interface LoadingPageProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function LoadingPage({
  title = "Loading your boards...",
  subtitle = "Please wait while we fetch your data",
  className,
}: LoadingPageProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50 flex items-center justify-center",
        className
      )}
    >
      <div className="text-center">
        {/* Trello-style loading animation */}
        <div className="relative mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-4 animate-pulse">
            <div className="absolute inset-0 bg-white rounded-lg m-1">
              <div className="flex h-full">
                <div
                  className="flex-1 bg-gray-200 rounded-sm m-1 animate-pulse"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="flex-1 bg-gray-200 rounded-sm m-1 animate-pulse"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="flex-1 bg-gray-200 rounded-sm m-1 animate-pulse"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
            </div>
          </div>
          <LoadingSpinner
            size="xl"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{subtitle}</p>
        <LoadingDots />
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  className,
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  show: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({
  show,
  children,
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        className
      )}
    >
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {children || (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading...
            </h3>
            <p className="text-gray-600">Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  );
}

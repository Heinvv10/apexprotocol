/**
 * Stub for AlertDialog component
 * TODO: Implement full alert dialog functionality
 */

"use client";

import React from "react";

export const AlertDialog: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const AlertDialogTrigger: React.FC<{ children?: React.ReactNode; asChild?: boolean }> = ({ children }) => <>{children}</>;
export const AlertDialogContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDialogHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDialogFooter: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDialogTitle: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDialogDescription: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>;
export const AlertDialogAction: React.FC<{ children?: React.ReactNode; onClick?: () => void }> = ({ children }) => <button>{children}</button>;
export const AlertDialogCancel: React.FC<{ children?: React.ReactNode }> = ({ children }) => <button>{children}</button>;

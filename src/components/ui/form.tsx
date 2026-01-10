/**
 * Stub for Form components
 * TODO: Implement full form functionality with react-hook-form
 */

"use client";

import React from "react";

export const Form: React.FC<{ children?: React.ReactNode }> = ({ children }) => <form>{children}</form>;
export const FormField: React.FC<{ children?: React.ReactNode; name?: string; control?: any; render?: any }> = ({ render }) => render ? render({}) : null;
export const FormItem: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => <div className={className}>{children}</div>;
export const FormLabel: React.FC<{ children?: React.ReactNode; htmlFor?: string; className?: string }> = ({ children, htmlFor, className }) => <label htmlFor={htmlFor} className={className}>{children}</label>;
export const FormControl: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const FormDescription: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => <div className={className}>{children}</div>;
export const FormMessage: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => <div className={className}>{children}</div>;
export const useFormField = () => ({});

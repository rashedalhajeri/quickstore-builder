
import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  className?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  confirmButtonProps,
  cancelButtonProps,
  className,
}) => {
  // Create a dedicated handler for confirmation to avoid duplicate calls
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm();
    // Do not close the dialog here, let the onConfirm handler control when to close
    // The dialog will be closed by the parent component when appropriate
  };

  // Handle cancel button click
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        className={cn(
          "max-w-[450px] bg-background",
          className
        )}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="py-2 text-base text-gray-700 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2 pt-2">
          <AlertDialogCancel asChild onClick={handleCancel}>
            <Button
              variant="outline"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              {...cancelButtonProps}
            >
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} variant="default" className="bg-primary hover:bg-primary-600" {...confirmButtonProps}>
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

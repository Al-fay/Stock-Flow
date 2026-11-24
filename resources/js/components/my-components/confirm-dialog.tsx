import { Trash2Icon, AlertTriangleIcon, InfoIcon } from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    variant?: "default" | "destructive";
    icon?: React.ReactNode;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Apakah kamu yakin?",
    description = "Tindakan ini tidak dapat dibatalkan.",
    confirmText = "Ya, lanjutkan",
    cancelText = "Batal",
    loading = false,
    variant = "destructive",
    icon,
}: ConfirmDialogProps) {
    const defaultIcon =
        variant === "destructive" ? <Trash2Icon /> : <AlertTriangleIcon />;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(value) => {
                if (!loading) onOpenChange(value);
            }}
        >
            <AlertDialogContent size="sm">
                <AlertDialogHeader>
                    <AlertDialogMedia
                        className={
                            variant === "destructive"
                                ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                                : "bg-primary/10 text-primary"
                        }
                    >
                        {icon ?? defaultIcon}
                    </AlertDialogMedia>

                    <AlertDialogTitle>{title}</AlertDialogTitle>

                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        variant="outline"
                        disabled={loading}
                        className="cursor-pointer"
                    >
                        {cancelText}
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="cursor-pointer"
                        variant={variant}
                        disabled={loading}
                        onClick={(event) => {
                            event.preventDefault();
                            onConfirm();
                        }}
                    >
                        {loading ? "Memproses..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

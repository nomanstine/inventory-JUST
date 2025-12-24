"use client"

import serviceFactory from "@/services/serviceFactory";
import { Button } from "./ui/button";
import { useState } from "react";
import { Spinner } from "./ui/shadcn-io/spinner";
import { PlusIcon, UploadIcon, TrashIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type ActionType = "add" | "update" | "delete";
type VariantType = "default" | "icon";

const ACTION_CONFIG = {
    add: {
        label: "Add",
        loadingText: "Adding",
        icon: PlusIcon,
        spinnerVariant: "infinite" as const,
        buttonVariant: "default" as const,
    },
    update: {
        label: "Update",
        loadingText: "Updating",
        icon: UploadIcon,
        spinnerVariant: "ellipsis" as const,
        buttonVariant: "default" as const,
    },
    delete: {
        label: "Delete",
        loadingText: "Deleting",
        icon: TrashIcon,
        spinnerVariant: "circle" as const,
        buttonVariant: "destructive" as const,
    },
};

export function ActionButton({
    path,
    type,
    label,
    loadingText,
    payload,
    id,
    variant = "default",
}: {
    path: string;
    type: ActionType;
    label?: string;
    loadingText?: string;
    payload?: any;
    id?: number;
    variant?: VariantType;
}) {
    const service = serviceFactory(path);
    const [loading, setLoading] = useState(false);

    const config = ACTION_CONFIG[type];
    const finalLabel = label ?? config.label;
    const finalLoadingText = loadingText ?? config.loadingText;
    const Icon = config.icon;

    const getDialogText = () => {
        switch (type) {
            case "add":
                return {
                    title: "Confirm Addition",
                    description: "Are you sure you want to add this new item?",
                };
            case "update":
                return {
                    title: "Confirm Update",
                    description: "Are you sure you want to update this item?",
                };
            case "delete":
                return {
                    title: "Confirm Deletion",
                    description: "Are you sure you want to delete this item? This action cannot be undone.",
                };
            default:
                return {
                    title: "Are you sure?",
                    description: "This action cannot be undone.",
                };
        }
    };

    const dialogText = getDialogText();

    const handleClick = async () => {
        setLoading(true);
        try {
            if (type === "add") {
                if (!payload) return;
                await service.create(payload);
            } else if (type === "update") {
                if (!payload || id === undefined) return;
                await service.update(id, payload);
            } else if (type === "delete") {
                if (id === undefined) return;
                await service.delete(id);
            }
        } catch (error) {
            console.error(`Error ${type}ing item:`, error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={loading} variant={config.buttonVariant}>
                    {variant === "icon" ? (
                        loading ? <Spinner className="size-5" variant={config.spinnerVariant} /> : <Icon />
                    ) : (
                        loading ? finalLoadingText : finalLabel
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{dialogText.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {dialogText.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClick} disabled={loading}>
                        {loading ? finalLoadingText : finalLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

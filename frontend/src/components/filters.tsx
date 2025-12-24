"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState, useEffect } from "react";

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    options: FilterOption[];
}

export function FilterGroup<T = any>({
    data,
    filters,
    onFilteredData,
}: {
    data: T[];
    filters: FilterConfig[];
    onFilteredData: (filteredData: T[]) => void;
}) {
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const handleFilterChange = (filterKey: string, value: string) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    };

    useEffect(() => {
        // Apply all active filters to the data
        const filteredData = data.filter(item => {
            return Object.entries(activeFilters).every(([key, value]) => {
                if (value === "all") return true;
                return item[key as keyof T] === value;
            });
        });
        onFilteredData(filteredData);
    }, [activeFilters, data, onFilteredData]);

    return (
        <>
            {filters.map(filter => (
                <Filter 
                    key={filter.key}
                    options={filter.options}
                    filterKey={filter.key}
                    onFilterChange={handleFilterChange}
                />
            ))}
        </>
    );
}

export function Filter<T = any>({
    options,
    filterKey,
    onFilterChange,
    className = "",
}: {
    options: FilterOption[];
    filterKey: string;
    onFilterChange: (filterKey: string, value: string) => void;
    className?: string;
}) {
    const firstOption = options[0];
    const [value, setValue] = useState(firstOption?.value || "all");

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onFilterChange(filterKey, newValue);
    };

    return (
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className={`w-[180px] ${className}`}>
                <SelectValue placeholder={firstOption?.label} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

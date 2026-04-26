"use client"

import { useState, useEffect } from "react";

export interface SearchConfig {
    placeholder?: string;
    searchKeys: string[];
    className?: string;
}

// Traverse nested object using dot-notation key (e.g. "item.name")
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

export function SearchGroup<T = any>({
    data,
    config,
    onSearchedData,
}: {
    data: T[];
    config: SearchConfig;
    onSearchedData: (searchedData: T[]) => void;
}) {
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Apply search to the data
        const searchedData = searchQuery 
            ? data.filter(item => {
                return config.searchKeys.some(key => {
                    const value = getNestedValue(item, key);
                    if (value == null) return false;
                    return String(value).toLowerCase().includes(searchQuery.toLowerCase());
                });
              })
            : data;
        
        onSearchedData(searchedData);
    }, [searchQuery, data, config.searchKeys, onSearchedData]);

    return (
        <input 
            type="text" 
            placeholder={config.placeholder || "Search..."}
            className={config.className || "border rounded px-3 py-2 w-full sm:w-64 text-sm sm:text-base placeholder:text-xs sm:placeholder:text-sm"}
            onChange={(e) => setSearchQuery(e.target.value)}
        />
    );
}

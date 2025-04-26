#!/bin/bash

# Output file
output="all_files_combined.txt"

# Empty the output file
> "$output"

# Find all non-hidden files (excluding .git and the output file itself)
find . -type f ! -path '*/\.*' ! -name "$(basename "$output")" | sort | while read -r file; do
    echo "$file" >> "$output"
    echo "--------------------" >> "$output"
    cat "$file" >> "$output"
    echo -e "\n" >> "$output"
done

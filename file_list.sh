#!/usr/bin/env bash
set -euo pipefail

# Output file
output="all_files_combined.txt"

# Empty the output file
> "$output"

# Gather all tracked + untracked (but not gitignored) files, NUL-delimited
git ls-files --cached --others --exclude-standard -z |
while IFS= read -r -d '' file; do
  # Skip our own output file
  [[ "$file" == "$output" ]] && continue

  echo "$file" >> "$output"
  echo "--------------------" >> "$output"

  # Get lowercase extension for case-insensitive matching
  filename="$(basename "$file")"
  ext="${filename##*.}"
  ext="${ext,,}"

  case "$ext" in
    # common image formats
    png|jpg|jpeg|gif|bmp|svg|tif|tiff|webp|heic|ico)
      echo "[binary image content omitted]" >> "$output"
      ;;
    # lock files to skip
    json)
      # specifically skip package-lock.json
      if [[ "$filename" == "package-lock.json" ]]; then
        echo "[lock file content omitted]" >> "$output"
      else
        cat "$file" >> "$output"
      fi
      ;;
    lock)
      # specifically skip flake.lock
      if [[ "$filename" == "flake.lock" ]]; then
        echo "[lock file content omitted]" >> "$output"
      else
        cat "$file" >> "$output"
      fi
      ;;
    *)
      cat "$file" >> "$output"
      ;;
  esac

  # blank line after each file
  echo -e "\n" >> "$output"
done

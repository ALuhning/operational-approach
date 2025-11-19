#!/usr/bin/env python3
import csv

# Read the original file and clean it
input_file = 'objective1a.csv'
output_file = 'objective1a_cleaned.csv'

with open(input_file, 'r', encoding='utf-8-sig') as f:  # utf-8-sig removes BOM
    lines = f.readlines()

# Process each line - remove outer quotes and convert "" to "
cleaned_lines = []
for line in lines:
    line = line.strip()
    if line:
        # Remove outer quotes if present
        if line.startswith('"') and line.endswith('"'):
            line = line[1:-1]
        # Replace double-double quotes with single quotes
        line = line.replace('""', '"')
        cleaned_lines.append(line)

# Write the cleaned CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    for line in cleaned_lines:
        f.write(line + '\n')

print(f"Cleaned {len(cleaned_lines)} lines to {output_file}")

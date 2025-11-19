#!/usr/bin/env python3
import csv

# Read and clean the CSV file
input_file = 'approach_data_times.csv'
output_file = 'approach_data_times_cleaned.csv'

with open(input_file, 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()

cleaned_rows = []
for i, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
    
    # Remove outer quotes
    if line.startswith('"') and line.endswith('"'):
        line = line[1:-1]
    
    # Replace double-double quotes with single quotes
    line = line.replace('""', '"')
    
    # Parse as CSV
    reader = csv.reader([line])
    for row in reader:
        expected_cols = 18  # Updated for new columns
        if len(row) == expected_cols:
            cleaned_rows.append(row)
        else:
            print(f"Line {i+1}: Got {len(row)} columns, expected {expected_cols}")
            if len(row) > 0:
                print(f"  First few fields: {row[:3]}")

# Write cleaned CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(cleaned_rows)

print(f"Cleaned CSV: {len(cleaned_rows)} rows (including header)")
print(f"Output: {output_file}")

# Verify the header
if cleaned_rows:
    print(f"\nHeader: {cleaned_rows[0]}")
    if len(cleaned_rows) > 1:
        print(f"\nSample row: {cleaned_rows[1][:5]}...")

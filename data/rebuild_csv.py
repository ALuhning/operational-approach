#!/usr/bin/env python3
import csv
import sys

# Read original badly formatted file and rebuild it properly
rows = []

# Manually reconstruct from the pattern we know exists
data = open('approach_data.csv', 'r', encoding='utf-8').read()

# The header is broken across lines - fix it
header = 'Objective,LOE,IMO,Parent_OAI_ID,Sub_OAI_ID,OAI_Description,Land,Sea,Air,Cyber,Space,Decisive_Point,Decision_Point'

# Parse the messy content by looking for the pattern
# Each row starts with "OBJ" and ends with a quote followed by optional space/newline
import re

# Find all complete records - they start with OBJ and have balanced quotes
pattern = r'(OBJ[^"]*(?:"[^"]*")*[^"]*")'
matches = re.findall(pattern, data, re.DOTALL)

print(f"Found {len(matches)} records")

# Now parse each match as CSV
records = []
for match in matches:
    # Clean up extra whitespace and newlines within the match
    cleaned = ' '.join(match.split())
    # Parse as CSV
    reader = csv.reader([cleaned])
    for row in reader:
        if len(row) == 13:  # We expect 13 columns
            records.append(row)
        else:
            print(f"Skipping malformed row with {len(row)} columns: {row[:3]}")

# Write proper CSV
with open('approach_data.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header.split(','))
    writer.writerows(records)

print(f"Wrote {len(records)} records to approach_data.csv")

import csv

# Read the malformed CSV and fix it
with open('approach_data.csv', 'r', encoding='utf-8') as infile:
    content = infile.read()
    
# Split by actual record boundaries (looking for pattern of quoted fields)
# Each record should be on one line
lines = content.split('\n')

# Get header
header = lines[0].strip()

# Combine broken lines
fixed_rows = [header]
current_row = ""
in_quotes = False
quote_count = 0

for line in lines[1:]:
    if not line.strip():
        continue
        
    # Count quotes to determine if we're inside a quoted field
    for char in line:
        if char == '"':
            quote_count += 1
    
    if current_row:
        current_row += " " + line.strip()
    else:
        current_row = line.strip()
    
    # If we have an even number of quotes, the row is complete
    if quote_count % 2 == 0:
        fixed_rows.append(current_row)
        current_row = ""
        quote_count = 0

# Write the fixed CSV
with open('approach_data_fixed.csv', 'w', encoding='utf-8', newline='') as outfile:
    outfile.write('\n'.join(fixed_rows))

print(f"Fixed CSV written with {len(fixed_rows)} rows (including header)")

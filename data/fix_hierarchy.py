#!/usr/bin/env python3
import csv

# Read the CSV
input_file = 'objective1a_cleaned.csv'
output_file = 'objective1a_cleaned_fixed.csv'

with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Track counters for hierarchy
obj_counters = {}
loe_counters = {}
imo_counters = {}
oai_counters = {}

# Process each row and assign correct IDs
for row in rows:
    obj_title = row['Objective_Title']
    loe_title = row['LOE_Title']
    imo_title = row['IMO_Title']
    
    # Objective ID
    if obj_title not in obj_counters:
        obj_counters[obj_title] = len(obj_counters) + 1
    obj_id = str(obj_counters[obj_title])
    row['Objective_ID'] = obj_id
    
    # LoE ID
    loe_key = f"{obj_title}|{loe_title}"
    if loe_key not in loe_counters:
        loe_counters[loe_key] = len([k for k in loe_counters.keys() if k.startswith(obj_title + "|")]) + 1
    loe_num = loe_counters[loe_key]
    loe_id = f"{obj_id}.{loe_num}"
    row['LOE_ID'] = loe_id
    
    # IMO ID
    imo_key = f"{obj_title}|{loe_title}|{imo_title}"
    if imo_key not in imo_counters:
        imo_counters[imo_key] = len([k for k in imo_counters.keys() if k.startswith(f"{obj_title}|{loe_title}|")]) + 1
    imo_num = imo_counters[imo_key]
    imo_id = f"{loe_id}.{imo_num}"
    row['IMO_ID'] = imo_id
    
    # OAI ID (using letters a, b, c, etc.)
    oai_key = f"{obj_title}|{loe_title}|{imo_title}"
    if oai_key not in oai_counters:
        oai_counters[oai_key] = 0
    oai_counters[oai_key] += 1
    oai_letter = chr(96 + oai_counters[oai_key])  # 97 is 'a'
    oai_id = f"{imo_id}.{oai_letter}"
    row['OAI_ID'] = oai_id

# Write the fixed CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    if rows:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

print(f"Fixed CSV written to {output_file}")
print(f"\nSample IDs:")
for i, row in enumerate(rows[:5]):
    print(f"{row['OAI_ID']}: {row['OAI_Title']}")

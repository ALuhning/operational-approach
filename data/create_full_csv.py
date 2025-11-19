#!/usr/bin/env python3
import csv

# The raw data from your attachment - each row is the full string
raw_data = '''OBJ1 - Strengthen & Protect Western Hemisphere Partnership Network,""LOE1.1 - Strengthen, Reassure, Integrate Regional Partners"",""Restore & Protect Intelligence Sharing"",""1.1.1"",""1.1.1a"",""Design and establish WHEMCOM Joint Intelligence Fusion Cell (JIFC-HEM)"",""Design manning, SOPs, and HUMINT integration"",""Define maritime intel inputs, AIS feeds, and liaison roles"",""Define air ISR inputs (P-8/P-3/MQ-9) and ATO links"",""Design secure networks, classification rules, cross-domain solutions"",""Plan SATCOM, space ISR feeds, and archival policies"",""Fusion cell framework agreed and resourced"",""Decision to stand up JIFC-HEM with specific partners""
OBJ1 - Strengthen & Protect Western Hemisphere Partnership Network,""LOE1.1 - Strengthen, Reassure, Integrate Regional Partners"",""Restore & Protect Intelligence Sharing"",""1.1.1"",""1.1.1b"",""Operate and refine JIFC-HEM for sustained intelligence fusion"",""Run daily land-focused fusion boards and HUMINT review"",""Continuously ingest maritime tracks and boarding reports"",""Fuse air tracks and ISR collections into shared picture"",""Maintain, secure, and patch intel networks and tools"",""Exploit space imagery and feeds for network and OE awareness"",""Partners routinely sharing and receiving actionable intel"",""Partner begins withholding or downgrading shared intelligence""'''

# Process - replace "" with " and parse as CSV
lines = raw_data.strip().split('\n')
cleaned_rows = []

for line in lines:
    # Replace double-double quotes with single quotes
    cleaned_line = line.replace('""', '"')
    # Parse the CSV line
    reader = csv.reader([cleaned_line])
    for row in reader:
        cleaned_rows.append(row)

# Write proper CSV
header = ['Objective', 'LOE', 'IMO', 'Parent_OAI_ID', 'Sub_OAI_ID', 'OAI_Description',
          'Land', 'Sea', 'Air', 'Cyber', 'Space', 'Decisive_Point', 'Decision_Point']

with open('approach_data.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(cleaned_rows)

print(f"Created CSV with {len(cleaned_rows)} data rows")

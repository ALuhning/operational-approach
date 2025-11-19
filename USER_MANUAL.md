# Operational Approach Visualization - User Manual

## Introduction

This application provides an interactive visualization tool for operational approaches in joint military planning. It displays Operations, Activities, and Investments (OAIs) across all domains (Land, Air, Sea, Cyber, Space) in a Gantt-style timeline format.

## Getting Started

### 1. Registration and Login

1. Navigate to the application URL
2. Click "Register" to create a new account
3. Fill in your information:
   - Email address
   - Password
   - Name and rank
   - Organization
   - Role (Commander, Planner, or Analyst)
4. Click "Register" to create your account
5. You'll be automatically logged in and redirected to the Dashboard

### 2. Uploading Your Operational Approach

1. From the Dashboard, click "Upload New Dataset"
2. Enter a name for your operational approach
3. Optionally add a description
4. Click "Select CSV File" and choose your CSV file
5. Click "Upload"

**CSV Format Requirements:**
- Must include columns: Objective, LOE, IMO, Parent_OAI_ID, Sub_OAI_ID, OAI_Description
- Domain columns: Land, Sea, Air, Cyber, Space
- Decision columns: Decisive_Point, Decision_Point
- See `/data/approach_data.csv` for example format

### 3. Visualizing Your Operational Approach

1. From the Dashboard, click "Visualize" on any dataset
2. The Gantt timeline visualization will load

## Using the Visualization

### View Modes

**Commander View**
- High-level overview
- Shows only Decisive Points (▲) and Decision Points (★)
- Simplified view for briefings
- Ideal for senior leadership

**Planner View**
- Full detail mode
- Shows all OAIs across all domains
- Includes all timeline information
- Best for detailed planning and refinement

Toggle between views using the buttons in the top toolbar.

### Understanding the Timeline

**Groups (Rows)**
- Each row represents a domain (LAND, SEA, AIR, CYBER, SPACE) within an IMO
- Color-coded by domain:
  - Land: Brown
  - Sea: Blue
  - Air: Light Blue
  - Cyber: Purple
  - Space: Dark Blue

**Items (Bars)**
- Each bar represents an OAI
- Bar length shows duration
- Position shows timing
- Labeled with Sub-OAI ID

**Special Markers**
- ▲ DP# = Decisive Point (Yellow, numbered sequentially)
- ★ DC# = Decision Point (Yellow, numbered sequentially)

### Filtering

Click the Filter icon (☰) to open the filter panel:

**Domain Filters**
- Toggle visibility of each domain
- Useful for focusing on specific operational areas

**Display Options**
- Show/hide Decisive Points
- Show/hide Decision Points
- Show/hide Branch Plans

### Interacting with OAIs

**Viewing Details**
1. Click on any bar in the timeline
2. A detail dialog will open showing:
   - Full OAI description
   - LOE and IMO
   - Activities for each domain
   - Decisive/Decision point information

**Adjusting Timeline** (Drag and Drop)
1. Click and hold on a timeline bar
2. Drag left or right to adjust timing
3. Release to save changes
4. Changes are automatically saved

**Notes:**
- You can only adjust timing, not change which IMO/domain an OAI belongs to
- All users see their own datasets; changes don't affect others

### Exporting

**From Dashboard:**
- Click the download icon on any dataset card
- Downloads refined CSV with your changes

**From Visualization:**
- Click the download icon in the top toolbar
- Downloads current dataset as CSV

## Use Cases

### Planning Team Workflow

1. **Initial Upload**: Lead planner uploads operational approach CSV
2. **Review**: Team reviews in Planner mode
3. **Refinement**: 
   - Adjust timelines via drag-and-drop
   - Click items to review details
   - Identify gaps or overlaps
4. **Branch Planning**: 
   - Mark decision points where branches may be needed
   - Identify triggering OAIs
5. **Export**: Download refined approach for further work

### Commander Briefing Workflow

1. **Switch to Commander View**
2. **Filter**: Show only relevant domains
3. **Present**: Walk through IMOs and key decision/decisive points
4. **Discuss**: Click on items to show supporting detail as needed

### Multi-User Scenario

Each user:
- Has their own account
- Can upload multiple datasets
- Can work independently on their approaches
- Can export and share CSV files with team members

## Tips and Best Practices

1. **Start Simple**: Upload a small dataset first to familiarize yourself with the interface
2. **Use Filters**: Don't try to view everything at once; filter to focus areas
3. **Regular Exports**: Export your work regularly to save refined versions
4. **Naming**: Use descriptive dataset names (e.g., "OBJ1-LOE1-Draft-v2")
5. **Commander View**: Test your approach in Commander view before briefing
6. **Decisive vs Decision Points**:
   - Decisive Points: Where success must be achieved
   - Decision Points: Where commander may choose different courses of action

## Troubleshooting

**CSV Upload Fails**
- Verify CSV format matches required columns
- Check for special characters or encoding issues
- Ensure file size is under 10MB

**Timeline Not Showing Items**
- Check filters - you may have filtered out all items
- Verify your CSV has data in the domain columns
- Try resetting filters

**Drag and Drop Not Working**
- Ensure you're clicking directly on a bar (not the label)
- Check that you're logged in and viewing your own dataset

**Performance Issues**
- Large datasets (500+ OAIs) may be slow
- Consider breaking into multiple smaller datasets by LOE
- Use filters to reduce visible items

## Support

For technical issues or questions:
- Check the README.md for setup and configuration help
- Review your CSV format against the example file
- Ensure browser is up to date (Chrome, Firefox, Safari, or Edge recommended)

## Keyboard Shortcuts

- Arrow keys: Navigate timeline when focused
- +/- : Zoom in/out on timeline
- Esc: Close detail dialog or filter panel

## Security Notes

- Each user can only see their own datasets
- Passwords are securely hashed
- Sessions expire after 7 days
- Always log out when using shared computers

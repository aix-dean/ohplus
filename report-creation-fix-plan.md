# Report Creation Fix Plan

## Issue Analysis
The report creation page in `logistics/reports/create/[id]/page.tsx` has two main issues:

1. **Photos not being saved**: Users can upload photos (beforePhotos and afterPhotos), but these are not being processed or uploaded to Firebase Storage when creating the report. The report only saves existing attachments from the service assignment.

2. **Campaign name not being saved**: The campaign name is displayed from the service assignment but is not being saved as a separate field in the report. It's currently being used as the `client` field, but there should be a dedicated `campaignName` field.

## Required Changes

### 1. Update ReportData Interface
Add a `campaignName` field to the ReportData interface in `lib/report-service.ts`.

### 2. Update Report Creation Logic
Modify the `createReportFromAssignment` function in `app/logistics/reports/create/[id]/page.tsx` to:
- Upload the selected photos to Firebase Storage
- Include the uploaded photo URLs in the report attachments
- Save the campaign name as a separate field

### 3. Photo Upload Process
- Use the existing `uploadFileToFirebaseStorage` function from `lib/firebase-service.ts`
- Upload photos to a reports-specific path (e.g., `reports/${reportId}/photos/`)
- Add photo metadata (fileName, fileType, fileUrl, label) to attachments array

### 4. Campaign Name Handling
- Add `campaignName` field to report data
- Set it from `assignmentData.campaignName`

## Implementation Steps

1. Add `campaignName?: string` to ReportData interface
2. Update `createReport` function to handle the new field
3. Modify report creation page to upload photos and include campaign name
4. Test the changes to ensure data is saved correctly

## Files to Modify
- `lib/report-service.ts` - Add campaignName field to interface
- `app/logistics/reports/create/[id]/page.tsx` - Update report creation logic to handle photos and campaign name
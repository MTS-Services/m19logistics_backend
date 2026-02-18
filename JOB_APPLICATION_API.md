# Job Application API Documentation

## Overview
This API allows anyone to submit job applications and provides admin endpoints to manage applications.

---

## Public Endpoint (No Authentication Required)

### Submit Job Application

**Endpoint:** `POST /api/jobs/apply`

**Description:** Submit a job application with CV upload

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `fullName` (string, required) - Full name (2-100 characters)
- `email` (string, required) - Valid email address
- `phoneNumber` (string, required) - Phone number
- `positionOfInterest` (string, required) - One of: `Driver`, `Operations`, `Office & Support`, `Others`
- `coverLetter` (string, required) - Cover letter/message (50-2000 characters)
- `cv` (file, required) - CV file (PDF, DOC, or DOCX, max 10MB)

**Example Request (using fetch):**
```javascript
const formData = new FormData();
formData.append('fullName', 'John Smith');
formData.append('email', 'john.smith@example.com');
formData.append('phoneNumber', '07712345678');
formData.append('positionOfInterest', 'Driver');
formData.append('coverLetter', 'I am interested in joining M19 Logistics as a driver. I have 5 years of experience...');
formData.append('cv', fileInput.files[0]); // File from input element

const response = await fetch('https://m19logisticsbackend.mtscorporate.com/api/jobs/apply', {
  method: 'POST',
  body: formData,
  // No Authorization header needed - public endpoint
});

const data = await response.json();
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Job application submitted successfully! We will review your application and get back to you soon.",
  "data": {
    "id": 1,
    "fullName": "John Smith",
    "email": "john.smith@example.com",
    "positionOfInterest": "Driver",
    "createdAt": "2026-02-17T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "coverLetter",
      "message": "Cover letter must be between 50 and 2000 characters"
    }
  ]
}
```

---

## Admin Endpoints (Authentication Required)

All admin endpoints require admin authentication:
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 1. Get All Job Applications

**Endpoint:** `GET /api/admin/job-applications`

**Query Parameters:**
- `status` (optional) - Filter by status: `PENDING`, `REVIEWED`, `SHORTLISTED`, `REJECTED`
- `positionOfInterest` (optional) - Filter by position (case-insensitive, e.g., `driver` or `Driver`)
- `isRead` (optional) - Filter by read status: `true`, `false`
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)
- `limit` (optional) - Maximum results (default: 100)

**Examples:**
```
GET /api/admin/job-applications?status=PENDING&isRead=false
GET /api/admin/job-applications?positionOfInterest=driver
GET /api/admin/job-applications?positionOfInterest=operations&status=SHORTLISTED
```

**Response (200):**
```json
{
  "success": true,
  "message": "Job applications retrieved successfully",
  "count": 15,
  "data": [
    {
      "id": 1,
      "fullName": "John Smith",
      "email": "john.smith@example.com",
      "phoneNumber": "07712345678",
      "positionOfInterest": "Driver",
      "coverLetter": "I am interested in...",
      "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167000000-applicant-resume.pdf",
      "isRead": false,
      "status": "PENDING",
      "adminNotes": null,
      "createdAt": "2026-02-17T10:30:00.000Z",
      "updatedAt": "2026-02-17T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Job Application by ID

**Endpoint:** `GET /api/admin/job-applications/:id`

**Description:** Retrieves a single job application and automatically marks it as read

**Response (200):**
```json
{
  "success": true,
  "message": "Job application retrieved successfully",
  "data": {
    "id": 1,
    "fullName": "John Smith",
    "email": "john.smith@example.com",
    "phoneNumber": "07712345678",
    "positionOfInterest": "Driver",
    "coverLetter": "I am interested in joining M19 Logistics...",
    "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167000000-applicant-resume.pdf",
    "isRead": true,
    "status": "PENDING",
    "adminNotes": null,
    "createdAt": "2026-02-17T10:30:00.000Z",
    "updatedAt": "2026-02-17T10:30:00.000Z"
  }
}
```

---

### 3. Update Job Application Status

**Endpoint:** `PATCH /api/admin/job-applications/:id/status`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "SHORTLISTED",
  "adminNotes": "Strong candidate, schedule interview for next week"
}
```

**Fields:**
- `status` (optional) - One of: `PENDING`, `REVIEWED`, `SHORTLISTED`, `REJECTED`
- `adminNotes` (optional) - Admin notes/comments

**Response (200):**
```json
{
  "success": true,
  "message": "Job application status updated successfully",
  "data": {
    "id": 1,
    "fullName": "John Smith",
    "status": "SHORTLISTED",
    "adminNotes": "Strong candidate, schedule interview for next week",
    "updatedAt": "2026-02-17T11:00:00.000Z"
  }
}
```

---

### 4. Get Job Application Statistics

**Endpoint:** `GET /api/admin/job-applications/stats`

**Description:** Returns comprehensive statistics with detailed application information for each category

**Response (200):**
```json
{
  "success": true,
  "message": "Job application statistics retrieved successfully",
  "data": {
    "total": 2,
    "byStatus": {
      "pending": {
        "count": 1,
        "applications": [
          {
            "id": 2,
            "fullName": "Jane Doe",
            "email": "jane@example.com",
            "phoneNumber": "07712345679",
            "positionOfInterest": "Operations",
            "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167001000-applicant-cv.pdf",
            "isRead": false,
            "createdAt": "2026-02-17T11:00:00.000Z"
          }
        ]
      },
      "reviewed": {
        "count": 0,
        "applications": []
      },
      "shortlisted": {
        "count": 1,
        "applications": [
          {
            "id": 1,
            "fullName": "John Smith",
            "email": "john@example.com",
            "phoneNumber": "07712345678",
            "positionOfInterest": "Driver",
            "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167000000-applicant-resume.pdf",
            "isRead": true,
            "adminNotes": "Strong candidate, schedule interview",
            "createdAt": "2026-02-17T10:30:00.000Z"
          }
        ]
      },
      "rejected": {
        "count": 0,
        "applications": []
      }
    },
    "unread": 1,
    "byPosition": [
      {
        "position": "Operations",
        "count": 1,
        "applications": [
          {
            "id": 2,
            "fullName": "Jane Doe",
            "email": "jane@example.com",
            "phoneNumber": "07712345679",
            "positionOfInterest": "Operations",
            "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167001000-applicant-cv.pdf",
            "status": "PENDING",
            "isRead": false,
            "createdAt": "2026-02-17T11:00:00.000Z"
          }
        ]
      },
      {
        "position": "Driver",
        "count": 1,
        "applications": [
          {
            "id": 1,
            "fullName": "John Smith",
            "email": "john@example.com",
            "phoneNumber": "07712345678",
            "positionOfInterest": "Driver",
            "cvUrl": "https://m19logisticsbackend.mtscorporate.com/uploads/cvs/1708167000000-applicant-resume.pdf",
            "status": "SHORTLISTED",
            "isRead": true,
            "createdAt": "2026-02-17T10:30:00.000Z"
          }
        ]
      }
    ]
  }
}
```

**Response Details:**
- **`total`** - Total number of applications
- **`byStatus`** - Applications grouped by status (PENDING, REVIEWED, SHORTLISTED, REJECTED)
  - Each status includes `count` and full `applications` array with details
- **`unread`** - Number of unread applications (count only)
- **`byPosition`** - Applications grouped by position with count and details for each position
```

---

### 5. Delete Job Application

**Endpoint:** `DELETE /api/admin/job-applications/:id`

**Description:** Permanently deletes a job application (Admin only)

**Response (200):**
```json
{
  "success": true,
  "message": "Job application deleted successfully"
}
```

---

## Position Options

The following positions are available for selection:
- `Driver`
- `Operations`
- `Office & Support`
- `Others`

---

## Application Status Workflow

1. **PENDING** - Initial status when application is submitted
2. **REVIEWED** - Admin has reviewed the application
3. **SHORTLISTED** - Candidate selected for interview
4. **REJECTED** - Application rejected

---

## File Requirements

**CV Upload:**
- Accepted formats: PDF (.pdf), Word (.doc, .docx)
- Maximum file size: 10MB
- Files stored at: `/uploads/cvs/`

---

## Testing with Postman

### Public Application Submission

1. **Method:** POST
2. **URL:** `{{baseUrl}}/api/jobs/apply`
3. **Headers:** None required (public endpoint)
4. **Body:** Select `form-data`
5. **Add fields:**
   - fullName: `John Smith`
   - email: `john.smith@example.com`
   - phoneNumber: `07712345678`
   - positionOfInterest: `Driver`
   - coverLetter: `I am very interested in joining M19 Logistics as a driver. I have 5 years of experience driving delivery trucks and hold a valid UK driving license...`
   - cv: (Select file from computer)

### Admin - View Applications

1. **Method:** GET
2. **URL:** `{{baseUrl}}/api/admin/job-applications`
3. **Headers:** 
   - Authorization: `Bearer {{adminToken}}`
4. **Optional Query Params:**
   - status: `PENDING`
   - isRead: `false`

---

## Integration Example (Frontend Form)

```html
<form id="jobApplicationForm" enctype="multipart/form-data">
  <input type="text" name="fullName" placeholder="Enter your full name" required />
  <input type="email" name="email" placeholder="your.email@example.com" required />
  <input type="tel" name="phoneNumber" placeholder="07XXX XXXXXX" required />
  
  <select name="positionOfInterest" required>
    <option value="">Select a position</option>
    <option value="Driver">Driver</option>
    <option value="Operations">Operations</option>
    <option value="Office & Support">Office & Support</option>
    <option value="Others">Others</option>
  </select>
  
  <textarea name="coverLetter" rows="5" placeholder="Tell us about yourself and why you'd like to join M19 Logistics..." required minlength="50" maxlength="2000"></textarea>
  
  <input type="file" name="cv" accept=".pdf,.doc,.docx" required />
  <p>Accepted formats: PDF, DOC, DOCX (Max 10MB)</p>
  
  <button type="submit">Submit Application</button>
</form>

<script>
document.getElementById('jobApplicationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  try {
    const response = await fetch('https://m19logisticsbackend.mtscorporate.com/api/jobs/apply', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Application submitted successfully!');
      e.target.reset();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
});
</script>
```

---

## Notes

- **No authentication required for job applications** - Anyone can apply
- **CV files are publicly accessible** via their URL (consider adding access restrictions if needed)
- **Admin can track application status** from PENDING → REVIEWED → SHORTLISTED/REJECTED
- **Applications automatically marked as read** when admin views them
- **Statistics endpoint** provides overview of all applications

---

## Error Codes

- `400` - Validation error or missing fields
- `401` - Unauthorized (admin endpoints only)
- `404` - Job application not found
- `500` - Server error

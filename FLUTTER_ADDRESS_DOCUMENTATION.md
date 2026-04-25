# Address Module API Documentation for Flutter

This documentation provides details for all address-related routes in the Djarna App Backend.

## **Base Configuration**

- **Base URL:** `{{baseUrl}}/api/v1/address`
- **Authentication:** All routes require a Bearer Token in the headers.
  - Header: `Authorization: Bearer <your_access_token>`

---

## **Endpoints**

### **1. Add New Shipping Address**
Adds a new shipping address for the authenticated user.
- **URL:** `/`
- **Method:** `POST`
- **Request Body:**
```json
{
  "fullName": "John Doe",
  "country": "Gambia",
  "addressLine1": "123 Street Name",
  "addressLine2": "Apartment 4B", (optional)
  "postcode": "12345",
  "city": "Banjul",
  "isDefault": false
}
```
- **Constraints:**
  - A user can have a maximum of **2** shipping addresses.
  - If it's the first address, it will automatically be set as `isDefault: true`.
  - If `isDefault` is set to `true`, other existing addresses will be set to `false`.

---

### **2. Get My Addresses**
Retrieves all shipping addresses for the authenticated user.
- **URL:** `/`
- **Method:** `GET`
- **Response Data:**
```json
{
  "success": true,
  "message": "Addresses retrieved successfully",
  "data": [
    {
      "_id": "60d...123",
      "fullName": "John Doe",
      "country": "Gambia",
      "addressLine1": "123 Street Name",
      "addressLine2": "Apartment 4B",
      "postcode": "12345",
      "city": "Banjul",
      "isDefault": true,
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
  ]
}
```

---

### **3. Update Address**
Updates an existing shipping address.
- **URL:** `/:id`
- **Method:** `PATCH`
- **Request Body:** (Any subset of the fields below)
```json
{
  "fullName": "John Updated",
  "addressLine1": "New Street Name",
  "isDefault": true
}
```
- **Note:** If `isDefault` is set to `true`, other existing addresses will be set to `false`.

---

### **4. Set Default Address**
Sets a specific address as the default one.
- **URL:** `/:id/set-default`
- **Method:** `PATCH`
- **Request Body:** None

---

### **5. Delete Address**
Deletes a shipping address (Soft Delete).
- **URL:** `/:id`
- **Method:** `DELETE`
- **Note:** 
  - If the deleted address was the default one, the most recently created address will automatically become the new default.

---

## **Error Responses**

| Status Code | Message | Description |
|-------------|---------|-------------|
| 400 | "You can only have up to 2 shipping addresses" | Occurs when trying to add more than 2 addresses. |
| 401 | "Unauthorized" | Missing or invalid Bearer Token. |
| 404 | "Address not found" | The specified ID does not exist or does not belong to the user. |
| 500 | "Internal Server Error" | Unexpected server-side issue. |

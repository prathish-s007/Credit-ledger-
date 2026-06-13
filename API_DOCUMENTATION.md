# API Documentation

All API requests expect JSON request payloads and return structured JSON responses. Protected routes require a Bearer token in the `Authorization` header:

```text
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication APIs

### Register Shop Owner
- **Endpoint**: `POST /api/auth/register/shop-owner`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "shopName": "Apex Grocery",
    "email": "owner@apex.com",
    "mobileNumber": "9876543210",
    "password": "securepassword123"
  }
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603f...",
      "name": "John Doe",
      "shopName": "Apex Grocery",
      "email": "owner@apex.com",
      "mobileNumber": "9876543210",
      "role": "shop_owner"
    }
  }
  ```

### Login Shop Owner
- **Endpoint**: `POST /api/auth/login/shop-owner`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "emailOrMobile": "owner@apex.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### Login Customer
- **Endpoint**: `POST /api/auth/login/customer`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "mobileNumber": "9876500001",
    "password": "customertemppassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Protected (All Authenticated users)
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "user": {
      "id": "603f...",
      "name": "John Doe",
      "role": "shop_owner"
    }
  }
  ```

---

## 2. Customer APIs

### Create Customer
- **Endpoint**: `POST /api/customers`
- **Access**: Protected (Shop Owner Only)
- **Request Body**:
  ```json
  {
    "name": "Alice Smith",
    "mobileNumber": "9876500001",
    "email": "alice@email.com",
    "address": "456 Oak Rd",
    "creditLimit": 15000,
    "password": "customertemppassword"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "status": "success",
    "data": { ... }
  }
  ```

### Get All Customers (Paginated & Sortable)
- **Endpoint**: `GET /api/customers`
- **Access**: Protected (Shop Owner Only)
- **Query Parameters**:
  - `page`: Page index (default: `1`)
  - `limit`: Records per page (default: `5`)
  - `search`: Filter by name, mobile, or email
  - `sortBy`: Field to sort by (e.g. `createdAt`, `currentBalance`, `name`)
  - `order`: `asc` or `desc`
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "pagination": {
      "page": 1,
      "limit": 5,
      "totalPages": 2,
      "totalRecords": 8
    },
    "metrics": {
      "totalCustomers": 8,
      "totalOutstandingBalance": 12450.50,
      "totalCreditLimit": 120000.00
    },
    "data": [ ... ]
  }
  ```

### Get Customer by ID
- **Endpoint**: `GET /api/customers/:id`
- **Access**: Protected (Shop Owner / Customer Self)
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": { ... }
  }
  ```

### Update Customer Details
- **Endpoint**: `PUT /api/customers/:id`
- **Access**: Protected (Shop Owner Only)
- **Request Body**: Fields to update (e.g., `name`, `creditLimit`, `currentBalance`).
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "data": { ... }
  }
  ```

### Delete Customer
- **Endpoint**: `DELETE /api/customers/:id`
- **Access**: Protected (Shop Owner Only)
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Customer deleted successfully."
  }
  ```

---

## 3. Product Inventory APIs

### Add Product
- **Endpoint**: `POST /api/products`
- **Access**: Protected (Shop Owner Only)
- **Request Body**:
  ```json
  {
    "name": "Premium Wheat Flour",
    "category": "Groceries",
    "unit": "kg",
    "price": 4.50,
    "stockQuantity": 150
  }
  ```

### Get All Products (Paginated & Filterable)
- **Endpoint**: `GET /api/products`
- **Access**: Protected (Shop Owner Only)
- **Query Parameters**: `page`, `limit`, `search`, `sortBy`, `order`

### Update Product
- **Endpoint**: `PUT /api/products/:id`
- **Access**: Protected (Shop Owner Only)

### Delete Product
- **Endpoint**: `DELETE /api/products/:id`
- **Access**: Protected (Shop Owner Only)

---

## 4. Purchase Ledger APIs

### Record Purchase Order (Debit)
- **Endpoint**: `POST /api/purchases`
- **Access**: Protected (Shop Owner Only)
- **Request Body**:
  ```json
  {
    "customerId": "603f...",
    "items": [
      { "productId": "603e...", "quantity": 10 },
      { "productId": "603d...", "quantity": 2 }
    ]
  }
  ```
- **Response (201 Created)**: Automatically decrements stock quantities and increments the customer's outstanding balance.

### Get All Purchases
- **Endpoint**: `GET /api/purchases`
- **Access**: Protected (Shop Owner Only)

---

## 5. Payment Ledger APIs

### Record Payment Receipt (Credit)
- **Endpoint**: `POST /api/payments`
- **Access**: Protected (Shop Owner Only)
- **Request Body**:
  ```json
  {
    "customerId": "603f...",
    "amount": 2500.00,
    "paymentMethod": "UPI",
    "remarks": "Part-payment for May billing"
  }
  ```
- **Response (201 Created)**: Automatically decrements the customer's outstanding balance.

### Get All Payments
- **Endpoint**: `GET /api/payments`
- **Access**: Protected (Shop Owner Only)

---

## 6. Ledger Statements & PDF Exports

### Get Chronological Customer Ledger
- **Endpoint**: `GET /api/ledgers/customer/:customerId`
- **Access**: Protected (Shop Owner / Customer Self)
- **Query Parameters**:
  - `startDate`: Filter transactions start date (e.g. `2026-05-01`)
  - `endDate`: Filter transactions end date (e.g. `2026-05-31`)
- **Response (200 OK)**:
  Returns merged payment credits and purchase debits sorted chronologically, showing opening balance and current running balances.

### Download Statement PDF Invoice
- **Endpoint**: `GET /api/ledgers/customer/:customerId/statement/pdf`
- **Access**: Protected (Shop Owner / Customer Self)
- **Response**: Returns a downloadable formatted PDF ledger statement file stream.

---

## 7. Automated Alert Notifications

### Get Alerts List
- **Endpoint**: `GET /api/notifications`
- **Access**: Protected (Shop Owner Only)
- **Query Parameters**:
  - `unreadOnly`: Set to `true` to fetch only unread notifications (default: `false`)

### Generate Notification Triggers
- **Endpoint**: `POST /api/notifications/generate`
- **Access**: Protected (Shop Owner Only)
- **Response**: Forces system checks to query low stock levels, outstanding payment dates, and credit limits, creating notification alerts.

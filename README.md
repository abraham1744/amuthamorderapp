# Order Management App

A comprehensive mobile order management application built with React Native and Expo, integrated with Google Sheets for data storage.

## Features

- **Create Orders**: Easy order creation with customer and product selection
- **Order Management**: View and update order statuses
- **Order History**: Complete history of delivered orders
- **Google Sheets Integration**: Real-time data synchronization
- **Clean UI**: Professional, user-friendly interface

## Google Sheets Setup

Before using the app, you need to set up Google Sheets API access:

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API

### 2. Get API Credentials

1. Go to "Credentials" in the Google Cloud Console
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 3. Create Your Google Sheet

Create a new Google Sheet with the following structure:

#### Sheet 1: "Products"
- Column A: Product Name (text)
- Column B: Price (number)

Example data:
```
Product Name | Price
Apple        | 1.50
Banana       | 0.75
Orange       | 1.25
```

#### Sheet 2: "Customers"
- Column A: Customer Name (text)

Example data:
```
Customer Name
John Doe
Jane Smith
Mike Johnson
```

#### Sheet 3: "Orders"
- Column A: Order ID
- Column B: Customer Name
- Column C: Invoice Date
- Column D: Delivery Date
- Column E: Total Quantity
- Column F: Total Price
- Column G: Status
- Column H: Delivered

#### Sheet 4: "OrderDetails"
- Column A: Order ID
- Column B: Product Name
- Column C: Quantity
- Column D: Price
- Column E: Subtotal

#### Sheet 5: "OrderHistory"
- Column A: Order ID
- Column B: Customer Name
- Column C: Invoice Date
- Column D: Delivery Date
- Column E: Total Quantity
- Column F: Total Price
- Column G: Status
- Column H: Delivered
- Column I: Timestamp

### 4. Configure the App

1. Get your Google Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

2. Update the configuration in `services/googleSheets.ts`:
   ```typescript
   const API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY';
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
   ```

### 5. Make Your Sheet Public

1. Click "Share" on your Google Sheet
2. Change permissions to "Anyone with the link can view"
3. Make sure the link sharing is enabled

## Usage

### Creating Orders

1. Navigate to the "Create Order" tab
2. Select a customer from the dropdown
3. Set invoice and delivery dates
4. Add products by selecting from the dropdown and entering quantities
5. Review totals and tap "Place Order"

### Managing Orders

1. Navigate to "View Orders" to see all pending orders
2. View order statistics and product summaries
3. Toggle order status between Pending and Delivered
4. Delivered orders are automatically archived

### Order History

1. Navigate to "Order History" to view completed orders
2. Use the search function to find specific orders
3. View detailed order information and items

## Technical Details

- **Framework**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **Data Storage**: Google Sheets API
- **UI Components**: Custom React Native components with clean styling
- **State Management**: React hooks (useState, useEffect)

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Production Deployment

The app can be built for web, iOS, and Android using Expo's build service or EAS Build.

## Troubleshooting

### Common Issues

1. **API Key Issues**: Make sure your Google Sheets API key is valid and has proper permissions
2. **Sheet Access**: Ensure your Google Sheet is publicly accessible
3. **Sheet Structure**: Verify that all sheets have the correct names and column structure
4. **Data Loading**: Check network connectivity and API rate limits

### Error Messages

- "Failed to load data from Google Sheets": Check API key and sheet permissions
- "Validation Error": Ensure all required fields are filled when creating orders
- "Failed to place order": Check sheet write permissions and structure

For more help, check the console logs for detailed error messages.
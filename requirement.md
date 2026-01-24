# Tea E-Commerce Platform - Complete Business Requirements
## Non-Technical User Flow Documentation

---

## 📋 Document Overview

This document describes the complete business requirements for the tea e-commerce platform from a user perspective, without technical implementation details. It covers:
- Complete customer journey (step-by-step)
- Complete admin journey (step-by-step)  
- Dynamic customization system
- Subscription orders
- Real-world usage scenarios

---

## PART 1: CUSTOMER REQUIREMENTS & USER FLOW

### Customer Journey Overview
```
Landing Page → Product Selection → Customization → Add to Cart → 
Continue Shopping → View Cart → Place Order → Login/Signup → 
Select Address (with Map) → Payment → Order Confirmation → Track Order
```

---

### STEP 1: Landing Page & Product Browsing

**What Customer Sees:**
- Store logo and name "Sip Time"
- Location selector (currently delivering to: Madurai)
- Search bar
- Cart icon with item count
- Login/Profile button
- Personalized greeting (if logged in): "Good Morning, Jayasuriya!"
- Generic greeting (if not logged in): "Good Morning!"
- Category filters: All, Tea, Coffee, Milk, Shakes
- Product grid showing all available products

**Each Product Card Shows:**
- Product image
- Product name
- Category badge
- Base price
- "Customizable" badge
- Short description
- "Customize" button

**Customer Can:**
- Browse all products
- Filter by category
- Search for specific products
- Click on any product to customize
- View cart contents
- Login/Signup

**Requirements:**
- REQ-C1.1: Show personalized greeting with user's name if logged in
- REQ-C1.2: Display all active products with images and prices
- REQ-C1.3: Category filtering
- REQ-C1.4: Product search functionality
- REQ-C1.5: Cart icon shows current item count
- REQ-C1.6: Location selector visible

---

### STEP 2: Product Customization (Most Important!)

**When Customer Clicks "Customize":**

Opens customization modal/page showing:

**Example for "Hot Masala Tea":**

```
Product: Hot Masala Tea
Base Price: ₹45

1️⃣ Select Quantity (Required)
   ○ 100ml - ₹45
   ● 250ml - ₹60
   ○ 500ml - ₹90
   ○ Custom: [____] ml (enter your own quantity)

2️⃣ Sugar Preference (Required)
   ○ No Sugar
   ● With Sugar
```

**🔥 CONDITIONAL DISPLAY: When "With Sugar" is selected, MORE OPTIONS APPEAR:**

```
   → Which sugar type?
      ○ White Sugar - Free
      ● Brown Sugar - +₹5
      ○ Jaggery - +₹8
      ○ Stevia - +₹10
   
   → How many spoons? 
      Slider: [■■■□□] 3 spoons
```

**Continuing with more customizations:**

```
3️⃣ Temperature (Required)
   ● Hot
   ○ Cold - +₹10
   ○ Lukewarm

4️⃣ Add-ons (Optional - Can select multiple)
   ☑ Extra Ginger - +₹10
   ☑ Cardamom - +₹10
   ☐ Cinnamon - +₹8
   ☐ Honey - +₹15

5️⃣ How often do you want this? (Required)
   ○ One-time (Today only)
   ● Daily Subscription
```

**🔥 DYNAMIC FIELD GENERATION: When "Daily" is selected:**

```
   → How many times per day? [2]
```

**When customer enters "2", TWO TIME INPUT FIELDS APPEAR AUTOMATICALLY:**

```
   → Time 1: [08:00] AM
   → Time 2: [06:00] PM
   → Start Date: [24/01/2025]
   → For how many days? [30] days
```

**If customer changes to "3" times, THREE time fields appear automatically!**

```
6️⃣ Special Instructions (Optional)
   [Extra hot, less foam, etc...]
   _________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Price Calculation:
Base (250ml): ₹60
Brown Sugar: +₹5
Extra Ginger: +₹10
Cardamom: +₹10

Per Order: ₹85
Total Orders: 60 (2 times × 30 days)
Grand Total: ₹5,100

[Add to Cart - ₹5,100]
```

**Customer Actions:**
- Selects from pre-defined options
- Sees new options appear based on selections
- Sees multiple input fields generated automatically based on number entered
- Watches price update in real-time
- Can enter custom values where allowed
- Clicks "Add to Cart"

**Requirements:**
- REQ-C2.1: Display all customization options assigned to this product
- REQ-C2.2: **CONDITIONAL DISPLAY**: Show sub-options only when parent option is selected
  - Example: "Sugar Type" appears only when "With Sugar" is selected
  - Example: "Delivery times" appear only when "Daily" is selected
- REQ-C2.3: **DYNAMIC FIELD GENERATION**: Automatically create multiple input fields based on user's number input
  - Example: If user enters "3" for times per day, show 3 time input fields labeled "Time 1", "Time 2", "Time 3"
- REQ-C2.4: Real-time price calculation as selections change
- REQ-C2.5: For subscriptions, calculate total (price × times per day × number of days)
- REQ-C2.6: Validate required fields
- REQ-C2.7: Show clear labels and descriptions
- REQ-C2.8: Support multiple input types: radio, checkbox, dropdown, number, text, time, date, range slider

---

### STEP 3: Shopping Cart

**What Customer Sees:**
- List of all items added to cart
- For each item:
  - Product image and name
  - All selected customizations clearly displayed
  - For subscriptions: Show frequency and total deliveries
  - Quantity with +/- buttons
  - Individual item total
  - Remove button

**Example Cart Item Display:**
```
🍵 Hot Masala Tea - ₹5,100
   Subscription: Daily for 30 days
   • 250ml, Brown Sugar (3 spoons)
   • Hot, Extra Ginger, Cardamom
   • 2 times/day: 8:00 AM, 6:00 PM
   • 60 total deliveries
   Qty: [−] 1 [+]  [Remove]
```

**Bill Summary:**
```
Subtotal: ₹5,335
Tax (10%): ₹533.50
Delivery: ₹30
Total: ₹5,898.50
```

**Customer Can:**
- View all cart items
- Adjust quantities
- Remove items
- Continue shopping (add more items)
- Proceed to place order

**Requirements:**
- REQ-C3.1: Display all cart items with complete customization details
- REQ-C3.2: For subscriptions, clearly show schedule and total deliveries
- REQ-C3.3: Allow quantity adjustment
- REQ-C3.4: Calculate and display subtotal, tax, delivery, total
- REQ-C3.5: Cart persists across sessions
- REQ-C3.6: "Continue Shopping" and "Place Order" buttons

---

### STEP 4: Login/Registration Check

**When Customer Clicks "Place Order":**

**If NOT logged in:**
Shows login page with:
- Email/Phone input
- Password input
- "Remember me" checkbox
- "Forgot password" link
- "Sign up" link

**If Customer Clicks "Sign Up":**
Shows registration form with:
- Full name
- Email
- Phone number
- Password (with strength indicator)
- Confirm password
- Terms acceptance checkbox
- "Create Account" button

**If ALREADY logged in:**
Skips directly to address selection

**Requirements:**
- REQ-C4.1: Check login status when placing order
- REQ-C4.2: Show login form if not logged in
- REQ-C4.3: Provide registration option
- REQ-C4.4: Validate email format, password strength
- REQ-C4.5: After successful login/signup, proceed to address selection
- REQ-C4.6: Keep cart intact during login process

---

### STEP 5: Delivery Address Selection (WITH MAP!)

**What Customer Sees:**

**Saved Addresses Section:**
```
📍 Saved Addresses

● 🏠 Home
  Jayasuriya | +91 98765 43210
  Aarapalayam-Aruldeepuram Bridge
  Madurai, Tamil Nadu - 625014
  [Edit] [Delete]

○ 💼 Work  
  Jayasuriya | +91 98765 43210
  Tech Park, IT Highway
  Coimbatore, Tamil Nadu - 641004
  [Edit] [Delete]

[+ Add New Address]

Delivery Charge for selected area: ₹30
[Proceed to Payment]
```

**When Customer Clicks "Add New Address":**

Shows TWO OPTIONS:

**OPTION 1: Select on Map (Recommended)**
```
📍 Select Location on Map

[Interactive Map Display]
   • Search location by name
   • Drag pin to exact location
   • [Use My Current Location] button
   
When location is selected on map:
→ City auto-fills: Madurai
→ State auto-fills: Tamil Nadu
→ Postal code auto-fills: 625014
```

**OPTION 2: Enter Manually**
```
━━━━━━ OR Enter Manually ━━━━━━

Full Name: [_________________]
Phone Number: [_________________]
House/Flat Number: [_________________]
Building Name: [_________________]
Street Name: [_________________]
Area/Locality: [_________________]
City: [Madurai] (can edit)
State: [Tamil Nadu] (can edit)
Postal Code: [625014]
Landmark: [________________] (optional)

Address Type:
○ 🏠 Home  ● 💼 Work  ○ 📍 Other

☐ Save as default address

[Save & Continue]
```

**Customer Actions:**
- Select from saved addresses, OR
- Add new address using map (drag pin to location), OR
- Add new address manually
- Choose address type
- Mark as default if desired

**Requirements:**
- REQ-C5.1: Display all saved addresses
- REQ-C5.2: Allow selection of any saved address
- REQ-C5.3: **MAP INTEGRATION**:
  - Interactive map (Google Maps or Mapbox)
  - Search location by name
  - "Use Current Location" button
  - Draggable pin to exact location
  - Auto-fill city, state, postal code from map coordinates
- REQ-C5.4: Manual address entry as alternative
- REQ-C5.5: Validate all required fields
- REQ-C5.6: Calculate delivery charges based on selected location
- REQ-C5.7: Allow editing/deleting saved addresses

---

### STEP 6: Payment & Order Confirmation

**Payment Page Shows:**

**Order Summary:**
```
📦 Order Summary
• Hot Masala Tea (Daily × 30)  ₹5,100
• Filter Coffee (One-time)  ₹75
• Strawberry Shake × 2  ₹160

Subtotal: ₹5,335
CGST (5%): ₹266.75
SGST (5%): ₹266.75
Delivery: ₹30
━━━━━━━━━━━━━━━━━━━━━
Total Payable: ₹5,898.50
```

**Delivery Address:**
```
📍 Delivering To:
🏠 Home - Aarapalayam, Madurai
[Change Address]
```

**Payment Method Selection:**
```
💳 Select Payment Method

● UPI Payment
  [QR Code Display]
  Or enter UPI ID: [yourname@paytm]
  [GPay] [PhonePe] [Paytm] buttons

○ Card Payment
  (Shows when selected)
  Card Number: [____ ____ ____ ____]
  Name: [___________]
  Expiry: [MM/YY]  CVV: [___]
  ☐ Save card for future

○ Cash on Delivery

[Pay Now - ₹5,898.50]
```

**After Successful Payment:**
```
✅ Order Placed Successfully!

Order Number: ORD-20250124-0001

📅 Subscription Details:
• Daily deliveries for 30 days
• 2 times per day: 8:00 AM & 6:00 PM
• Starting: 24 January 2025
• Total: 60 deliveries

🚚 One-time Deliveries:
• Filter Coffee & Strawberry Shake
• Expected Today: 2:00 PM - 3:00 PM

💳 Payment: UPI - Success
Transaction ID: TXN-2025012400123

📧 Confirmation sent to your email & SMS

[Track Order] [View Details] [Continue Shopping]
```

**Requirements:**
- REQ-C6.1: Display complete order summary with bill breakdown
- REQ-C6.2: Show CGST and SGST separately
- REQ-C6.3: Display selected delivery address with change option
- REQ-C6.4: Payment options: UPI (with QR), Card, COD
- REQ-C6.5: Integrate with payment gateway
- REQ-C6.6: Show payment processing status
- REQ-C6.7: After success:
  - Generate unique order number
  - Show subscription details if applicable
  - Display transaction ID
  - Send email and SMS confirmation
  - Provide tracking link

---

### STEP 7: Order Tracking

**What Customer Sees:**
```
Track Order: ORD-20250124-0001

Order Status Timeline:

✅ Order Placed
   24 Jan 2025, 10:30 AM

✅ Payment Confirmed
   24 Jan 2025, 10:31 AM

✅ Preparing Your Order
   24 Jan 2025, 10:45 AM

🔄 Out for Delivery (Current Status)
   24 Jan 2025, 1:30 PM
   Delivery Partner: Ramesh
   Phone: +91 98765 00000
   [Call Delivery Partner]

⏳ Delivered
   Expected: 2:00 PM - 3:00 PM

━━━━━━━━━━━━━━━━━━━━━━

📦 Items: Filter Coffee, Strawberry Shake × 2
📍 Delivering to: Home - Aarapalayam, Madurai
💰 Amount Paid: ₹235

[View Full Details] [Need Help?]
```

**Requirements:**
- REQ-C7.1: Display order status timeline
- REQ-C7.2: Show current status highlighted
- REQ-C7.3: Display delivery partner details when out for delivery
- REQ-C7.4: Real-time status updates
- REQ-C7.5: Push notifications when status changes
- REQ-C7.6: Estimated delivery time

---

### STEP 8: Account & Subscription Management

**My Account Page:**
```
👤 My Profile
Jayasuriya
jayasuriya@example.com
+91 98765 43210
[Edit Profile]

━━━━━━━━━━━━━━━━━━━━━━

📦 My Orders
• ORD-20250124-0001 - Delivered - ₹5,898
• ORD-20250123-0005 - Preparing - ₹60
[View All Orders]

📍 Saved Addresses (2)
[Manage Addresses]

🔔 Active Subscriptions (1)
[View & Manage]

🔒 [Change Password] [Logout]
```

**Subscription Management:**
```
🟢 Active Subscription

Hot Masala Tea - Daily Subscription

Schedule:
• 2 times per day
• 8:00 AM & 6:00 PM

Duration:
• Started: 24 Jan 2025
• Ends: 23 Feb 2025
• Remaining: 25 days (50 deliveries)

Next Delivery: Tomorrow, 8:00 AM

[Pause] [Modify Schedule] [Cancel]

📊 Subscription History
Total deliveries completed: 10 of 60
Remaining value: ₹4,250
```

**Requirements:**
- REQ-C8.1: Display profile information
- REQ-C8.2: Show order history
- REQ-C8.3: Manage saved addresses
- REQ-C8.4: **Subscription Management**:
  - View active subscriptions
  - Show schedule and remaining deliveries
  - Pause subscription
  - Modify schedule (change times)
  - Cancel subscription with refund calculation
- REQ-C8.5: Track subscription delivery history

---

## PART 2: ADMIN REQUIREMENTS & USER FLOW

### Admin Journey Overview
```
Login → Dashboard → Product Management → Create Customizations → 
Order Management → Payment Tracking → Generate Reports → 
Printer Configuration
```

---

### STEP 1: Admin Dashboard

**What Admin Sees After Login:**
```
Sip Time Admin Dashboard
Welcome back, Admin!  [Logout]

━━━━━━━━━━━━━━━━━━━━━━

📊 Today's Overview

┌─────────┐ ┌─────────┐ ┌─────────┐
│ Orders  │ │ Revenue │ │ Pending │
│   45    │ │ ₹12,450 │ │   3     │
└─────────┘ └─────────┘ └─────────┘

📈 Sales Chart (Last 7 Days)
[Bar chart showing daily sales]

🔔 Recent Orders (Live - Auto-refresh)
• ORD-001 - Hot Masala Tea - ₹60 - 2 min ago
• ORD-002 - Filter Coffee - ₹75 - 5 min ago
[View All Orders]

⚠️ Alerts
• Low Stock: Ginger (5 kg remaining)
• Payment Failed: ORD-004

Quick Actions:
[Add Product] [View Orders] [Reports] [Printers]
```

**Requirements:**
- REQ-A1.1: Secure admin login
- REQ-A1.2: Dashboard shows key metrics (orders, revenue, pending)
- REQ-A1.3: Real-time order feed with auto-refresh
- REQ-A1.4: Low stock alerts
- REQ-A1.5: Quick action buttons
- REQ-A1.6: Role-based access (Super Admin, Admin, Manager, Staff)

---

### STEP 2: Product Management

**Adding New Product:**

**Product Form:**
```
Add New Product

📷 Product Images
[Drag & drop or click to upload]
□ □ □ □ (Upload up to 4 images)
(First image will be primary)

📝 Basic Information
Product Name: [Hot Masala Tea]
Category: [Tea ▼]
SKU: [TEA-001] (auto-generated)

Short Description (500 chars):
[Aromatic blend with traditional spices]

Full Description:
[Rich text editor for detailed description]

💰 Pricing & Stock
Base Price: [₹ 45.00]
Stock Quantity: [100] units
Low Stock Alert When: [10] units

🎯 Product Tags
[Bestseller] [Hot] [Traditional] [+ Add Tag]

📅 Availability (Optional)
Available From: [Date] Available To: [Date]

⚡ Status
● Active  ○ Inactive  ○ Out of Stock
☐ Featured Product

[Cancel] [Save Draft] [Save & Publish]
```

**After Saving:**
```
✅ Product "Hot Masala Tea" added successfully!

Next Step: Add Customizations
This product has no customizations yet.
Customers won't be able to customize this product.

[Add Customizations Now] [Skip for Now]
```

**Product List:**
```
All Products  [+ Add New]

Search: [_______] 🔍
Filter: [All ▼] [Active ▼] [Tea ▼]

┌────────────────────────────────┐
│ 🖼️ Hot Masala Tea    TEA-001  │
│ Category: Tea                  │
│ Price: ₹45  Stock: 95  🟢 Active│
│ [Edit] [Duplicate] [Delete]    │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 🖼️ Filter Coffee  COFFEE-001  │
│ Category: Coffee               │
│ Price: ₹60  Stock: 5  ⚠️ Low  │
│ [Edit] [Duplicate] [Delete]    │
└────────────────────────────────┘
```

**Requirements:**
- REQ-A2.1: Product form with all details
- REQ-A2.2: Multiple image upload with drag-and-drop
- REQ-A2.3: Auto-generate SKU
- REQ-A2.4: Rich text editor for description
- REQ-A2.5: Save as draft or publish
- REQ-A2.6: Product listing with search and filters
- REQ-A2.7: Stock status indicators
- REQ-A2.8: Edit, duplicate, delete actions
- REQ-A2.9: Prompt to add customizations after saving

---

### STEP 3: Creating Dynamic Customizations (MOST IMPORTANT!)

This is the core feature that makes the platform flexible!

#### **Creating a Simple Customization Group**

**Step 1: Create Group**
```
Create Customization Group

Group Name: [Sugar Preference]
Description: [Customer can choose sugar options]

Input Type (How customer will select):
○ Single Choice (Radio Buttons)
● Multiple Choice (Checkboxes)
○ Dropdown Menu
○ Number Input
○ Text Input
○ Time Picker
○ Date Picker
○ Range Slider

Behavior:
☑ Required (Customer must select)
☐ Allow Multiple Selections

Display Order: [2] (lower numbers appear first)

[Cancel] [Save & Add Options]
```

**Step 2: Add Options**
```
Add Options to: Sugar Preference

Option 1:
Name: [No Sugar]
Price Modifier: [₹ 0.00]
Display Order: [1]
☐ This option has dependent fields

Option 2:
Name: [With Sugar]
Price Modifier: [₹ 0.00]
Display Order: [2]
☑ This option has dependent fields
   [Configure Dependencies →]

[+ Add More Options]
[Save All Options]
```

#### **Adding Dependent Fields (Conditional Logic)**

**When Admin Clicks "Configure Dependencies":**
```
Dependencies for: "With Sugar"

These fields will appear ONLY when 
customer selects "With Sugar"

━━━━━━ Dependent Field 1 ━━━━━━

Field Type: [Radio Buttons ▼]
Field Name: sugar_type
Field Label: [Which sugar?]
Required: ☑

Options for this field:
• White Sugar - ₹0
• Brown Sugar - +₹5
• Jaggery - +₹8
• Stevia - +₹10
[+ Add Option]

━━━━━━ Dependent Field 2 ━━━━━━

Field Type: [Range Slider ▼]
Field Name: sugar_amount
Field Label: [How many spoons?]
Min Value: [1] Max Value: [5] Default: [2]
Required: ☑

[+ Add More Dependent Fields]
[Save Dependencies]
```

#### **Creating Dynamic Fields (Multiple Inputs)**

**Example: Daily Delivery with Multiple Times**

```
Create Customization Group

Group Name: [Delivery Schedule]
Input Type: ● Single Choice (Radio)
Required: ☑

━━━━━━ Options ━━━━━━

Option 1: [One-time (Today)] - ₹0
☐ Has Dependencies

Option 2: [Daily] - ₹0
☑ Has Dependencies
   ↓ Configure Dependencies:

   Dependent Field 1:
   Type: Number Input
   Label: "How many times per day?"
   Name: times_per_day
   Min: 1, Max: 5, Default: 1
   Required: ☑
   
   ☑ This field generates dynamic fields
      ↓ Dynamic Field Template:
      Type: Time Picker
      Label Template: "Time {index}"
         (Will show as: Time 1, Time 2, Time 3...)
      Name Template: "delivery_time_{index}"
      Generate: [times_per_day] number of fields
      Required: ☑
   
   Dependent Field 2:
   Type: Date Picker
   Label: "Start Date"
   Name: start_date
   Min: Today
   Required: ☑
   
   Dependent Field 3:
   Type: Number Input
   Label: "Duration (days)"
   Name: duration_days
   Min: 1, Max: 365, Default: 30
   Required: ☑

Option 3: [Weekly] - ₹0
☑ Has Dependencies
   ↓ Configure Dependencies:
   
   Dependent Field 1:
   Type: Multiple Choice (Checkboxes)
   Label: "Select Days"
   Options: Mon, Tue, Wed, Thu, Fri, Sat, Sun
   Required: ☑
   
   Dependent Field 2:
   Type: Time Picker
   Label: "Delivery Time"
   Required: ☑

[Preview Customization Flow]
[Save Customization]
```

#### **How It Appears to Customer**

When customer sees this customization:

```
5️⃣ Delivery Schedule (Required)
   ○ One-time (Today)
   ● Daily

   (Because "Daily" is selected, these appear:)
   
   → How many times per day? [2]
   
   (Customer entered "2", so TWO time fields appear:)
   
   → Time 1: [08:00] AM
   → Time 2: [06:00] PM
   → Start Date: [24/01/2025]
   → Duration (days): [30]
```

**If customer changes to "3" times:**
```
   → How many times per day? [3]
   
   (Now THREE time fields appear automatically:)
   
   → Time 1: [08:00] AM
   → Time 2: [01:00] PM
   → Time 3: [06:00] PM
```

#### **Assigning Customizations to Products**

```
Edit Product: Hot Masala Tea

[Basic Info] [Images] [Customizations] [SEO]
                      ↑ Selected Tab

Available Customizations:
(Select which apply to this product)

☑ Quantity (Required)
   Display Order: [1]

☑ Sugar Preference (Required)
   Display Order: [2]

☑ Temperature (Required)
   Display Order: [3]

☑ Add-ons (Optional)
   Display Order: [4]

☑ Delivery Schedule (Required)
   Display Order: [5]

☐ Milk Type (Optional)

[Preview on Customer Page]
[Save Changes]
```

**Requirements:**
- REQ-A3.1: Create customization groups with various input types
- REQ-A3.2: Add options to groups with price modifiers
- REQ-A3.3: **Conditional Logic**: Configure dependent fields that appear only when specific option is selected
- REQ-A3.4: **Dynamic Field Generation**: Set up fields that create multiple inputs based on user's number input
  - System automatically generates the correct number of fields
  - Field labels use template (Time {index} → Time 1, Time 2, etc.)
- REQ-A3.5: Support nested dependencies (3+ levels)
- REQ-A3.6: Preview customization flow before publishing
- REQ-A3.7: Assign customizations to specific products
- REQ-A3.8: Set display order
- REQ-A3.9: Mark as required or optional
- REQ-A3.10: Edit/delete customizations

---

### STEP 4: Order Management

**Order List:**
```
Orders Management

Search: [Order ID, Customer] 🔍
Filter: [All ▼] [Today ▼] [UPI ▼]

┌──────────────────────────────────┐
│ ORD-20250124-0001  🔄 Preparing  │
│ Jayasuriya | +91 98765 43210    │
│ 10:30 AM | 3 items | ₹5,898.50  │
│ Payment: ✅ UPI Paid             │
│                                  │
│ Update Status: [Preparing ▼]    │
│ [Update] [View Details]          │
│ [Print Kitchen] [Print Customer] │
└──────────────────────────────────┘

[New Orders: 5] Auto-refresh every 10 sec
```

**Order Details:**
```
Order Details: ORD-20250124-0001

👤 Customer
Jayasuriya | +91 98765 43210
jayasuriya@example.com

📦 Order Items

1. Hot Masala Tea (Daily × 30 days)
   • 250ml, Brown Sugar (3 spoons)
   • Hot, Extra Ginger, Cardamom
   • Schedule: 8:00 AM & 6:00 PM
   • Subscription: 60 deliveries
   Qty: 1 × ₹85 × 60 = ₹5,100

2. Filter Coffee (One-time)
   • Large, Less Sugar, Hot
   Qty: 1 × ₹75 = ₹75

3. Strawberry Shake (One-time)
   • Medium, Normal Sugar, Cold
   Qty: 2 × ₹80 = ₹160

💰 Payment
Subtotal: ₹5,335
CGST: ₹266.75
SGST: ₹266.75
Delivery: ₹30
Total: ₹5,898.50
Method: UPI
Transaction ID: TXN-2025012400123
Status: ✅ Success

📍 Delivery Address
Home - Aarapalayam, Madurai - 625014

📊 Order Timeline
✅ Order Placed - 10:30 AM
✅ Payment Confirmed - 10:31 AM
🔄 Preparing - 10:45 AM
⏳ Out for Delivery - Pending
⏳ Delivered - Pending

💬 Internal Notes
[Customer prefers extra hot]
[Add Note]

Actions:
[Update Status] [Assign Delivery Partner]
[Print Receipts] [Refund] [Cancel]
[Notify Customer]
```

**Requirements:**
- REQ-A4.1: Real-time order list with auto-refresh
- REQ-A4.2: Show order summary (number, customer, time, amount, status)
- REQ-A4.3: Filter by status, date, payment method
- REQ-A4.4: Search by order number or customer
- REQ-A4.5: Order details showing:
  - Complete customer info
  - All items with full customization details
  - For subscriptions: Schedule, frequency, total deliveries
  - Payment breakdown with CGST/SGST
  - Delivery address
  - Order timeline
- REQ-A4.6: Quick status update
- REQ-A4.7: Print receipts (kitchen, customer, delivery)
- REQ-A4.8: Add internal notes
- REQ-A4.9: Audio/visual alert for new orders
- REQ-A4.10: Manual order creation

---

### STEP 5: Payment History

```
Payment History

Filter: [All Time ▼] [All Methods ▼]
Search: [Transaction ID] 🔍

┌──────────────────────────────────┐
│ TXN-2025012400123   ✅ Success   │
│ Order: ORD-20250124-0001         │
│ Customer: Jayasuriya             │
│ Amount: ₹5,898.50                │
│ Method: UPI | Gateway: Razorpay  │
│ Time: 24 Jan, 10:31 AM           │
│ [View Details] [Download Receipt]│
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ TXN-2025012400124   ❌ Failed    │
│ Order: ORD-20250124-0002         │
│ Customer: Priya Kumar            │
│ Amount: ₹150                     │
│ Method: Card                     │
│ Error: Insufficient Funds        │
│ [Retry] [Contact Customer]       │
└──────────────────────────────────┐

Summary:
Total: 150 transactions
Successful: 142 (₹1,24,500)
Failed: 5 (₹850)
Refunded: 3 (₹270)

[Export Report]
```

**Requirements:**
- REQ-A5.1: List all payment transactions
- REQ-A5.2: Show transaction details (ID, order, customer, amount, method, status)
- REQ-A5.3: Filter by date, status, payment method
- REQ-A5.4: Search by transaction ID
- REQ-A5.5: Payment details view with gateway response
- REQ-A5.6: Process refunds with reason
- REQ-A5.7: Retry failed payments
- REQ-A5.8: Export payment data
- REQ-A5.9: Payment summary statistics

---

### STEP 6: Reports & Analytics

#### **Day-wise Order Report**

```
Order Reports - Day Wise

Select Date: [24 January 2025 📅]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary for 24 January 2025

┌─────────┐ ┌─────────┐ ┌─────────┐
│ Orders  │ │ Revenue │ │ Average │
│   45    │ │ ₹12,450 │ │   ₹277  │
└─────────┘ └─────────┘ └─────────┘

📈 Orders by Hour [Bar Chart]
Peak: 10:00 AM (12 orders)

📋 Status Breakdown
• Delivered: 38 (84%)
• Out for Delivery: 5 (11%)
• Preparing: 2 (4%)

💳 Payment Methods
• UPI: 28 orders (₹7,840) - 62%
• Card: 12 orders (₹3,360) - 27%
• COD: 5 orders (₹1,250) - 11%

🏆 Top 5 Products
1. Hot Masala Tea - 18 orders (₹2,700)
2. Filter Coffee - 12 orders (₹1,800)
3. Cold Coffee - 8 orders (₹1,440)

📍 Delivery Zones
• Zone 1: 25 orders (₹6,975)
• Zone 2: 12 orders (₹3,348)

[Download PDF] [Download Excel]
```

#### **Month-wise Order Report**

```
Order Reports - Month Wise

Select: [January ▼] [2025 ▼]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary for January 2025

┌─────────┐ ┌─────────┐ ┌─────────┐
│ Orders  │ │ Revenue │ │ Avg/Day │
│  1,245  │ │₹3,45,600│ │   55    │
└─────────┘ └─────────┘ └─────────┘

📈 Daily Trend [Line Chart]

📊 Week-wise Breakdown
Week 1: 289 orders (₹80,472)
Week 2: 312 orders (₹86,736)
Week 3: 298 orders (₹82,894)
Week 4: 315 orders (₹87,570)

🏆 Top 10 Products
1. Hot Masala Tea - 458 orders
2. Filter Coffee - 387 orders
...

📅 Best Day: 18 Jan (68 orders)
📅 Slowest Day: 5 Jan (38 orders)

💰 Growth: +12.5% vs December

[Download PDF] [Download Excel]
```

#### **Custom Range Order Report**

```
Order Reports - Custom Range

From: [01/01/2025 📅]
To: [24/01/2025 📅]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary: 01-24 Jan (24 days)

┌─────────┐ ┌─────────┐ ┌─────────┐
│ Orders  │ │ Revenue │ │ Avg/Day │
│  1,245  │ │₹3,45,600│ │   52    │
└─────────┘ └─────────┘ └─────────┘

🎯 Category Performance
• Tea: 612 orders (₹1,65,240) - 49%
• Coffee: 398 orders (₹1,07,460) - 32%
• Shakes: 156 orders (₹49,920) - 13%
• Milk: 79 orders (₹22,980) - 6%

📊 Customer Analysis
• New: 145
• Returning: 312
• Repeat Rate: 68%

⏰ Peak Hours
• Morning (6-10): 468 orders (38%)
• Afternoon (12-2): 289 orders (23%)
• Evening (4-8): 412 orders (33%)

[Download PDF] [Download Excel]
```

#### **Day-wise Revenue Report**

```
Revenue Reports - Day Wise

Select Date: [24 January 2025 📅]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Revenue - 24 January 2025

Gross Revenue:      ₹12,450.00
- Refunds:              ₹0.00
Net Revenue:        ₹12,450.00

Tax Collected:
• CGST (5%):         ₹1,122.50
• SGST (5%):         ₹1,122.50
Total Tax:           ₹2,245.00

Delivery Charges:    ₹1,350.00
Discounts:              ₹0.00

💳 By Payment Method
• UPI: ₹7,840 (63%)
• Card: ₹3,360 (27%)
• COD: ₹1,250 (10%)

📦 By Category
• Tea: ₹6,120 (49%)
• Coffee: ₹3,984 (32%)
• Shakes: ₹1,872 (15%)
• Milk: ₹474 (4%)

⏰ By Hour [Bar Chart]
Peak: 10 AM (₹2,450)

[Download PDF] [Download Excel]
```

#### **Month-wise Revenue Report**

```
Revenue Reports - Month Wise

Select: [January ▼] [2025 ▼]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Revenue - January 2025

Gross Revenue:    ₹3,45,600.00
- Refunds:          -₹2,450.00
Net Revenue:      ₹3,43,150.00

Total Tax:         ₹31,090.91
Delivery Charges:  ₹37,350.00
Discounts:         -₹8,920.00

Avg Order Value:       ₹277.55
Avg Daily Revenue: ₹11,134.84

📈 Daily Trend [Line Chart]

📊 Week-wise
Week 1: ₹80,472
Week 2: ₹86,736 (+7.8%)
Week 3: ₹82,894 (-4.4%)
Week 4: ₹87,570 (+5.6%)

💳 Payment Breakdown
• UPI: ₹2,17,728 (63%)
• Card: ₹93,312 (27%)
• COD: ₹34,560 (10%)

📦 Category Revenue
• Tea: ₹1,69,362 (49%)
• Coffee: ₹1,10,592 (32%)
• Shakes: ₹51,840 (15%)
• Milk: ₹13,806 (4%)

📈 Growth
vs Dec 2024: +12.5%
vs Jan 2024: +28.7%

[Download PDF] [Download Excel]
```

#### **Custom Range Revenue Report**

```
Revenue Reports - Custom Range

From: [01/01/2025 📅]
To: [24/01/2025 📅]
[Generate Report]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Revenue: 01-24 Jan (24 days)

Gross Revenue:    ₹3,45,600.00
Net Revenue:      ₹3,43,150.00
Total Tax:         ₹31,090.91
Avg Daily:         ₹14,298.33

📊 Revenue Breakdown
Product Sales: ₹3,08,250 (90%)
Delivery: ₹37,350 (10%)

💸 Profit Analysis
Cost of Goods: ₹1,38,240
Delivery Costs: ₹24,900
Net Profit: ₹1,80,010
Margin: 52.4%

🎯 By Product (Top 10)
1. Hot Masala Tea: ₹62,280
2. Filter Coffee: ₹43,470
3. Cold Coffee: ₹28,800

📍 By Zone
Zone 1: ₹1,94,580 (57%)
Zone 2: ₹96,000 (28%)
Zone 3: ₹52,570 (15%)

[Download PDF] [Download Excel] [Email]
```

**Requirements:**
- REQ-A6.1: Day-wise order reports with all metrics
- REQ-A6.2: Month-wise order reports with trends
- REQ-A6.3: Custom date range order reports
- REQ-A6.4: Day-wise revenue reports with breakdown
- REQ-A6.5: Month-wise revenue reports with growth
- REQ-A6.6: Custom range revenue reports with profit
- REQ-A6.7: Visual charts (bar, line, pie)
- REQ-A6.8: Export to PDF and Excel
- REQ-A6.9: Email reports option
- REQ-A6.10: Scheduled auto-generation

---

### STEP 7: POS Printer Management

```
Printer Management

Active Printers

┌──────────────────────────────────┐
│ Kitchen Printer      🟢 Active   │
│ Type: Network (TCP/IP)           │
│ IP: 192.168.1.100  Port: 9100   │
│ Template: Kitchen Receipt        │
│ Auto-print: ✓  Copies: 2        │
│ Last: 2 mins ago                 │
│ [Test] [Edit] [Disable]          │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Counter Printer      🟢 Active   │
│ Type: USB                        │
│ Port: /dev/usb/lp0               │
│ Template: Customer Receipt       │
│ Auto-print: ✓  Copies: 1        │
│ Last: 5 mins ago                 │
│ [Test] [Edit] [Disable]          │
└──────────────────────────────────┘

[+ Add New Printer]

Print Settings:
☑ Auto-print on order placement
☑ Print kitchen receipt
☑ Print customer receipt
☐ Print delivery receipt
[Save Settings]
```

**Add Printer:**
```
Add New Printer

Printer Name: [Kitchen Printer 2]

Printer Type:
● Network (TCP/IP)
○ USB
○ Bluetooth

IP Address: [192.168.1.101]
Port: [9100]

Paper Width: [80mm ▼]
Print Template: [Kitchen Receipt ▼]
Auto-print: ☑
Copies: [2]

[Test Connection] [Save]
```

**What Gets Printed (Kitchen Receipt):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SIP TIME
  Premium Tea & Beverages
  123 Main Road, Madurai
  Phone: +91 98765 43210
━━━━━━━━━━━━━━━━━━━━━━━━━━━
    KITCHEN ORDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order #: ORD-20250124-0001
Time: 24 Jan, 10:30 AM

──────────────────────────────

1. HOT MASALA TEA
   • 250ml
   • Brown Sugar (3 spoons)
   • HOT
   • Extra Ginger
   • Extra Cardamom
   
   Special: Extra hot

2. FILTER COFFEE
   • Large (500ml)
   • Less Sugar
   • HOT

3. STRAWBERRY SHAKE x2
   • Medium
   • Normal Sugar
   • COLD

──────────────────────────────

TOTAL ITEMS: 4

━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PREPARE WITH CARE ❤️
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Customer Receipt:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
        SIP TIME
  Premium Tea & Beverages
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order #: ORD-20250124-0001
Date: 24 Jan 2025, 10:30 AM
Customer: Jayasuriya

──────────────────────────────

Hot Masala Tea (250ml)  ₹60.00
Filter Coffee (Large)   ₹75.00
Strawberry Shake x2    ₹160.00

──────────────────────────────

Subtotal:             ₹295.00
CGST (5%):             ₹14.75
SGST (5%):             ₹14.75
Delivery:              ₹30.00
──────────────────────────────
TOTAL:                ₹354.50

Payment: UPI - Success
Transaction: TXN-2025012400123

━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Thank you! Visit again!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Requirements:**
- REQ-A7.1: Configure multiple printers
- REQ-A7.2: Support network (TCP/IP), USB, Bluetooth printers
- REQ-A7.3: Different templates: Kitchen, Customer, Delivery
- REQ-A7.4: Auto-print on order placement
- REQ-A7.5: Configure number of copies
- REQ-A7.6: Test print function
- REQ-A7.7: Manual reprint option
- REQ-A7.8: Print queue management
- REQ-A7.9: Error handling and retry
- REQ-A7.10: ESC/POS command support

---

## PART 3: Real-World Usage Scenarios

### Scenario 1: Simple Tea Order
```
Customer Journey:
1. Browse products → Click "Hot Masala Tea"
2. Customize:
   - Size: Medium (250ml)
   - Sugar: With Sugar → Brown Sugar (3 spoons)
   - Temperature: Hot
   - Add-ons: Extra Ginger
3. Add to cart (₹75)
4. Place order → Login → Select home address
5. Pay with UPI → Order confirmed
6. Receive tea in 30 minutes
```

### Scenario 2: Daily Subscription Order
```
Customer Journey:
1. Click "Hot Masala Tea" → Customize
2. Selections:
   - Size: 250ml
   - Sugar: With Sugar → Brown Sugar (3 spoons)
   - Temperature: Hot
   - Delivery: Daily
     → Times per day: 2
     → Time 1: 08:00 AM
     → Time 2: 06:00 PM
     → Start: Tomorrow
     → Duration: 30 days
3. Add to cart (₹85 × 2 × 30 = ₹5,100)
4. Place order → Login → Confirm address
5. Pay ₹5,100 → Subscription activated
6. Receive tea daily at 8 AM and 6 PM for 30 days

Managing Subscription:
- View in account
- Pause for vacation
- Modify times (change 6 PM to 7 PM)
- Cancel anytime (refund remaining value)
```

### Scenario 3: Admin Creates New Customization
```
Admin Task: Add "Extra Shot" customization for coffee

1. Go to Customizations → Create Group
   - Name: "Extra Shots"
   - Type: Single Choice (Radio)
   - Required: No

2. Add Options:
   - No Extra Shot - ₹0
   - Single Shot - +₹20
   - Double Shot - +₹40

3. Assign to Products:
   - Filter Coffee ✓
   - Cold Coffee ✓
   - Cappuccino ✓

4. Save & Preview

Result: Now customers see "Extra Shots" option 
when ordering coffee!
```

### Scenario 4: Admin Creates Complex Customization
```
Admin Task: Add "Weekly Subscription" option

1. Create Group: "Delivery Schedule"
   - Type: Single Choice

2. Add Option: "Weekly"
   - Has Dependencies: Yes
   
3. Configure Dependencies:
   a) Field: "Select Days"
      - Type: Multiple Choice (Checkboxes)
      - Options: Mon, Tue, Wed, Thu, Fri, Sat, Sun
   
   b) Field: "Delivery Time"
      - Type: Time Picker
   
   c) Field: "Duration"
      - Type: Number Input
      - Label: "For how many weeks?"

4. Assign to all products

Result: Customers can now order weekly deliveries 
by selecting specific days!
```

---

## Summary of Key Features

### For Customers:
1. ✅ Browse and search products
2. ✅ Fully customizable products with conditional options
3. ✅ Dynamic field generation based on selections
4. ✅ Add multiple products to cart
5. ✅ Subscription orders (daily/weekly)
6. ✅ Map-based address selection
7. ✅ Multiple payment methods (UPI, Card, COD)
8. ✅ Real-time order tracking
9. ✅ Manage subscriptions (pause, modify, cancel)
10. ✅ Order history

### For Admins:
1. ✅ Add/edit/delete products easily
2. ✅ Create ANY type of customization dynamically
3. ✅ Set up conditional logic (show/hide fields)
4. ✅ Configure dynamic field generation
5. ✅ View orders in real-time
6. ✅ Track payment history
7. ✅ Generate comprehensive reports (day/month/custom)
8. ✅ Auto-print receipts via POS printers
9. ✅ Manage subscriptions
10. ✅ Full analytics and insights

### Unique Selling Points:
1. 🔥 **100% Dynamic Customization** - Admin can create any customization without code changes
2. 🔥 **Conditional Fields** - Options appear/disappear based on selections
3. 🔥 **Dynamic Field Generation** - System creates multiple inputs automatically
4. 🔥 **Subscription Support** - Daily/weekly deliveries with multiple times
5. 🔥 **Map Integration** - Pin exact delivery location
6. 🔥 **Comprehensive Reports** - Day/month/custom range with all metrics
7. 🔥 **Real-time Everything** - Orders, tracking, printing

---

## End of Requirements Document

This document covers all business requirements without technical implementation details. It focuses on WHAT the system does, not HOW it does it.

Total Pages: User Flow (8 steps) + Admin Flow (7 steps) + Scenarios = Complete Platform

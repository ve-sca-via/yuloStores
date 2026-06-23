

**PRODUCT REQUIREMENT DOCUMENT**

**Restaurant QR Ordering &**  
**Customer Engagement Platform**

Detailed Current-Scope PRD for Customer App, QR Ordering, Chef Portal, Waiter Portal, Manager Portal, Owner Panel and Admin Portal

|  |  |
| :---- | :---- |
|  |  |

| Important Note Some screens, field names, flows, labels, and minor functional details may change during execution based on practical restaurant operations, user feedback, and technical feasibility. Such changes will be managed, aligned, and documented while keeping the approved core product objective intact. |
| :---- |

# **Contents**

* 1\. Product Overview  
* 2\. Business Objective and Current Goals  
* 3\. User Roles and Personas  
* 4\. Current Product Scope  
* 5\. Customer Application Requirements  
* 6\. QR Ordering System Requirements  
* 7\. OTP Authentication Requirements  
* 8\. Menu, Cart and Ordering Requirements  
* 9\. Order Lifecycle and Status Rules  
* 10\. Chef Portal Requirements  
* 11\. Waiter Portal Requirements  
* 12\. Manager Portal Requirements  
* 13\. Restaurant Owner Panel Requirements  
* 14\. Platform Admin Portal Requirements  
* 15\. Role-Based Access Control  
* 16\. Table and Counter Management  
* 17\. Offer and Instant Offer System  
* 18\. Notifications and Alerts  
* 19\. Data Requirements  
* 20\. Security and Privacy Requirements  
* 21\. Non-Functional Requirements  
* 22\. Edge Cases and Error Handling  
* 23\. Screen-Level Checklist  
* 24\. Final Acceptance Criteria

# **1\. Product Overview**

The Restaurant QR Ordering & Customer Engagement Platform is a digital ordering system for restaurants, cafes, food courts, canteens, cloud kitchens, and dine-in food businesses. It allows customers to scan a QR code, verify themselves using mobile OTP, browse a restaurant-specific menu, add items to cart, place orders, and track the order status from their mobile browser.

The platform also includes operational portals for restaurant teams. The Chef Portal supports kitchen preparation, the Waiter Portal supports table service, the Manager Portal controls day-to-day operations, the Restaurant Owner Panel manages business-level settings, and the Platform Admin Portal manages restaurants, users, roles, offers, and system-level operations.

The current PRD focuses only on the product requirements required to launch a complete operational restaurant QR ordering system.

| Primary Product | QR-based restaurant ordering and customer engagement platform. |
| :---- | :---- |
| **Primary Interface** | Mobile-friendly web application for customers and web portals for restaurant staff. |
| **Core Value** | Reduce manual order-taking, improve speed of service, capture verified customer data, and centralize restaurant operations. |
| **Primary Restaurant Workflow** | Customer scan \-\> OTP verification \-\> menu browsing \-\> cart \-\> order \-\> kitchen preparation \-\> waiter service \-\> completion. |
| **Operational Users** | Chef, Waiter, Manager, Restaurant Owner, Platform Admin. |

# **2\. Business Objective and Current Goals**

The platform is intended to help restaurants move from manual ordering to a structured digital flow while still supporting real-world restaurant operations. It is especially useful for restaurants that want QR-based ordering without depending only on third-party food delivery platforms.

## **2.1 Current Business Goals**

* Enable restaurant-specific QR ordering for tables, counters, and customer access points.  
* Allow customers to place orders directly from their phones using a simple mobile-first interface.  
* Capture verified customer mobile numbers through OTP-based authentication.  
* Provide real-time order visibility to restaurant staff and kitchen teams.  
* Allow chefs to manage preparation status and waiters to manage serving status.  
* Allow managers to control live operations, tables, staff, orders, and menu availability.  
* Allow restaurant owners to manage menus, offers, profile information, and order visibility.  
* Allow platform admins to control restaurants, users, staff roles, offers, QR setup, and operational monitoring.

## **2.2 Success Outcomes for Current Version**

* A customer can scan a QR code and place an order without needing app installation.  
* Restaurant staff can receive, prepare, serve, and complete orders through proper role-based portals.  
* Restaurant managers can monitor live restaurant activity from a single operational dashboard.  
* Restaurant owners can manage business-level menu and offer configuration.  
* Platform admins can onboard and control restaurants from a centralized admin portal.  
* The order flow is reliable and prevents unauthorized access, duplicate submissions, and data leakage across restaurants.

# **3\. User Roles and Personas**

| Role | Purpose |
| :---- | :---- |
| Customer | Restaurant visitor or online user who scans QR, verifies mobile number, browses menu, places orders, views offers, and tracks order status. |
| Chef / Kitchen Staff | Kitchen user who receives incoming orders, views item instructions, updates preparation status, marks items or orders ready, and reports unavailable items. |
| Waiter | Service staff who views assigned tables, monitors ready orders, handles customer requests, places manual orders when needed, and marks orders served. |
| Manager | Restaurant operations controller who monitors live orders, tables, staff, menu availability, customer requests, and day-to-day restaurant workflow. |
| Restaurant Owner | Business owner who manages restaurant profile, menu, offers, staff access, and order visibility. |
| Platform Admin | Platform operator who manages restaurants, platform users, staff roles, QR configuration, offers, and overall system operations. |

## **3.1 Role Design Principle**

Each role must see only the actions and information required to perform its job. For example, chefs should see kitchen order details but should not manage pricing or customer personal information beyond what is required for the order. Waiters should see assigned tables and serving actions but should not access platform-level configuration.

# **4\. Current Product Scope**

## **4.1 Included Current Modules**

* Customer web application with OTP login, restaurant listing, restaurant menu, cart, order placement, order tracking, offers, and profile/order history.  
* QR ordering system with restaurant-level, table-level, counter-level, and campaign/offer QR support.  
* OTP authentication for customer verification and session persistence.  
* Menu and cart system with categories, item details, availability, customer instructions, and item quantity handling.  
* Restaurant Owner Panel for profile, menu, order visibility, offers, and staff overview.  
* Manager Portal for live operations, table management, staff management, menu availability, order control, and instant offer control.  
* Waiter Portal for assigned tables, ready orders, customer requests, manual order support, and serving workflow.  
* Chef Portal for kitchen order view, item-level preparation status, ready status, and item unavailable reporting.  
* Platform Admin Portal for restaurant management, user management, staff/role management, QR management, offer monitoring, and system settings.  
* Role-based access control, notifications, basic reporting, audit logs, and current product acceptance criteria.

## **4.2 Scope Boundaries**

This PRD intentionally avoids commercial terms, client-specific information, agreement dates, payment terms, maintenance commitments, and future roadmap items. It describes only the current product requirements needed for the restaurant QR ordering platform.

# **5\. Customer Application Requirements**

The customer application must be mobile-first because most users will access it by scanning a QR code from a restaurant table, counter, packaging material, or restaurant link. The customer should be able to complete the full ordering journey without installing a native mobile app.

## **5.1 Customer Journey**

### **Customer QR Ordering Flow**

| Step | System Behavior |
| :---- | :---- |
| 1 | Customer scans a QR code from table, counter, packaging, or restaurant material. |
| 2 | System identifies the restaurant and the QR context such as table number or counter. |
| 3 | If the customer is not logged in, the system asks for mobile number and OTP verification. |
| 4 | After verification, the customer lands on the restaurant-specific menu page. |
| 5 | Customer browses categories, item details, pricing, availability, and offers. |
| 6 | Customer adds items to cart, updates quantity, and adds instructions if needed. |
| 7 | Customer reviews cart, table/counter context, total amount, and applicable offer details. |
| 8 | Customer places the order and receives order confirmation. |
| 9 | Customer tracks order status until the order is served or completed. |

## **5.2 Customer Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| CUST-01 | Customer can open the restaurant menu through QR scan or restaurant-specific link. | Must | Correct restaurant page opens and the QR context is retained. |
| CUST-02 | Customer can sign up or login using mobile number and OTP. | Must | Customer can proceed only after successful OTP verification. |
| CUST-03 | Customer can view restaurant name, status, timing, and basic information. | Must | Restaurant information is visible on the restaurant landing/menu page. |
| CUST-04 | Customer can browse menu categories and items. | Must | Categories and items load correctly with item names, prices, and availability. |
| CUST-05 | Customer can search menu items and filter by category. | Should | Search and category filter return relevant available items. |
| CUST-06 | Customer can add, remove, and update cart item quantities. | Must | Cart totals update accurately after every action. |
| CUST-07 | Customer can add item-level instructions. | Should | Instructions are visible to restaurant staff and chef where needed. |
| CUST-08 | Customer can place a dine-in, counter, or takeaway order based on restaurant configuration. | Must | Order is created with correct order type and restaurant mapping. |
| CUST-09 | Customer can view order confirmation and order status. | Must | Order status updates reflect restaurant actions. |
| CUST-10 | Customer can view active restaurant offers and eligible instant offers. | Should | Only active and applicable offers appear to the customer. |
| CUST-11 | Customer can view basic order history after login. | Should | Customer can see previous orders linked with the verified mobile number. |

## **5.3 Customer Screens**

* Mobile number login screen  
* OTP verification screen  
* Restaurant landing/menu screen  
* Category and item listing screen  
* Item detail view  
* Cart screen  
* Order confirmation screen  
* Live order status screen  
* Offers screen  
* Customer profile and order history screen

# **6\. QR Ordering System Requirements**

The QR system is the entry point of the product. It must uniquely identify the restaurant and optionally identify table, counter, takeaway, or campaign context. The system should ensure that an active QR always opens the correct restaurant flow.

## **6.1 Supported QR Types**

| QR Type | Behavior |
| :---- | :---- |
| Restaurant QR | Opens the general restaurant menu without table mapping. |
| Table QR | Opens the restaurant menu and automatically maps the order to a table. |
| Counter QR | Opens the restaurant ordering flow for counter-based or takeaway ordering. |
| Packaging QR | Opens restaurant page, menu, or offer page based on configuration. |
| Campaign / Offer QR | Opens a configured offer or restaurant promotion page while retaining restaurant context. |

## **6.2 QR Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| QR-01 | System can generate unique QR codes for every restaurant. | Must | Each generated QR contains a unique identifier mapped to one restaurant. |
| QR-02 | System can generate table-wise QR codes. | Must | Scanning table QR automatically maps table number to the order. |
| QR-03 | Restaurant owner/manager/admin can download QR codes. | Must | QR can be downloaded in a printable format. |
| QR-04 | QR codes can be activated or deactivated. | Must | Inactive QR does not allow ordering and shows a clear message. |
| QR-05 | QR scan should retain context through OTP verification. | Must | After OTP login, customer returns to same restaurant/table flow. |
| QR-06 | System can track QR scan source for basic operational visibility. | Should | QR scan logs store QR ID, restaurant ID, and timestamp. |

## **6.3 QR Validation Rules**

* QR must not expose internal database IDs directly to customers.  
* QR URL must validate restaurant status before allowing orders.  
* QR context must not be editable by customer from browser URL in a way that breaks authorization.  
* Inactive restaurant, inactive table, or inactive QR must show user-friendly messages.  
* QR should work from mobile browsers without native app dependency.

# **7\. OTP Authentication Requirements**

OTP authentication verifies customer mobile numbers before allowing ordering or customer data capture. The flow should be simple and safe because restaurant users may not be technically advanced.

## **7.1 OTP Flow**

### **Customer OTP Verification Flow**

| Step | System Behavior |
| :---- | :---- |
| 1 | Customer enters mobile number. |
| 2 | System validates mobile number format. |
| 3 | System sends OTP through configured OTP provider. |
| 4 | Customer enters OTP. |
| 5 | System validates OTP, expiry, and attempt count. |
| 6 | On successful verification, customer session is created or refreshed. |
| 7 | Customer is redirected to the original QR/menu/cart flow. |

## **7.2 OTP Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| AUTH-01 | System supports mobile-number based signup and login for customers. | Must | New and returning customers can authenticate through OTP. |
| AUTH-02 | OTP expires after configured time. | Must | Expired OTP cannot be used. |
| AUTH-03 | System supports resend OTP with cooldown. | Must | Customer cannot repeatedly spam OTP requests. |
| AUTH-04 | System limits wrong OTP attempts. | Must | Too many failed attempts temporarily block verification. |
| AUTH-05 | Verified customer session persists for configured duration. | Should | Customer does not need OTP repeatedly in the same session. |
| AUTH-06 | OTP errors are user-friendly. | Must | Customer sees clear messages for wrong OTP, expired OTP, resend limit, and provider failure. |

## **7.3 OTP Edge Handling**

* If OTP sending fails, customer should see retry option without losing restaurant context.  
* If customer refreshes during OTP flow, QR context should remain available.  
* If customer scans another QR while logged in, the system should switch to the new restaurant/table context after validation.  
* If mobile number already exists, system should login the customer instead of creating duplicate record.

# **8\. Menu, Cart and Ordering Requirements**

## **8.1 Menu Management Customer View**

The customer-facing menu must be clean, fast, and easy to use. Each item should provide enough information for the customer to decide quickly while keeping the ordering flow short.

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| MENU-01 | Menu shows item name, price, category, description, image, and availability. | Must | Customer can understand the item before adding it to cart. |
| MENU-02 | Menu supports category-based browsing. | Must | Customer can open category and view relevant items. |
| MENU-03 | Unavailable items cannot be ordered. | Must | Unavailable item is visually marked and add-to-cart is disabled. |
| MENU-04 | Menu supports veg/non-veg indicator where configured. | Should | Indicator is visible on item card or item details. |
| MENU-05 | Menu supports item tags such as popular or recommended where configured. | Could | Configured tags appear on menu item cards. |

## **8.2 Cart Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| CART-01 | Customer can add item to cart from menu. | Must | Selected item appears in cart with quantity one. |
| CART-02 | Customer can update item quantity. | Must | Item quantity and totals update correctly. |
| CART-03 | Customer can remove item from cart. | Must | Removed item is no longer included in cart total. |
| CART-04 | Customer can add special instructions. | Should | Instructions are stored with item/order and visible to kitchen/service staff. |
| CART-05 | Cart validates availability before checkout. | Must | System prevents order if item became unavailable. |
| CART-06 | Offer discount, if applicable, is visible before order placement. | Should | Customer sees discount and final payable amount before confirming order. |

## **8.3 Order Placement Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| ORD-01 | Customer can place order after OTP verification. | Must | Order is created only for verified customer session. |
| ORD-02 | Order must be mapped to restaurant and QR context. | Must | Order stores restaurant ID and table/counter/takeaway context. |
| ORD-03 | Duplicate order prevention must be applied. | Must | Double-clicking submit does not create duplicate orders. |
| ORD-04 | Customer receives order confirmation. | Must | Confirmation screen shows order ID and current status. |
| ORD-05 | Restaurant portals receive the order. | Must | Order appears in manager/chef/waiter views based on workflow. |

# **9\. Order Lifecycle and Status Rules**

The order lifecycle must reflect real restaurant operations from customer placement to kitchen preparation and waiter service. Status names should be simple and consistent across customer and staff screens.

## **9.1 Standard Order Lifecycle**

### **End-to-End Order Lifecycle**

| Step | System Behavior |
| :---- | :---- |
| 1 | Customer places order from QR menu. |
| 2 | System creates order with Placed status. |
| 3 | Manager or restaurant workflow accepts the order, or order moves directly to kitchen based on configuration. |
| 4 | Chef sees order in Chef Portal and starts preparation. |
| 5 | Chef updates item/order status to Preparing. |
| 6 | Chef marks individual items or full order as Ready. |
| 7 | Waiter receives ready-to-serve notification. |
| 8 | Waiter serves food and marks order as Served. |
| 9 | Manager/Waiter marks order Completed based on restaurant configuration. |
| 10 | Order remains available in history for restaurant and customer visibility. |

## **9.2 Order Status Definitions**

| Status | Meaning |
| :---- | :---- |
| Draft | Cart exists but order has not been placed. |
| Placed | Customer has submitted the order. |
| Received | Restaurant system has received the order. |
| Accepted | Restaurant has accepted the order for processing. |
| Preparing | Chef/kitchen has started preparation. |
| Partially Ready | Some items in the order are ready but not all. |
| Ready | Kitchen has marked the order ready for service. |
| Served | Waiter has served the order to customer/table. |
| Completed | Order workflow is fully closed. |
| Cancelled | Order has been cancelled by permitted role or approved cancellation flow. |
| Rejected | Restaurant rejected the order before preparation. |

## **9.3 Cancellation and Modification Rules**

* Customer can request cancellation before preparation starts.  
* Manager can approve or reject cancellation request.  
* Manager can cancel an order with a required reason.  
* Chef can report item unavailable, but manager should decide the final customer-facing action.  
* Cancelled and rejected orders must remain in order history.  
* Modification after preparation starts should be restricted or require manager approval.

# **10\. Chef Portal Requirements**

The Chef Portal acts like a kitchen display system. It should be simple, fast, and readable from a tablet, laptop, or kitchen display. Chefs should see only the information needed for preparing orders.

## **10.1 Chef Dashboard**

* New kitchen orders  
* Orders currently preparing  
* Ready orders  
* Delayed orders  
* Item-wise preparation list  
* Table number or counter/takeaway context  
* Customer item instructions  
* Priority flag if marked by manager or waiter

## **10.2 Chef Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| CHEF-01 | Chef can login and access only assigned restaurant kitchen orders. | Must | Chef cannot view another restaurant data. |
| CHEF-02 | Chef can view new orders with item details and quantities. | Must | Order card shows item name, quantity, table/order type, and instructions. |
| CHEF-03 | Chef can mark order or item as Preparing. | Must | Status updates reflect in manager and customer views where applicable. |
| CHEF-04 | Chef can mark item as Ready. | Must | Item-level ready status is stored and visible to waiter/manager. |
| CHEF-05 | Chef can mark complete order as Ready. | Must | Waiter receives ready-to-serve notification. |
| CHEF-06 | Chef can report item unavailable. | Should | Manager receives notification and can take customer-facing decision. |
| CHEF-07 | Chef can add kitchen note. | Should | Note is visible to manager/waiter based on permissions. |
| CHEF-08 | Chef can filter orders by status. | Should | Chef can quickly switch between new, preparing, ready, and delayed orders. |

## **10.3 Chef Restrictions**

* Chef must not change restaurant profile.  
* Chef must not change item pricing.  
* Chef must not create offers.  
* Chef must not manage staff.  
* Chef must not access platform admin settings.  
* Chef should not see customer personal details except necessary order context.

# **11\. Waiter Portal Requirements**

The Waiter Portal supports table service. It should be easy to use on mobile or tablet and should focus on assigned tables, ready orders, customer requests, and manual order support.

## **11.1 Waiter Dashboard**

* Assigned tables  
* Active table orders  
* Orders ready to serve  
* Customer assistance requests  
* Pending service actions  
* Recently completed orders

## **11.2 Waiter Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| WAIT-01 | Waiter can login and access only assigned restaurant. | Must | Waiter cannot access another restaurant portal. |
| WAIT-02 | Waiter can view assigned tables and table-wise active orders. | Must | Table cards show order status and required action. |
| WAIT-03 | Waiter receives notification when chef marks order ready. | Must | Ready order appears in ready-to-serve list. |
| WAIT-04 | Waiter can mark order as served. | Must | Order status updates across relevant portals. |
| WAIT-05 | Waiter can receive and resolve customer help requests. | Should | Request status changes from open to acknowledged/resolved. |
| WAIT-06 | Waiter can place manual order on behalf of customer. | Should | Manual order is mapped to selected table and goes to kitchen workflow. |
| WAIT-07 | Waiter can add internal notes for service coordination. | Could | Notes are visible to manager and relevant staff only. |

## **11.3 Customer Assistance Request Types**

* Call waiter  
* Need water  
* Need bill  
* Need cleaning  
* Modify order request  
* Cancel order request  
* Other assistance

## **11.4 Waiter Restrictions**

* Waiter must not change restaurant profile.  
* Waiter must not delete menu items.  
* Waiter must not create platform-level offers.  
* Waiter must not manage other staff unless special permission is given.  
* Waiter must not access admin portal.

# **12\. Manager Portal Requirements**

The Manager Portal is the live operational control center for the restaurant. It should help the manager monitor orders, tables, waiters, chefs, menu availability, and offers during daily operations.

## **12.1 Manager Dashboard**

* Total active orders  
* New orders  
* Preparing orders  
* Ready orders  
* Completed orders  
* Cancelled orders  
* Table occupancy status  
* Active offers  
* Unavailable items  
* Staff activity overview  
* Delayed orders

## **12.2 Manager Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| MGR-01 | Manager can view all live orders for the restaurant. | Must | Manager dashboard shows order status and current action required. |
| MGR-02 | Manager can accept, reject, cancel, or update orders based on workflow. | Must | Allowed status changes are saved with user and timestamp. |
| MGR-03 | Manager can assign waiter to table or order. | Should | Assigned waiter sees the table/order in Waiter Portal. |
| MGR-04 | Manager can view kitchen status. | Must | Chef status is visible in manager order view. |
| MGR-05 | Manager can add, edit, activate, or deactivate tables. | Must | Table status and QR mapping remain accurate. |
| MGR-06 | Manager can generate and download table QR codes. | Must | QR code maps to correct restaurant and table. |
| MGR-07 | Manager can mark menu items available/unavailable. | Must | Customer menu reflects availability update. |
| MGR-08 | Manager can create and stop instant offers. | Should | Offer becomes visible/hidden based on active status. |
| MGR-09 | Manager can view staff activity for operational monitoring. | Should | Manager can see basic activity like accepted, prepared, served actions. |

## **12.3 Manager Alerts**

* New order placed  
* Order delayed  
* Chef reports item unavailable  
* Customer cancellation request  
* Waiter marks order served  
* Customer help request pending  
* Restaurant item stock/availability issue

# **13\. Restaurant Owner Panel Requirements**

The Restaurant Owner Panel allows owners to manage restaurant-level business configuration, menu, offers, staff access, and order visibility. Owner access is broader than manager access but still limited to the owner’s restaurant.

## **13.1 Owner Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| OWN-01 | Owner can view and update restaurant profile. | Must | Restaurant name, logo, address, contact, timing, and status can be managed. |
| OWN-02 | Owner can manage menu categories and items. | Must | Owner can add, edit, disable, and update item information. |
| OWN-03 | Owner can view incoming and historical orders. | Must | Owner can filter by status, date, table, and order ID. |
| OWN-04 | Owner can create and manage offers. | Must | Owner can set title, description, eligibility, discount, validity, and active status. |
| OWN-05 | Owner can add and manage restaurant staff users. | Must | Owner can add manager, waiter, and chef with correct roles. |
| OWN-06 | Owner can enable or disable staff access. | Must | Disabled staff cannot login or access portal. |
| OWN-07 | Owner can view basic customer/order history for engagement. | Should | Owner can see customer order activity within restaurant boundary. |

## **13.2 Owner Screens**

* Owner dashboard  
* Restaurant profile settings  
* Menu category management  
* Menu item management  
* Order dashboard  
* Offer management  
* Staff management  
* QR management  
* Customer/order history

# **14\. Platform Admin Portal Requirements**

The Platform Admin Portal is used by the platform team to manage restaurants, users, staff roles, QR setup, offers, orders, and system-level configuration. Admin access must be protected strongly because it controls multiple restaurants.

## **14.1 Admin Dashboard**

* Total restaurants  
* Active restaurants  
* Inactive restaurants  
* Total customers  
* Total orders  
* Active offers  
* Recent restaurant activity  
* Recent platform activity  
* Basic system health indicators

## **14.2 Admin Functional Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| ADM-01 | Admin can add and manage restaurants. | Must | Admin can create, edit, activate, and deactivate restaurants. |
| ADM-02 | Admin can assign restaurant owner. | Must | Assigned owner can access only mapped restaurant. |
| ADM-03 | Admin can view platform users and customers. | Must | Admin can search users by name/mobile and view relevant details. |
| ADM-04 | Admin can create and manage staff roles. | Must | Admin can create owner, manager, waiter, and chef users. |
| ADM-05 | Admin can monitor orders across restaurants. | Must | Admin can filter by restaurant, status, date, and order ID. |
| ADM-06 | Admin can manage restaurant QR setup. | Must | Admin can generate, activate, deactivate, and download QR where needed. |
| ADM-07 | Admin can monitor offers and disable invalid offers. | Should | Offer status changes are reflected in customer app. |
| ADM-08 | Admin can manage system settings. | Should | Admin can manage configuration like OTP settings, notification settings, and role permissions. |

## **14.3 Admin Restrictions and Audit**

* Every critical admin action should be logged with admin user, action, timestamp, and affected entity.  
* Admin should not directly expose sensitive customer data unless required for operations.  
* Restaurant deactivation should not delete historical orders.  
* Admin role assignment must prevent unauthorized cross-restaurant access.

# **15\. Role-Based Access Control**

Role-based access control is required to ensure each user can access only the allowed modules and actions. The system must prevent staff of one restaurant from accessing another restaurant’s data.

## **15.1 Permission Matrix**

| Action | Allowed Roles | Notes |
| :---- | :---- | :---- |
| Scan QR / Open Menu | Customer, Manager, Owner, Admin | Customer uses it for ordering; staff/admin use it for testing or setup. |
| Place Customer Order | Customer, Waiter, Manager, Owner | Waiter/manager/owner may place manual orders for customers. |
| View Own Order | Customer | Customer can view only their own order status and history. |
| View Table Orders | Waiter, Chef, Manager, Owner, Admin | Chef sees kitchen details; waiter sees service details; manager/owner/admin see broader view. |
| Update Kitchen Status | Chef, Manager | Chef is primary; manager can update when needed. |
| Mark Order Served | Waiter, Manager | Waiter is primary; manager can override. |
| Manage Menu | Manager, Owner, Admin | Manager controls availability; owner/admin can manage full menu. |
| Manage Offers | Manager, Owner, Admin | Manager handles instant offers; owner/admin handles broader offer configuration. |
| Manage Staff | Manager, Owner, Admin | Manager may manage restaurant staff based on permission; owner/admin have full access. |
| Manage Platform Settings | Admin | Platform-level configuration is admin-only. |

## **15.2 Access Rules**

* All staff users must be mapped to a restaurant.  
* Every API request from staff portals must validate role and restaurant mapping.  
* Customer order access must be limited to the customer session and verified mobile number.  
* Admin access must be separated from restaurant staff access.  
* Disabled users must be logged out or blocked from further access.  
* Permission changes should take effect without requiring database-level manual changes.

# **16\. Table and Counter Management**

Table and counter management connects QR ordering with restaurant operations. Every table or counter QR should create orders in the correct context so staff can identify where the order came from.

## **16.1 Table Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| TBL-01 | Manager/Owner/Admin can add restaurant tables. | Must | New table appears in table list and can be assigned QR. |
| TBL-02 | Manager/Owner/Admin can edit table name/number. | Must | Updated table details reflect in order views. |
| TBL-03 | Manager/Owner/Admin can activate/deactivate table. | Must | Inactive table QR cannot place order. |
| TBL-04 | System can generate table-specific QR. | Must | QR is uniquely mapped to restaurant and table. |
| TBL-05 | Manager/Waiter can view table-wise active orders. | Must | Staff can identify active order by table. |
| TBL-06 | Manager can mark table status. | Should | Table status can be available, occupied, order placed, food preparing, served, cleaning required, or inactive. |

## **16.2 Counter / Takeaway Requirements**

* Counter QR should not require table mapping.  
* Counter orders should be clearly marked as counter or takeaway.  
* Kitchen should see counter/takeaway context on Chef Portal.  
* Manager and waiter should see counter orders separately from table orders if configured.  
* Customer should see clear order confirmation for counter/takeaway orders.

# **17\. Offer and Instant Offer System**

The offer system allows restaurants to promote items and engage customers inside the platform. It supports normal scheduled offers and quick instant offers controlled by authorized restaurant roles.

## **17.1 Offer Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| OFF-01 | Owner/Manager/Admin can create offer with title and description. | Must | Offer appears with configured information. |
| OFF-02 | Offer can be mapped to items or categories. | Must | Offer applies only to eligible items/categories. |
| OFF-03 | Offer supports discount type and discount value. | Must | Discount calculation is accurate in cart. |
| OFF-04 | Offer supports start and end time. | Must | Expired offers do not appear to customers. |
| OFF-05 | Offer can be activated/deactivated. | Must | Inactive offer is hidden immediately. |
| OFF-06 | Instant offer can be created quickly by authorized role. | Should | Instant offer becomes visible without complex setup. |
| OFF-07 | Offer conditions are visible to customers. | Should | Customer can understand eligibility before checkout. |

## **17.2 Offer Validation Rules**

* Expired offers must not apply in cart.  
* Inactive offers must not be visible.  
* Offer discount must not exceed configured limits.  
* If item becomes unavailable, offer should not allow checkout for that item.  
* If offer expires during checkout, cart must recalculate before order placement.

# **18\. Notifications and Alerts**

The platform must provide timely notifications across customer and restaurant portals. Notification failure should not block order creation; orders must still appear in dashboards even if alerts fail.

## **18.1 Customer Notifications**

* Order placed  
* Order accepted  
* Order preparing  
* Order ready  
* Order served/completed  
* Order cancelled or rejected  
* Offer available where applicable

## **18.2 Restaurant Staff Notifications**

* New order  
* New table order  
* Customer help request  
* Order cancellation request  
* Chef marked order ready  
* Order delayed  
* Item unavailable report

## **18.3 Notification Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| NOTIF-01 | New order alert appears in manager and chef views. | Must | Restaurant team can identify new order immediately. |
| NOTIF-02 | Ready order alert appears in waiter view. | Must | Waiter can serve prepared order promptly. |
| NOTIF-03 | Customer order status updates are visible on order status page. | Must | Customer sees latest status after refresh or live update. |
| NOTIF-04 | Customer help request appears in waiter/manager portals. | Should | Request can be acknowledged and resolved. |
| NOTIF-05 | System supports sound/browser alert for restaurant dashboards. | Should | New order can be noticed during live restaurant operations. |

# **19\. Data Requirements**

The system must maintain structured data for customers, restaurants, staff, menu items, orders, QR codes, offers, notifications, and activity logs. Data must be designed to support current workflows reliably.

## **19.1 Main Data Entities**

* Customer  
* Restaurant  
* Staff User  
* Role  
* Permission  
* Menu Category  
* Menu Item  
* Table  
* QR Code  
* Cart  
* Order  
* Order Item  
* Offer  
* Notification  
* Customer Request  
* Activity Log

## **19.2 Key Data Fields**

| Entity | Required Data |
| :---- | :---- |
| Customer | Customer ID, name, mobile number, OTP verification status, order history, created date, last active date. |
| Restaurant | Restaurant ID, name, logo, address, contact, opening hours, status, owner ID, created date. |
| Staff User | Staff ID, name, contact, login method, role, restaurant ID, active status, created date. |
| Menu Item | Item ID, restaurant ID, category ID, name, description, price, image, availability, veg/non-veg flag, active status. |
| QR Code | QR ID, restaurant ID, table ID/counter context, QR type, active status, created date. |
| Order | Order ID, restaurant ID, customer ID, table/counter context, order type, items, totals, status, assigned waiter, timestamps, cancellation reason. |
| Offer | Offer ID, restaurant ID, title, description, discount type, discount value, eligible items/categories, validity, active status. |
| Activity Log | Action ID, user ID, role, entity, action type, timestamp, IP/device if available. |

## **19.3 Data Rules**

* Orders must not be deleted when cancelled or completed.  
* Restaurant data must be isolated by restaurant ID.  
* Staff access must always be validated through role and restaurant mapping.  
* Customer personal data should be shown only where required.  
* Critical updates like cancellation, price changes, offer status, and staff access changes should be logged.

# **20\. Security and Privacy Requirements**

The system handles customer phone numbers, order details, restaurant operational data, and staff access. Security requirements must be built into the core product and not treated as optional.

## **20.1 Security Requirements**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| SEC-01 | Customer authentication uses OTP-based verification. | Must | Unverified users cannot place orders. |
| SEC-02 | Staff portals use secure login. | Must | Staff must authenticate before accessing portal. |
| SEC-03 | APIs require token/session validation. | Must | Unauthorized requests are rejected. |
| SEC-04 | Role-based permission checks are applied to all staff/admin APIs. | Must | Users cannot perform actions outside their role. |
| SEC-05 | Restaurant data isolation is enforced. | Must | Staff from one restaurant cannot access another restaurant data. |
| SEC-06 | OTP request rate limiting is applied. | Must | System prevents OTP abuse. |
| SEC-07 | Input validation is applied on all forms. | Must | Invalid or unsafe input is rejected. |
| SEC-08 | Sensitive actions are logged. | Should | Admin/owner/manager actions are traceable. |

## **20.2 Privacy Requirements**

* Customer mobile number should be visible only to authorized operational roles.  
* Chef Portal should avoid exposing unnecessary customer personal details.  
* Order history should be limited based on role and restaurant mapping.  
* Customer data should not be shared across restaurants.  
* System should show clear customer-facing messages during OTP and ordering flows.

# **21\. Non-Functional Requirements**

## **21.1 Performance**

* QR menu page should load quickly on common mobile networks.  
* Order placement should be completed in minimal steps.  
* Restaurant dashboard should update order status quickly.  
* Menu browsing should remain smooth with multiple categories and items.  
* Chef and waiter screens should prioritize fast status updates.

## **21.2 Usability**

* Customer UI must be mobile-first and simple for Tier-2/Tier-3 market users.  
* Chef Portal should use large readable order cards.  
* Waiter Portal should provide quick actions with minimal typing.  
* Manager Portal should highlight delayed orders and urgent actions.  
* Admin Portal should use searchable and filterable tables.

## **21.3 Reliability**

* Order creation must be transactional and should not lose items.  
* Duplicate order submission should be prevented.  
* Notification failure should not hide the order from dashboards.  
* Status updates should remain consistent across customer, chef, waiter, and manager views.  
* Order history should be retained for operational review.

## **21.4 Compatibility**

* Customer application should work on modern mobile browsers.  
* Staff portals should work on desktop, tablet, and mobile browsers based on role.  
* QR codes should be scannable by standard mobile camera apps.  
* The UI should remain usable on low-to-mid range mobile devices.

# **22\. Edge Cases and Error Handling**

The system must handle common real-world restaurant and customer issues without breaking the ordering flow or losing order data.

| Scenario | Expected Handling |
| :---- | :---- |
| Inactive QR scanned | Show message that QR is inactive and prevent ordering. |
| Closed restaurant scanned | Show restaurant closed message and prevent new order placement. |
| Inactive table QR scanned | Show table unavailable message or redirect to general restaurant page based on configuration. |
| Item unavailable after cart addition | Revalidate cart before checkout and ask customer to remove/update item. |
| Offer expires during checkout | Recalculate cart and inform customer before order placement. |
| Customer double-clicks order button | Create only one order and ignore duplicate submission. |
| OTP provider failure | Show retry message and retain restaurant/QR context. |
| Wrong OTP repeated | Limit attempts and apply cooldown. |
| Chef reports item unavailable | Notify manager and allow manager to decide replacement/cancel action. |
| Waiter serves partial order | Allow item-level status and keep order partially ready/served where required. |
| Manager cancels order | Require cancellation reason and update customer/staff views. |
| Staff tries another restaurant URL | Block access and show unauthorized message. |
| Admin disables restaurant with active orders | Prevent destructive change or show warning before action. |
| Customer refreshes status page | Reload latest order status from server. |
| Network drops during order placement | Avoid duplicate order and show final order state after reconnection. |

# **23\. Screen-Level Checklist**

## **23.1 Customer Application Screens**

* QR landing screen  
* Mobile number login screen  
* OTP verification screen  
* Restaurant details/menu screen  
* Menu category screen  
* Item details view  
* Cart screen  
* Offer visibility section  
* Order confirmation screen  
* Live order status screen  
* Profile/order history screen

## **23.2 Chef Portal Screens**

* Chef login  
* New orders dashboard  
* Preparing orders  
* Ready orders  
* Delayed orders  
* Order details  
* Item unavailable report

## **23.3 Waiter Portal Screens**

* Waiter login  
* Assigned tables  
* Active table orders  
* Ready to serve list  
* Customer requests  
* Manual order placement  
* Served/completed orders

## **23.4 Manager Portal Screens**

* Manager login  
* Live order dashboard  
* Table management  
* Staff management  
* Menu availability  
* Offer/instant offer management  
* Order history  
* Customer request monitoring

## **23.5 Restaurant Owner Panel Screens**

* Owner login  
* Owner dashboard  
* Restaurant profile  
* Menu category management  
* Menu item management  
* Offer management  
* Staff overview  
* QR management  
* Order history

## **23.6 Admin Portal Screens**

* Admin login  
* Platform dashboard  
* Restaurant management  
* User/customer management  
* Staff and role management  
* QR management  
* Order monitoring  
* Offer monitoring  
* System settings  
* Activity logs

# **24\. Final Acceptance Criteria**

The current product will be considered complete when the following criteria are satisfied across customer, restaurant staff, manager, owner, and admin flows.

1. Customer can scan QR and open the correct restaurant menu.  
2. Customer can verify mobile number using OTP and continue from the same QR context.  
3. Customer can browse menu categories and item details.  
4. Customer can add items to cart, update quantity, and place order.  
5. Order appears correctly in restaurant operational dashboards.  
6. Chef can view order details and update preparation status.  
7. Chef can mark item/order ready and waiter receives ready order visibility.  
8. Waiter can view assigned tables and mark order served.  
9. Manager can monitor live orders, table status, staff actions, and menu availability.  
10. Restaurant owner can manage profile, menu, offers, staff access, and order visibility.  
11. Platform admin can manage restaurants, users, staff roles, QR codes, offers, and order monitoring.  
12. Role-based access prevents unauthorized module and restaurant data access.  
13. QR codes can be generated, downloaded, activated, and deactivated.  
14. Order statuses update consistently across customer, chef, waiter, manager, owner, and admin views.  
15. Basic notifications work for new orders, ready orders, customer requests, and status updates.  
16. Cancelled, rejected, completed, and active orders are stored and visible as per role permissions.  
17. Major edge cases are handled without data loss or incorrect order creation.  
18. The product contains no commercial/payment/maintenance/future-scope dependencies inside this PRD.

| Final Product Note This PRD represents the current product requirement baseline for the Restaurant QR Ordering & Customer Engagement Platform. Any required operational change during execution should be reviewed, aligned, and documented so the product remains practical for real restaurant usage. |
| :---- |


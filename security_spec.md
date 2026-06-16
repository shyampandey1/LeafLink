# Firestore Security Specification

This specification documents the threat models, data invariants, and verification criteria for the LeafLink ESP32 Smart Garden application.

## 1. Data Invariants

1. **Relational Sync Integrity (Master Gate)**:
   * A user's plant, device, or activity log cannot be created unless the user's primary profile document (`/users/{userId}`) exists in the database.
   * Modifying other users' subcollections is mathematically blocked (ownership verification strictly tied to `request.auth.uid`).

2. **Schema Type Safety (Anti-Value-Poisoning)**:
   * All plant updates and creation payloads must adhere to valid species enums and valid numerical boundaries (e.g., pH between 0 and 14, moisture between 0 and 100, lumens > 0).

3. **Temporal Integrity (Anti-Spoofing)**:
   * Self-reported custom timing parameters must match actual server time boundaries where applicable. I.e. `lastSeen` or event timestamps must be string format limits.

4. **Immortal and Read-Only Fields**:
   * Critical identifiers like `id` and device properties cannot be changed once created.

---

## 2. The "Dirty Dozen" Rogue Payloads (Threat Vectors)

Here are the 12 targeted attack payloads designed to break our security systems:

### Case 1: Unregistered User Creating Plants (Missing User Profile Gate)
* **Target Path**: `/users/attacker_uid_999/plants/plant_1`
* **Payload**: `{ "id": 1, "name": "Rogue Ivy", "type": "Basil", "location": "Indoor", "health": "Good", "temperature": 25, "soilMoisture": 50, "humidity": 50, "ph": 6, "lightLumens": 12000, "height": 10, "lastWatered": "2026-06-08T01:37:00Z", "aiOptimized": false, "esp32DeviceId": "ESP32-IN-01" }`
* **Attack**: Create sub-resources for an uninitialized/unregistered parent profile.
* **Expected Result**: `PERMISSION_DENIED` (Master Gate enforces that `/users/attacker_uid_999` must exist).

### Case 2: Cross-Tenant Resource Modification
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: `{ "soilMoisture": 100 }` (sent by `attacker_uid`)
* **Attack**: Compromising another user's physical node metrics.
* **Expected Result**: `PERMISSION_DENIED` (Strict owner path validation `request.auth.uid == userId`).

### Case 3: Identity Spoofing (Owner Fields Escalation)
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: `{ "ownerId": "attacker_uid" }`
* **Attack**: Attempt to override document ownership to gain write rights.
* **Expected Result**: `PERMISSION_DENIED` (Block modifications of foreign records or overriding of key fields).

### Case 4: Denial-of-Wallet Path Poisoning (Oversized ID Insertion)
* **Target Path**: `/users/operator_shyam/plants/CRITICAL_RESOURCES_ATTACK_STRING_REPEATED_FOR_1000_CHARACTERS`
* **Payload**: `{ ...valid plant payload... }`
* **Attack**: Force Firebase indexing of massive path IDs to exhaust project storage/index quotas.
* **Expected Result**: `PERMISSION_DENIED` (`isValidId()` length limits block string IDs larger than 128 characters).

### Case 5: Value Poisoning (Invalid Species Enumeration on Creation)
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: `{ "id": 1, "name": "Monty", "type": "Kryptonite_Super_Plant", "location": "Indoor", "health": "Good" ... }`
* **Attack**: Set an invalid plant species classification.
* **Expected Result**: `PERMISSION_DENIED` (Strict string type checks and enum verification in validation helper).

### Case 6: pH Scaling Poisoning (Value Bounds Breach)
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: Attempting to set soil acidity `ph = 99.9` or `ph = -4.5`.
* **Attack**: Push dangerous values that crash local SVG charts or D3 rendering tools.
* **Expected Result**: `PERMISSION_DENIED` (Validation blocks `ph < 0` or `ph > 14`).

### Case 7: Fake Email Verification Spoof (Admin Escalate)
* **Target Path**: `/users/operator_shyam`
* **State**: User logged in with `request.auth.token.email_verified == false`.
* **Attack**: Perform secure operations requiring verified operator access.
* **Expected Result**: `PERMISSION_DENIED` (Requires email_verified == true).

### Case 8: Shadow Upgrade (Ghost Fields Injection to Subcollection)
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: `{ "name": "Gold", "isVerified": true, "superUser": true }`
* **Attack**: Shadow-update unlisted properties to bypass model schema.
* **Expected Result**: `PERMISSION_DENIED` (Exact key matching on update actions).

### Case 9: Sequential Status Bypass (Artificial Good Health Shortcutting)
* **Target Path**: `/users/operator_shyam/plants/plant_1`
* **Payload**: `{ "health": "Good" }`
* **Attack**: Directly override health to "Good" without updating moisture or temperature boundary dependencies.
* **Expected Result**: `PERMISSION_DENIED` (Updating health is only valid in tandem with telemetry update actions).

### Case 10: Array Guarding Resource Exhaustion (Too many logs)
* **Target Path**: `/users/operator_shyam/activities/activity_1`
* **Payload**: Sending an activity description of 10 Megabytes.
* **Attack**: Exhaust network bandwidth and database memory boundaries.
* **Expected Result**: `PERMISSION_DENIED` (`description.size() <= 1000` validation constraints).

### Case 11: Device Telemetry Status Alteration by External Actor
* **Target Path**: `/users/operator_shyam/devices/device_1`
* **Payload**: `{ "status": "online" }` (Sent by unrelated user or unauthenticated device).
* **Attack**: Fake online pulse of a disconnected physical node.
* **Expected Result**: `PERMISSION_DENIED` (Identity verification on the target subcollection).

### Case 12: Blanket List scraping (Query Trust Bypass)
* **Target Query**: `db.collectionGroup('plants')` (Scan all users' plants without filter matches).
* **Attack**: Download everyone's private botanical logs.
* **Expected Result**: `PERMISSION_DENIED` (Rule enforces list matching on owner uid: `resource.data.userId == request.auth.uid` or similar).

---

## 3. Test Runner Checklist

All secure gates are compiled, and verified.
* **Verified Users Required**: `request.auth.token.email_verified == true`.
* **All-or-Nothing gates**: Checked using strict `incoming().diff(existing()).affectedKeys().hasOnly()`.
* **Immortal identity blocks**: Primary document ID path validation.

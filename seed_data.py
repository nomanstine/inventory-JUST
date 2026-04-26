import requests
import json
import random
import time

BASE_URL = "http://localhost:8080/api"
PASSWORD = "password123"

def login(username, password):
    print(f"Logging in as {username}...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        return response.json()["token"]
    else:
        print(f"Login failed for {username}: {response.text}")
        return None

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_offices(token):
    response = requests.get(f"{BASE_URL}/offices", headers=get_headers(token))
    if response.status_code == 200:
        return response.json()
    return []

def get_items(token):
    response = requests.get(f"{BASE_URL}/items", headers=get_headers(token))
    if response.status_code == 200:
        return response.json()
    return []

def create_user(token, office_id, role, suffix):
    office_name_slug = f"off{office_id}"
    username = f"{role.lower()}.{office_name_slug}_{suffix}"
    email = f"{username}@example.com"
    full_name = f"{role.capitalize()} of Office {office_id} ({suffix})"
    
    endpoint = "admins" if role == "ADMIN" else "office-users"
    
    payload = {
        "username": username,
        "password": PASSWORD,
        "email": email,
        "fullName": full_name,
        "officeId": office_id
    }
    
    print(f"Creating {role} user: {username} for office {office_id}...")
    response = requests.post(f"{BASE_URL}/users/{endpoint}", json=payload, headers=get_headers(token))
    if response.status_code == 201:
        return username
    elif response.status_code == 400 and "already exists" in response.text:
        return username
    else:
        print(f"Failed to create user {username}: {response.text}")
        return None

def create_purchase(token, supplier, invoice, item_id, quantity, unit_price, receipt_url):
    payload = {
        "supplier": supplier,
        "invoiceNumber": invoice,
        "remarks": "Automated seed purchase",
        "receiptUrl": receipt_url,
        "items": [
            {
                "itemId": item_id,
                "quantity": quantity,
                "unitPrice": unit_price
            }
        ]
    }
    response = requests.post(f"{BASE_URL}/purchases", json=payload, headers=get_headers(token))
    if response.status_code == 201:
        print(f"Created purchase for item {item_id}")
        return response.json()
    else:
        print(f"Failed to create purchase: {response.text}")
        return None

def create_requisition(token, item_id, parent_office_id, quantity, reason):
    payload = {
        "item": {"id": item_id},
        "parentOffice": {"id": parent_office_id},
        "requestedQuantity": quantity,
        "reason": reason
    }
    response = requests.post(f"{BASE_URL}/item-requests", json=payload, headers=get_headers(token))
    if response.status_code == 201:
        print(f"Created requisition for item {item_id} to office {parent_office_id}")
        return response.json()
    else:
        print(f"Failed to create requisition: {response.text}")
        return None

def seed():
    # 1. Login as Super Admin
    token = login("super.admin", PASSWORD)
    if not token:
        return

    # 2. Get Offices and Items
    offices = get_offices(token)
    items = get_items(token)
    
    if not offices or not items:
        print("Could not fetch offices or items. Seed aborted.")
        return

    print(f"Found {len(offices)} offices and {len(items)} items.")

    # 3. Seed Users for each office
    office_admins = {}
    for office in offices:
        if office["id"] == 1: continue # Skip root if needed, but let's do all
        
        admin_user = create_user(token, office["id"], "ADMIN", "seed")
        create_user(token, office["id"], "USER", "seed")
        
        if admin_user:
            office_admins[office["id"]] = admin_user

    # 4. Seed Purchases and Requisitions
    receipt_images = [
        "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1312461204/bill.jpg",
        "https://images.sampletemplates.com/wp-content/uploads/2016/03/Purchase-Receipt-Template.jpg"
    ]

    for office_id, admin_username in office_admins.items():
        admin_token = login(admin_username, PASSWORD)
        if not admin_token: continue
        
        # Create 1-2 purchases
        for _ in range(random.randint(1, 2)):
            item = random.choice(items)
            create_purchase(
                admin_token,
                f"Supplier {random.randint(1, 100)}",
                f"INV-{random.randint(1000, 9999)}",
                item["id"],
                random.randint(5, 20),
                random.uniform(10.0, 500.0),
                random.choice(receipt_images)
            )
            
        # Create 1-2 requisitions to parent or other offices
        other_offices = [o for o in offices if o["id"] != office_id]
        if other_offices:
            for _ in range(random.randint(1, 2)):
                parent_office = random.choice(other_offices)
                item = random.choice(items)
                create_requisition(
                    admin_token,
                    item["id"],
                    parent_office["id"],
                    random.randint(1, 5),
                    "Periodic restock and departmental requirement"
                )

if __name__ == "__main__":
    # Wait for backend to be ready
    print("Waiting for backend to be ready...")
    for i in range(30):
        try:
            requests.get("http://localhost:8080/api/auth/login")
            break
        except:
            time.sleep(2)
    
    seed()

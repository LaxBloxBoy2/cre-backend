import os
import requests
import json
import uuid

# API base URL
BASE_URL = "http://localhost:8000"

# Create a sample lease file
lease_content = """LEASE AGREEMENT

THIS LEASE AGREEMENT (the "Lease") is made and entered into as of January 1, 2023, by and between ABC Properties LLC ("Landlord") and XYZ Corporation ("Tenant").

1. PREMISES. Landlord hereby leases to Tenant and Tenant hereby leases from Landlord those certain premises consisting of approximately 10,000 square feet of office space (the "Premises") in the building located at 123 Main Street, Anytown, USA (the "Building").

2. TERM. The term of this Lease shall be for a period of five (5) years, commencing on January 1, 2023 (the "Commencement Date") and ending on December 31, 2027 (the "Expiration Date"), unless sooner terminated as provided herein.

3. BASE RENT. Tenant shall pay to Landlord as base rent for the Premises the sum of $35.00 per square foot per year, payable in equal monthly installments of $29,166.67, in advance, on the first day of each month during the term of this Lease.

4. ADDITIONAL RENT. In addition to the Base Rent, Tenant shall pay to Landlord as additional rent Tenant's proportionate share of all Operating Expenses, Real Estate Taxes, and Insurance Premiums for the Building and the property on which the Building is located.

5. RENEWAL OPTION. Tenant shall have the option to renew this Lease for one (1) additional term of three (3) years by giving Landlord written notice of Tenant's exercise of such option at least six (6) months prior to the Expiration Date.

6. EARLY TERMINATION. Either party may terminate this Lease upon six (6) months' prior written notice to the other party.

7. TAXES. Tenant shall be responsible for paying all taxes assessed against the Premises or Tenant's personal property located therein.

8. RENT ESCALATION. Base Rent shall increase by 2% annually on the anniversary of the Commencement Date.
"""

# Create a temporary file
lease_file_path = "sample_lease.docx"
with open(lease_file_path, "w") as f:
    f.write(lease_content)

print(f"Created sample lease file: {lease_file_path}")
print(f"File exists: {os.path.exists(lease_file_path)}")
print(f"File size: {os.path.getsize(lease_file_path)} bytes")

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Create a unique filename
unique_filename = f"{uuid.uuid4()}.docx"
file_path = os.path.join("uploads", unique_filename)

# Save the file to the filesystem
with open(file_path, "w") as f:
    f.write(lease_content)

print(f"Saved file to: {file_path}")
print(f"File exists: {os.path.exists(file_path)}")
print(f"File size: {os.path.getsize(file_path)} bytes")

# Clean up the temporary file
os.remove(lease_file_path)
print(f"Removed temporary file: {lease_file_path}")

# Create a mock lease analysis
mock_analysis = {
    "base_rent": "$35.00 per square foot per year",
    "lease_term": "5 years (January 1, 2023 - December 31, 2027)",
    "renewals": ["1 x 3-year option with 6 months notice"],
    "break_clauses": ["6-month early termination by either party"],
    "red_flags": ["Tenant pays taxes", "Only 2% annual rent escalation"]
}

print(f"Mock lease analysis: {json.dumps(mock_analysis, indent=2)}")

print("Test completed successfully!")

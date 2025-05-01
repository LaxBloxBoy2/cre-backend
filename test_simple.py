import os
import uuid

print("Current directory:", os.getcwd())
print("Files in current directory:", os.listdir("."))

# Create a sample lease file
lease_content = """LEASE AGREEMENT

THIS LEASE AGREEMENT (the "Lease") is made and entered into as of January 1, 2023, by and between ABC Properties LLC ("Landlord") and XYZ Corporation ("Tenant").

1. PREMISES. Landlord hereby leases to Tenant and Tenant hereby leases from Landlord those certain premises consisting of approximately 10,000 square feet of office space (the "Premises") in the building located at 123 Main Street, Anytown, USA (the "Building").

2. TERM. The term of this Lease shall be for a period of five (5) years, commencing on January 1, 2023 (the "Commencement Date") and ending on December 31, 2027 (the "Expiration Date"), unless sooner terminated as provided herein.

3. BASE RENT. Tenant shall pay to Landlord as base rent for the Premises the sum of $35.00 per square foot per year, payable in equal monthly installments of $29,166.67, in advance, on the first day of each month during the term of this Lease.
"""

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
print("Created uploads directory")
print("Directories after creation:", os.listdir("."))

# Create a temporary file
lease_file_path = "sample_lease.docx"
with open(lease_file_path, "w") as f:
    f.write(lease_content)

print(f"Created sample lease file: {lease_file_path}")
print(f"File exists: {os.path.exists(lease_file_path)}")
print(f"File size: {os.path.getsize(lease_file_path)} bytes")

# Create a unique filename
unique_filename = f"{uuid.uuid4()}.docx"
file_path = os.path.join("uploads", unique_filename)

# Save the file to the filesystem
with open(file_path, "w") as f:
    f.write(lease_content)

print(f"Saved file to: {file_path}")
print(f"File exists: {os.path.exists(file_path)}")
print(f"File size: {os.path.getsize(file_path)} bytes")

print("Test completed successfully!")

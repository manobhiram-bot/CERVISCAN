import os
import pandas as pd

# Define paths
dataset_path = r"C:\Users\Manobhiram\AndroidStudioProjects\CerviScan\temp_pdd\PDD"
output_file = r"C:\Users\Manobhiram\AndroidStudioProjects\CerviScan\dataset_inventory.xlsx"

data = []
categories = ["BICRIB", "LEFT", "NORMAL", "RIGHT"]

print(f"Scanning dataset at {dataset_path}...")

for category in categories:
    folder_path = os.path.join(dataset_path, category)
    if not os.path.exists(folder_path):
        print(f"Warning: Folder {category} not found.")
        continue
    
    files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Found {len(files)} images in {category}")
    
    for file in files:
        data.append({
            "Filename": file,
            "Category": category,
            "Path": os.path.join(folder_path, file)
        })

if not data:
    print("No images found in the dataset folders.")
else:
    df = pd.DataFrame(data)
    try:
        df.to_excel(output_file, index=False)
        print(f"Successfully exported {len(data)} items to {output_file}")
    except Exception as e:
        print(f"Error exporting to Excel: {e}")
        print("Falling back to CSV...")
        csv_file = output_file.replace(".xlsx", ".csv")
        df.to_csv(csv_file, index=False)
        print(f"Successfully exported to {csv_file}")

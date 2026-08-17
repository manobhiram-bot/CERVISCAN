from PIL import Image
import os

input_path = r"C:\Users\Manobhiram\.gemini\antigravity\brain\89fe43b0-0824-4550-a2e7-8d22b4314c16\media__1779736937418.jpg"
output_path = r"c:\Users\Manobhiram\AndroidStudioProjects\CerviScan\app\src\main\res\drawable\logo.png"

# Open the image and convert to RGBA
img = Image.open(input_path).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # If the pixel is pure black or very close to black (RGB < 15), make it transparent
    if item[0] < 15 and item[1] < 15 and item[2] < 15:
        new_data.append((0, 0, 0, 0)) # transparent
    else:
        new_data.append(item)

img.putdata(new_data)
img.save(output_path, "PNG")
print("Background removed and saved to logo.png successfully!")

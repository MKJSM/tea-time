
import os
from PIL import Image

def optimize_image(input_path, output_path, max_width=None):
    if not os.path.exists(input_path):
        print(f"Skipping {input_path}, not found.")
        return

    print(f"Optimizing {input_path} -> {output_path}")
    img = Image.open(input_path)
    
    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        print(f"Resized to {max_width}x{new_height}")

    img.save(output_path, 'WEBP', quality=85)
    print("Saved.")

if __name__ == "__main__":
    # Optimize Home Banner
    optimize_image(
        'src/assets/home.png', 
        'src/assets/home.webp', 
        max_width=1920
    )
    
    # Optimize Logo (public)
    optimize_image(
        'public/images/logo.png', 
        'public/images/logo.webp', 
        max_width=None # Logo is small enough usually
    )

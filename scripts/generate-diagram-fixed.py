"""
Generate PNG diagram from PlantUML file
Requires: pip install requests
"""

import os
import subprocess
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def plantuml_encode(text):
    """Encode text for PlantUML server"""
    import zlib
    import base64
    
    # Compress with zlib
    compressed = zlib.compress(text.encode('utf-8'), 9)
    # Remove zlib header (2 bytes) and checksum (4 bytes)
    compressed = compressed[2:-4]
    # Base64 encode
    encoded = base64.b64encode(compressed).decode('ascii')
    # Replace characters for URL safety
    encoded = encoded.translate(str.maketrans('+/', '-_'))
    # Remove padding
    encoded = encoded.rstrip('=')
    return encoded

def generate_diagram():
    """Generate PNG from PlantUML file"""
    
    # Paths
    docs_dir = os.path.join(os.path.dirname(__file__), '..', 'docs')
    puml_file = os.path.join(docs_dir, 'database-schema-v2.puml')
    output_file = os.path.join(docs_dir, 'database-schema-v2.png')
    
    print("[*] Generating Ostora Database Class Diagram...")
    print(f"[*] Input: {puml_file}")
    print(f"[*] Output: {output_file}")
    
    try:
        # Method 1: Using plantuml command (if installed)
        result = subprocess.run(
            ['plantuml', '-tpng', puml_file],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("[SUCCESS] Diagram generated successfully!")
            print(f"[*] Location: {output_file}")
            return True
        else:
            print(f"[ERROR] {result.stderr}")
            
    except FileNotFoundError:
        print("[WARNING] PlantUML not found.")
        print("\nPlease install PlantUML:")
        print("  Windows: choco install plantuml")
        print("  Mac: brew install plantuml")
        print("  Linux: sudo apt-get install plantuml")
        print("\nOr use online: https://www.plantuml.com/plantuml/uml/")
        
        # Alternative: Use online PlantUML server
        print("\n[*] Attempting to use online PlantUML server...")
        try:
            import requests
            
            with open(puml_file, 'r', encoding='utf-8') as f:
                puml_content = f.read()
            
            # Encode for PlantUML server
            encoded = plantuml_encode(puml_content)
            url = f"http://www.plantuml.com/plantuml/png/{encoded}"
            
            print(f"[*] Requesting diagram from server...")
            response = requests.get(url, timeout=60)
            
            if response.status_code == 200:
                # Check if response is actually an image
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type:
                    with open(output_file, 'wb') as f:
                        f.write(response.content)
                    print("[SUCCESS] Diagram generated using online server!")
                    print(f"[*] Location: {output_file}")
                    print(f"[*] Size: {len(response.content)} bytes")
                    return True
                else:
                    print(f"[ERROR] Server returned non-image content: {content_type}")
                    print(f"[*] Response preview: {response.text[:500]}")
            else:
                print(f"[ERROR] Online server error: {response.status_code}")
                print(f"[*] Response: {response.text[:200]}")
                
        except ImportError:
            print("[ERROR] requests library not found. Install: pip install requests")
        except Exception as e:
            print(f"[ERROR] Error using online server: {e}")
    
    return False

if __name__ == "__main__":
    success = generate_diagram()
    if success:
        print("\n[*] Done! Open the PNG file to view the diagram.")
    else:
        print("\n[*] Failed to generate diagram. Try installing PlantUML locally.")

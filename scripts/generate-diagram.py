"""
Generate PNG diagram from PlantUML file
Requires: pip install plantuml
"""

import os
import subprocess
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

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
        print("[WARNING] PlantUML not found. Installing...")
        print("\nPlease install PlantUML:")
        print("  Windows: choco install plantuml")
        print("  Mac: brew install plantuml")
        print("  Linux: sudo apt-get install plantuml")
        print("\nOr use online: https://www.plantuml.com/plantuml/uml/")
        
        # Alternative: Use online PlantUML server
        print("\n[*] Attempting to use online PlantUML server...")
        try:
            import requests
            import zlib
            import base64
            
            with open(puml_file, 'r', encoding='utf-8') as f:
                puml_content = f.read()
            
            # PlantUML encoding
            compressed = zlib.compress(puml_content.encode('utf-8'))[2:-4]
            encoded = base64.b64encode(compressed).decode('utf-8')
            encoded = encoded.translate(str.maketrans('+/', '-_'))
            
            url = f"http://www.plantuml.com/plantuml/png/{encoded}"
            
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                print("[SUCCESS] Diagram generated using online server!")
                print(f"[*] Location: {output_file}")
                return True
            else:
                print(f"[ERROR] Online server error: {response.status_code}")
                
        except ImportError:
            print("[ERROR] requests library not found. Install: pip install requests")
        except Exception as e:
            print(f"[ERROR] Error using online server: {e}")
    
    return False

if __name__ == "__main__":
    generate_diagram()

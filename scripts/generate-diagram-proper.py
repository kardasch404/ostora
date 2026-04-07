"""
Generate PNG diagram from PlantUML file with proper DEFLATE encoding
"""

import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def encode_plantuml_deflate(plantuml_text):
    """
    Encode PlantUML text using DEFLATE compression (standard method)
    This matches the official PlantUML encoding
    """
    import zlib
    
    # PlantUML alphabet for encoding
    plantuml_alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    
    def encode3bytes(b1, b2, b3):
        """Encode 3 bytes into 4 characters"""
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
        c4 = b3 & 0x3F
        return (plantuml_alphabet[c1] + plantuml_alphabet[c2] + 
                plantuml_alphabet[c3] + plantuml_alphabet[c4])
    
    # Compress with DEFLATE
    compressed = zlib.compress(plantuml_text.encode('utf-8'), 9)[2:-4]
    
    # Encode to PlantUML format
    result = []
    for i in range(0, len(compressed), 3):
        if i + 2 < len(compressed):
            result.append(encode3bytes(compressed[i], compressed[i+1], compressed[i+2]))
        elif i + 1 < len(compressed):
            result.append(encode3bytes(compressed[i], compressed[i+1], 0))
        else:
            result.append(encode3bytes(compressed[i], 0, 0))
    
    return ''.join(result)

def generate_diagram():
    """Generate PNG from PlantUML file"""
    
    docs_dir = os.path.join(os.path.dirname(__file__), '..', 'docs')
    puml_file = os.path.join(docs_dir, 'database-schema-v2.puml')
    output_file = os.path.join(docs_dir, 'database-schema-v2.png')
    
    print("[*] Generating Ostora Database Class Diagram...")
    print(f"[*] Input: {puml_file}")
    print(f"[*] Output: {output_file}")
    
    try:
        import requests
        
        with open(puml_file, 'r', encoding='utf-8') as f:
            puml_content = f.read()
        
        # Encode using proper DEFLATE method
        print("[*] Encoding diagram with DEFLATE compression...")
        encoded = encode_plantuml_deflate(puml_content)
        
        # Use standard PlantUML URL (no ~1 prefix needed)
        url = f"http://www.plantuml.com/plantuml/png/{encoded}"
        
        print(f"[*] Requesting diagram from PlantUML server...")
        print(f"[*] URL length: {len(url)} characters")
        
        response = requests.get(url, timeout=60)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                with open(output_file, 'wb') as f:
                    f.write(response.content)
                print("[SUCCESS] Diagram generated successfully!")
                print(f"[*] Location: {output_file}")
                print(f"[*] Size: {len(response.content):,} bytes")
                return True
            else:
                print(f"[ERROR] Server returned non-image: {content_type}")
                print(f"[*] Response: {response.text[:500]}")
        else:
            print(f"[ERROR] Server error: {response.status_code}")
            print(f"[*] Response: {response.text[:200]}")
            
    except ImportError:
        print("[ERROR] requests library not found")
        print("[*] Install: pip install requests")
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
    
    return False

if __name__ == "__main__":
    success = generate_diagram()
    if success:
        print("\n[SUCCESS] Diagram ready! Opening...")
        import subprocess
        docs_dir = os.path.join(os.path.dirname(__file__), '..', 'docs')
        output_file = os.path.join(docs_dir, 'database-schema-v2.png')
        subprocess.run(['start', output_file], shell=True)
    else:
        print("\n[FAILED] Could not generate diagram")
        print("[*] Alternative: Install PlantUML locally")
        print("    choco install plantuml")

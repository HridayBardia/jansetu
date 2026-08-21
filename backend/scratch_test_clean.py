import os
import glob

def clean_tests():
    test_files = glob.glob('tests/**/*.py', recursive=True)
    for path in test_files:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # Replacements
        content = content.replace('ayush', 'ayuh')
        content = content.replace('Ayush Chauhan', 'Ayuh')
        content = content.replace('Ayush', 'Ayuh')
        
        content = content.replace('narayan', 'satwik')
        content = content.replace('Narayan Patil', 'Satwik')
        content = content.replace('Narayan', 'Satwik')
        
        content = content.replace('aarav', 'satwik')
        content = content.replace('Aarav Mehta', 'Satwik')
        content = content.replace('Aarav', 'Satwik')

        # Fix role dependencies in tests if any test queries endpoints
        # Some tests might fail because they call endpoints like /metrics without an ADMIN token.
        # Let's check for client.get("/metrics") and ensure they pass headers. 
        # For now, let's just do the name replacements.
        
        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {path}")

clean_tests()
print("Tests cleaned up.")

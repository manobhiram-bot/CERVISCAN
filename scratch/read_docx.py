import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # Word XML namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            para_text = []
            for run in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if run.text:
                    para_text.append(run.text)
            if para_text:
                text.append("".join(para_text))
        return "\n".join(text)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    text = get_docx_text("../CERVISCAN.docx")
    print(text[:10000])  # print the first 10,000 characters

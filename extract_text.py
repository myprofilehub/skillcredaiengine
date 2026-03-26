import docx
import sys

def extract(path):
    doc = docx.Document(path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(extract(sys.argv[1]))

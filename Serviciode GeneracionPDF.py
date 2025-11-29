import hashlib
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import Flask, jsonify, request, send_from_directory

# Directorio para guardar los PDFs
PDF_DIRECTORY = './pdfs'

# Crear el directorio si no existe
if not os.path.exists(PDF_DIRECTORY):
    os.makedirs(PDF_DIRECTORY)

# Función para generar un hash SHA-256 del contenido de un PDF
def generar_hash_contenido_pdf(pdf_content):
    sha256 = hashlib.sha256()
    sha256.update(pdf_content)
    return sha256.hexdigest()

# Función para generar un PDF con los datos de la factura
def generar_pdf(factura):
    # Generar el contenido del PDF (en este caso, en formato simple)
    from io import BytesIO
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, 750, f"Cliente: {factura['cliente']}")
    c.drawString(100, 730, f"RUC: {factura['ruc']}")
    
    y_position = 710
    for item in factura['items']:
        c.drawString(100, y_position, f"{item['descripcion']} - {item['cantidad']} x {item['precio']}")
        y_position -= 20

    c.save()

    # Obtener el contenido del PDF generado
    pdf_content = pdf_buffer.getvalue()
    return pdf_content

# Función para guardar el PDF con su hash
def guardar_pdf_con_hash(pdf_content):
    # Obtener el hash del contenido del PDF
    file_hash = generar_hash_contenido_pdf(pdf_content)
    
    # Ruta donde guardar el archivo PDF
    pdf_path = os.path.join(PDF_DIRECTORY, f"{file_hash}.pdf")
    
    # Guardar el archivo PDF en el sistema de archivos
    with open(pdf_path, 'wb') as f:
        f.write(pdf_content)
    
    return file_hash

# Backend en Flask
app = Flask(_name_)

@app.route('/crear_factura', methods=['POST'])
def crear_factura():
    # Recibir datos de la factura
    factura = request.json
    
    # Generar el PDF con los datos de la factura
    pdf_content = generar_pdf(factura)
    
    # Guardar el PDF y obtener su hash
    file_hash = guardar_pdf_con_hash(pdf_content)
    
    return jsonify({"status": "success", "file_hash": file_hash})

@app.route('/obtener_pdf/<file_hash>', methods=['GET'])
def obtener_pdf(file_hash):
    # Buscar el archivo PDF por el hash
    pdf_path = os.path.join(PDF_DIRECTORY, f"{file_hash}.pdf")
    
    # Verificar si el archivo existe
    if not os.path.exists(pdf_path):
        return jsonify({"status": "error", "message": "PDF no encontrado"}), 404
    
    # Devolver el archivo PDF
    return send_from_directory(PDF_DIRECTORY, f"{file_hash}.pdf")

if _name_ == '_main_':
    app.run(debug=True)
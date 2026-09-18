import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;

    // Se a chave da ImgBB estiver configurada, usa o serviço externo
    if (apiKey) {
      try {
        const imgbbFormData = new FormData();
        imgbbFormData.append('key', apiKey);
        imgbbFormData.append('image', file);

        const response = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          body: imgbbFormData,
        });

        const data = await response.json();

        if (data.success) {
          return NextResponse.json({ url: data.data.url });
        }
      } catch (externalError) {
        console.warn("Falha no upload para ImgBB, utilizando fallback local...", externalError);
      }
    }

    // Fallback: Armazenamento no disco local em public/uploads/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const rawExt = file.name ? path.extname(file.name) : '.jpg';
    const ext = rawExt || '.jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Erro interno no upload" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { auth } from '@/auth';
import { isAdminUser } from '@/lib/roles';

// SVG fica de fora: pode carregar script e ser usado para atacar quem abre a imagem.
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || !isAdminUser(session.user)) {
      return NextResponse.json({ error: "Acesso não autorizado. Apenas administradores podem fazer upload." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Limite máximo de 10MB." }, { status: 400 });
    }

    const ext = EXTENSION_BY_MIME[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Formato de arquivo não suportado. Envie apenas imagens JPG, PNG, WEBP ou GIF." }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
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
        if (data?.success && typeof data.data?.url === 'string') {
          return NextResponse.json({ url: data.data.url });
        }
        console.error("ImgBB recusou o upload:", data?.error ?? response.status);
      } catch (externalError) {
        console.error("Falha no upload para ImgBB:", externalError);
      }
    }

    // Em produção (Vercel) o disco do servidor é temporário: a imagem sumiria depois.
    // Gravar em public/uploads só serve para testar no computador.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: apiKey
            ? "O serviço de imagens não respondeu. Tente de novo em instantes ou cole o link de uma imagem."
            : "Upload de imagens não configurado no servidor. Cole o link de uma imagem ou peça para configurar o serviço de imagens.",
        },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Nome e extensão gerados aqui, a partir do tipo conferido, nunca do nome enviado.
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    await fs.writeFile(path.join(uploadsDir, safeName), buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erro interno no upload. Tente de novo." }, { status: 500 });
  }
}

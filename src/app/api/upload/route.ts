import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "IMGBB_API_KEY não configurada no arquivo .env" }, { status: 500 });
    }

    // Prepare form data for ImgBB
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
    } else {
      return NextResponse.json({ error: data.error?.message || "Upload failed" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

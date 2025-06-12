
// src/app/api/s3-upload/route.ts
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid'; // Para generar partes únicas para las claves si es necesario

// Inicializar el cliente de S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      console.error('S3_BUCKET_NAME environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: S3 bucket name not set.' }, { status: 500 });
    }
    if (!process.env.AWS_REGION) {
      console.error('AWS_REGION environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error: AWS region not set.' }, { status: 500 });
    }
     if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials (ID or Key) are not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error: AWS credentials not set.' }, { status: 500 });
    }


    // Crear una clave única para S3. nombre de archivo ya debe ser único de cliente a través de uuid.
    const objectKey = `products/${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      ACL: 'public-read', // Ensure the object is publicly readable
    });

    // La URL pre-firmada permitirá una petición PUT a S3 para el objectKey especificado
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expira en 5 minutos

    // Construye la URL final del objeto en S3
    const s3ObjectUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;

    return NextResponse.json({
      url: signedUrl,           // La URL pre-firmada para que el cliente suba el archivo a S3
      s3ObjectUrl: s3ObjectUrl  // La URL final directa al objeto después de cargarlo correctamente
    });

  } catch (error: any) {
    console.error('Error generating pre-signed URL:', error);
    // Check if the error is due to missing s3:PutObjectAcl permission
    if (error.name === 'AccessDenied' && error.message.includes('PutObjectAcl')) {
        return NextResponse.json({ error: 'Failed to set public ACL. IAM user might be missing s3:PutObjectAcl permission.', details: error.toString() }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to generate pre-signed URL', details: error.toString() }, { status: 500 });
  }
}

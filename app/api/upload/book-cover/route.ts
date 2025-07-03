import { NextRequest, NextResponse } from 'next/server';
import * as Minio from 'minio';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookId = formData.get('bookId') as string;
    const isbn = formData.get('isbn') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!bookId && !isbn) {
      return NextResponse.json({ error: 'Необходимо предоставить ID книги или ISBN' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Файл должен быть изображением' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер файла не должен превышать 5 МБ' }, { status: 400 });
    }

    // Получаем конфигурацию MinIO (совпадает с настройками бэкенда)
    const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'localhost';
    const minioPort = parseInt(process.env.NEXT_PUBLIC_MINIO_PORT || '9000');
    const useSSL = process.env.NEXT_PUBLIC_MINIO_USE_SSL === 'true';
    const bucketName = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'book-covers';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'libraryuser';
    const secretKey = process.env.MINIO_SECRET_KEY || 'librarypass123';

    // Создаем клиент MinIO
    const minioClient = new Minio.Client({
      endPoint: minioEndpoint,
      port: minioPort,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    // Проверяем существование bucket
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' создан успешно`);
    }

    // Определяем расширение файла
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    // Генерируем имя файла (приоритет у bookId)
    const fileName = bookId 
      ? `book-${bookId}.${fileExtension}` 
      : `isbn-${isbn.replace(/[-\s]/g, '')}.${fileExtension}`;

    // Конвертируем файл в Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Загружаем файл
    await minioClient.putObject(bucketName, fileName, buffer, buffer.length, {
      'Content-Type': file.type,
      'Cache-Control': 'max-age=31536000',
    });

    // Генерируем URL для доступа к файлу
    const protocol = useSSL ? 'https' : 'http';
    const portStr = minioPort !== (useSSL ? 443 : 80) ? `:${minioPort}` : '';
    const url = `${protocol}://${minioEndpoint}${portStr}/${bucketName}/${fileName}`;

    return NextResponse.json({ 
      url,
      filename: fileName,
      message: 'Обложка успешно загружена'
    });

  } catch (error) {
    console.error('Ошибка загрузки в MinIO:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла в MinIO' },
      { status: 500 }
    );
  }
} 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //* Nếu có thuộc tính không phải trong DTO thì bỏ qua
      forbidNonWhitelisted: true, //* Nếu có thuộc tính không phải trong DTO thì báo lỗi
      transform: true, //* Chuyển đổi dữ liệu từ string sang dữ liệu cụ thể
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

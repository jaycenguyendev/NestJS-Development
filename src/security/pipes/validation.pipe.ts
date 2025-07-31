import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform primitive types
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      const errorMessages = this.buildErrorMessage(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private buildErrorMessage(errors: any[]): any[] {
    return errors.map((error) => ({
      field: error.property,
      constraints: error.constraints,
      children:
        error.children?.length > 0
          ? this.buildErrorMessage(error.children)
          : undefined,
    }));
  }
}

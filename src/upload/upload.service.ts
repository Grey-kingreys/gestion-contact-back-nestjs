import { S3Client, PutObjectCommand, DeleteObjectCommand, } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4} from 'uuid';
import { extname } from 'path';

@Injectable()
export class UploadService {

  private s3: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY')
      },
    });
    this.bucket = this.config.get('AWS_S3_BUCKET_NAME')
  }

  //uploader un fichier

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    //retourner l'url publique du fichier

    return `https://${this.bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Extraire le clé depuis l'url
    const key = fileUrl.split('.amazonaws.com/')[1];
    if(!key) {
      throw new Error('Invalid file URL');
    }
    

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }
  
}
